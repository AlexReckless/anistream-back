// adminController.js — funciones exclusivas del usuario admin
const Settings = require('../models/Settings');
const UserProgress = require('../models/UserProgress');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const User = require('../models/User');

// @desc    Ver configuracion global (puntos por capitulo, etc)
// @route   GET /api/admin/settings
// @access  Private (admin)
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getOrCreate();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cambiar configuracion global
// @route   PATCH /api/admin/settings
// @access  Private (admin)
const updateSettings = async (req, res) => {
  try {
    const { pointsPerEpisode } = req.body;
    if (pointsPerEpisode === undefined || !Number.isFinite(pointsPerEpisode) || pointsPerEpisode < 0) {
      return res.status(400).json({ success: false, message: 'pointsPerEpisode debe ser un numero valido (>= 0)' });
    }

    const settings = await Settings.getOrCreate();
    settings.pointsPerEpisode = pointsPerEpisode;
    await settings.save();

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ver el balance de puntos de un usuario puntual
// @route   GET /api/admin/users/:userId/points
// @access  Private (admin)
const getUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await UserProgress.findOne({ userId });
    res.json({ success: true, points: progress ? progress.points : 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Poner el balance de puntos de un usuario a un valor exacto (no delta)
// @route   POST /api/admin/users/:userId/points
// @access  Private (admin)
const setUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (points === undefined || !Number.isFinite(points) || points < 0) {
      return res.status(400).json({ success: false, message: 'points debe ser un numero valido (>= 0)' });
    }

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({ userId, watchedEpisodes: [], points: 0, characterCollection: new Map() });
    }

    const previousPoints = progress.points;
    progress.points = points;
    progress.lastUpdated = new Date();
    await progress.save();

    await Transaction.create({
      userId,
      type: points >= previousPoints ? 'earn' : 'spend',
      amount: Math.abs(points - previousPoints),
      reason: 'admin_adjustment',
      metadata: { previousPoints, newPoints: points, adjustedBy: req.user.id }
    });

    res.json({ success: true, points: progress.points, previousPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Regalar una carta del catálogo de apiWaifu directamente a un usuario
// @route   POST /api/admin/gift-card
// @access  Private (admin)
const giftCard = async (req, res) => {
  try {
    const { userId, characterId, characterName, image, anime, rarity, favorites, synopsis, source } = req.body;

    if (!userId || !characterId || !characterName || !rarity) {
      return res.status(400).json({ success: false, message: 'userId, characterId, characterName y rarity son requeridos' });
    }

    const user = await User.findById(userId).select('_id');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const card = await Card.create({
      ownerId: userId,
      characterId,
      characterName,
      image,
      anime,
      rarity,
      favorites,
      synopsis,
      source: source || 'apiWaifu',
      isOriginal: false
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings, getUserPoints, setUserPoints, giftCard };
