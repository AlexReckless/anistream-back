const Trade = require('../models/Trade');
const Card = require('../models/Card');
const Friendship = require('../models/Friendship');

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

function isOriginalCard(card) {
  return card.isOriginal || card.rarity === 'OR';
}

// @desc    Solicitar un intercambio: N cartas propias por 1 carta de un amigo
// @route   POST /api/trades
// @access  Private
exports.createTrade = async (req, res) => {
  try {
    const { recipientId, requestedCardId, offeredCardIds } = req.body;

    if (!recipientId || !requestedCardId || !Array.isArray(offeredCardIds) || offeredCardIds.length === 0) {
      return res.status(400).json({ success: false, message: 'recipientId, requestedCardId y offeredCardIds son requeridos' });
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes intercambiar contigo mismo' });
    }
    if (!(await areFriends(req.user.id, recipientId))) {
      return res.status(403).json({ success: false, message: 'Solo puedes intercambiar con tus amigos' });
    }

    const requestedCard = await Card.findById(requestedCardId);
    if (!requestedCard || requestedCard.ownerId.toString() !== recipientId) {
      return res.status(404).json({ success: false, message: 'La carta solicitada no pertenece a ese amigo' });
    }
    if (isOriginalCard(requestedCard)) {
      return res.status(400).json({ success: false, message: 'Las cartas originales (OR) no se pueden intercambiar' });
    }
    if (requestedCard.locked) {
      return res.status(409).json({ success: false, message: 'Esa carta ya está en otro intercambio o combate' });
    }

    const offeredCards = await Card.find({ _id: { $in: offeredCardIds } });
    if (offeredCards.length !== offeredCardIds.length) {
      return res.status(404).json({ success: false, message: 'Alguna de tus cartas ofrecidas no existe' });
    }
    for (const card of offeredCards) {
      if (card.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Solo puedes ofrecer cartas que te pertenecen' });
      }
      if (isOriginalCard(card)) {
        return res.status(400).json({ success: false, message: 'Las cartas originales (OR) no se pueden intercambiar' });
      }
      if (card.locked) {
        return res.status(409).json({ success: false, message: 'Una de tus cartas ofrecidas ya está en otro intercambio o combate' });
      }
    }

    requestedCard.locked = true;
    await requestedCard.save();
    await Card.updateMany({ _id: { $in: offeredCardIds } }, { locked: true });

    const trade = await Trade.create({
      requester: req.user.id,
      recipient: recipientId,
      requestedCard: requestedCardId,
      offeredCards: offeredCardIds
    });

    res.json({ success: true, message: 'Solicitud de intercambio enviada', data: trade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Intercambios pendientes que me pidieron a mí
// @route   GET /api/trades/incoming
exports.getIncomingTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ recipient: req.user.id, status: 'pending' })
      .populate('requester', 'name user avatarBase64')
      .populate('requestedCard')
      .populate('offeredCards')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Intercambios que yo pedí
// @route   GET /api/trades/outgoing
exports.getOutgoingTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ requester: req.user.id })
      .populate('recipient', 'name user avatarBase64')
      .populate('requestedCard')
      .populate('offeredCards')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Aceptar un intercambio (solo el destinatario)
// @route   PATCH /api/trades/:id/accept
exports.acceptTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Intercambio no encontrado' });
    if (trade.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para responder este intercambio' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Este intercambio ya fue resuelto' });
    }

    await Card.findByIdAndUpdate(trade.requestedCard, { ownerId: trade.requester, locked: false });
    await Card.updateMany({ _id: { $in: trade.offeredCards } }, { ownerId: trade.recipient, locked: false });

    trade.status = 'accepted';
    trade.resolvedAt = new Date();
    await trade.save();

    res.json({ success: true, message: 'Intercambio aceptado', data: trade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rechazar un intercambio (solo el destinatario)
// @route   PATCH /api/trades/:id/reject
exports.rejectTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Intercambio no encontrado' });
    if (trade.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para responder este intercambio' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Este intercambio ya fue resuelto' });
    }

    await Card.findByIdAndUpdate(trade.requestedCard, { locked: false });
    await Card.updateMany({ _id: { $in: trade.offeredCards } }, { locked: false });

    trade.status = 'rejected';
    trade.resolvedAt = new Date();
    await trade.save();

    res.json({ success: true, message: 'Intercambio rechazado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancelar un intercambio propio aun pendiente
// @route   PATCH /api/trades/:id/cancel
exports.cancelTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Intercambio no encontrado' });
    if (trade.requester.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar este intercambio' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Este intercambio ya fue resuelto' });
    }

    await Card.findByIdAndUpdate(trade.requestedCard, { locked: false });
    await Card.updateMany({ _id: { $in: trade.offeredCards } }, { locked: false });

    trade.status = 'cancelled';
    trade.resolvedAt = new Date();
    await trade.save();

    res.json({ success: true, message: 'Intercambio cancelado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
