const Battle = require('../models/Battle');
const Card = require('../models/Card');
const Friendship = require('../models/Friendship');

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

async function areFriends(userA, userB) {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requester: userA, recipient: userB },
      { requester: userB, recipient: userA }
    ]
  });
  return Boolean(friendship);
}

// @desc    Retar a un amigo por una de sus cartas (tira su dado de inmediato)
// @route   POST /api/battles
// @access  Private
exports.createBattle = async (req, res) => {
  try {
    const { opponentId, cardId } = req.body;

    if (!opponentId || !cardId) {
      return res.status(400).json({ success: false, message: 'opponentId y cardId son requeridos' });
    }
    if (opponentId === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes combatir contigo mismo' });
    }
    if (!(await areFriends(req.user.id, opponentId))) {
      return res.status(403).json({ success: false, message: 'Solo puedes combatir contra tus amigos' });
    }

    const card = await Card.findById(cardId);
    if (!card || card.ownerId.toString() !== opponentId) {
      return res.status(404).json({ success: false, message: 'Esa carta no pertenece a ese amigo' });
    }
    if (card.isOriginal || card.rarity === 'OR') {
      return res.status(400).json({ success: false, message: 'Las cartas originales (OR) no se pueden disputar' });
    }
    if (card.locked) {
      return res.status(409).json({ success: false, message: 'Esa carta ya está en otro intercambio o combate' });
    }

    card.locked = true;
    await card.save();

    const battle = await Battle.create({
      challenger: req.user.id,
      opponent: opponentId,
      card: cardId,
      challengerRoll: rollD20(),
      status: 'pending'
    });

    res.json({ success: true, message: '¡Reto enviado! Tu amigo debe tirar su dado.', data: battle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retos pendientes donde soy el retado (debo tirar mi dado)
// @route   GET /api/battles/incoming
exports.getIncomingBattles = async (req, res) => {
  try {
    const battles = await Battle.find({ opponent: req.user.id, status: 'pending' })
      .populate('challenger', 'name user avatarBase64')
      .populate('card')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: battles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Retos que yo inicié
// @route   GET /api/battles/outgoing
exports.getOutgoingBattles = async (req, res) => {
  try {
    const battles = await Battle.find({ challenger: req.user.id })
      .populate('opponent', 'name user avatarBase64')
      .populate('card')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: battles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Tirar el dado propio y resolver el combate (solo el retado, una vez)
// @route   PATCH /api/battles/:id/roll
exports.rollBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ success: false, message: 'Combate no encontrado' });
    if (battle.opponent.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para tirar en este combate' });
    }
    if (battle.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Este combate ya fue resuelto' });
    }

    let challengerRoll = battle.challengerRoll;
    let opponentRoll = rollD20();
    let attempts = 0;
    while (opponentRoll === challengerRoll && attempts < 10) {
      challengerRoll = rollD20();
      opponentRoll = rollD20();
      attempts += 1;
    }

    const winner = challengerRoll > opponentRoll ? battle.challenger : battle.opponent;

    battle.challengerRoll = challengerRoll;
    battle.opponentRoll = opponentRoll;
    battle.winner = winner;
    battle.status = 'completed';
    battle.resolvedAt = new Date();
    await battle.save();

    await Card.findByIdAndUpdate(battle.card, { ownerId: winner, locked: false });

    res.json({ success: true, data: battle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
