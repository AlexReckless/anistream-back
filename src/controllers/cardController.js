const Card = require('../models/Card');
const UserProgress = require('../models/UserProgress');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

// Migracion perezosa: copia una sola vez las cartas del Map legado
// (UserProgress.characterCollection) a instancias individuales de Card.
async function ensureCardsMigrated(userId) {
  const progress = await UserProgress.findOne({ userId });
  if (!progress || progress.cardsMigrated) return;

  const collection = progress.getCharacterCollection ? progress.getCharacterCollection() : {};
  const entries = Object.values(collection || {});

  if (entries.length > 0) {
    // Los pulls nuevos ya escriben en Card directamente (ver progressController.addCharacterToCollection).
    // Solo migramos los characterId del Map legado que todavia no tengan ninguna Card,
    // para no duplicar las cartas que ya nacieron como instancias transferibles.
    const existingIds = new Set(
      (await Card.find({ ownerId: userId }).select('characterId')).map((c) => c.characterId)
    );
    const toMigrate = entries.filter((c) => !existingIds.has(String(c.id)));

    if (toMigrate.length > 0) {
      const docs = toMigrate.map((c) => ({
        ownerId: userId,
        characterId: String(c.id),
        characterName: c.name,
        image: c.image,
        anime: c.anime,
        rarity: c.rarity,
        favorites: c.favorites,
        synopsis: c.synopsis,
        source: c.source,
        isOriginal: c.rarity === 'OR',
        obtainedAt: c.obtainedAt || new Date()
      }));
      await Card.insertMany(docs);
    }
  }

  progress.cardsMigrated = true;
  await progress.save();
}

exports.ensureCardsMigrated = ensureCardsMigrated;

// @desc    Obtener mis cartas (dispara migracion perezosa)
// @route   GET /api/cards/mine
// @access  Private
exports.getMyCards = async (req, res) => {
  try {
    await ensureCardsMigrated(req.user.id);
    const cards = await Card.find({ ownerId: req.user.id }).sort({ obtainedAt: -1 });
    res.json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtener las cartas de un amigo (sin OR), para trading/combate
// @route   GET /api/cards/friend/:friendId
// @access  Private
exports.getFriendCards = async (req, res) => {
  try {
    const { friendId } = req.params;

    if (friendId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Usa /api/cards/mine para tu propia colección' });
    }

    if (!req.user.isAdmin) {
      const friendship = await Friendship.findOne({
        status: 'accepted',
        $or: [
          { requester: req.user.id, recipient: friendId },
          { requester: friendId, recipient: req.user.id }
        ]
      });
      if (!friendship) {
        return res.status(403).json({ success: false, message: 'Solo puedes ver las cartas de tus amigos' });
      }
    }

    const friend = await User.findById(friendId).select('name user avatarBase64');
    if (!friend) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await ensureCardsMigrated(friendId);

    // El admin ve TODO, incluidas las cartas OR/Original -- para poder
    // clonar una a su propia coleccion y despues subirla a apiWaifu.
    const cardFilter = req.user.isAdmin
      ? { ownerId: friendId }
      : { ownerId: friendId, isOriginal: { $ne: true }, rarity: { $ne: 'OR' } };

    const cards = await Card.find(cardFilter).sort({ obtainedAt: -1 });

    res.json({
      success: true,
      data: {
        friend: { id: friend._id, name: friend.name, user: friend.user, avatarBase64: friend.avatarBase64 },
        cardCount: cards.length,
        cards
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clonar cualquier carta (de cualquier dueño) a la coleccion del admin
// @route   POST /api/cards/:cardId/clone
// @access  Private (admin)
exports.cloneCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const source = await Card.findById(cardId);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Carta no encontrada' });
    }

    const clone = await Card.create({
      ownerId: req.user.id,
      characterId: source.characterId,
      characterName: source.characterName,
      image: source.image,
      anime: source.anime,
      rarity: source.rarity,
      favorites: source.favorites,
      synopsis: source.synopsis,
      source: source.source,
      isOriginal: source.isOriginal
    });

    res.status(201).json({ success: true, data: clone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Regalar una carta de la PROPIA colección del admin a otro usuario
//          (transferencia de dueño, no clon -- el admin la pierde)
// @route   POST /api/cards/:cardId/gift
// @access  Private (admin)
exports.giftOwnCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId es requerido' });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Carta no encontrada' });
    }
    if (card.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Solo podés regalar cartas de tu propia colección' });
    }

    const target = await User.findById(userId).select('_id');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    card.ownerId = userId;
    card.locked = false;
    await card.save();

    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
