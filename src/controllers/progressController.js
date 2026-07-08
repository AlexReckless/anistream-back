//progressController.js
const UserProgress = require('../models/UserProgress');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');

// @desc    Obtener o crear progreso del usuario
// @route   GET /api/progress
// @access  Private
const getProgress = async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        watchedEpisodes: [],
        points: 0,
        characterCollection: new Map()
      });
    }
    
    res.json({
      success: true,
      data: {
        points: progress.points,
        watchedEpisodes: progress.watchedEpisodes,
        characterCollection: progress.getCharacterCollection(),
        lastUpdated: progress.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Marcar episodio como visto
// @route   POST /api/progress/watch-episode
// @access  Private
const markEpisodeAsWatched = async (req, res) => {
  try {
    const { animeId, episodeNumber } = req.body;
    
    if (!animeId || !episodeNumber) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }
    
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        watchedEpisodes: [],
        points: 0,
        characterCollection: new Map()
      });
    }
    
    const result = await progress.markEpisodeAsWatched(animeId, episodeNumber);
    
    if (result.success) {
      // Registrar transacción
      await Transaction.create({
        userId: req.user.id,
        type: 'earn',
        amount: 5,
        reason: 'watch_episode',
        metadata: { animeId, episodeNumber }
      });
    }
    
    res.json({
      success: result.success,
      points: result.points,
      message: result.success ? 'Episodio marcado como visto' : 'Episodio ya estaba visto'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verificar si episodio está visto
// @route   GET /api/progress/is-watched/:animeId/:episodeNumber
// @access  Private
const isEpisodeWatched = async (req, res) => {
  try {
    const { animeId, episodeNumber } = req.params;
    
    const progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      return res.json({ success: true, isWatched: false });
    }
    
    const isWatched = progress.isEpisodeWatched(animeId, parseInt(episodeNumber));
    
    res.json({
      success: true,
      isWatched
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener puntos del usuario
// @route   GET /api/progress/points
// @access  Private
const getPoints = async (req, res) => {
  try {
    const progress = await UserProgress.findOne({ userId: req.user.id });
    
    const points = progress ? progress.points : 0;
    
    res.json({
      success: true,
      points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Agregar puntos (uso general)
// @route   POST /api/progress/add-points
// @access  Private
const addPoints = async (req, res) => {
  try {
    const { amount, reason, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad inválida'
      });
    }
    
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        watchedEpisodes: [],
        points: 0,
        characterCollection: new Map()
      });
    }
    
    progress.points += amount;
    progress.lastUpdated = new Date();
    await progress.save();
    
    // Registrar transacción
    await Transaction.create({
      userId: req.user.id,
      type: 'earn',
      amount,
      reason: reason || 'other',
      metadata
    });
    
    res.json({
      success: true,
      points: progress.points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Restar puntos
// @route   POST /api/progress/subtract-points
// @access  Private
const subtractPoints = async (req, res) => {
  try {
    const { amount, reason, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad inválida'
      });
    }
    
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene suficientes puntos'
      });
    }
    
    if (progress.points < amount) {
      return res.status(400).json({
        success: false,
        message: 'Puntos insuficientes',
        currentPoints: progress.points
      });
    }
    
    progress.points -= amount;
    progress.lastUpdated = new Date();
    await progress.save();
    
    // Registrar transacción
    await Transaction.create({
      userId: req.user.id,
      type: 'spend',
      amount,
      reason: reason || 'other',
      metadata
    });
    
    res.json({
      success: true,
      points: progress.points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Agregar personaje a la colección
// @route   POST /api/progress/add-character
// @access  Private
// progressController.js - Versión mejorada de addCharacterToCollection
const addCharacterToCollection = async (req, res) => {
  try {
    const { character } = req.body;
    
    if (!character || !character.id) {
      return res.status(400).json({
        success: false,
        message: 'Datos del personaje inválidos'
      });
    }
    
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        watchedEpisodes: [],
        points: 0,
        characterCollection: new Map()
      });
    }
    
    // Asegurar que el personaje tenga todos los campos necesarios
    const enrichedCharacter = {
      id: character.id,
      name: character.name || 'Personaje desconocido',
      image: character.image || 'https://via.placeholder.com/300',
      anime: character.anime || 'Desconocido',
      rarity: character.rarity || getRarityFromFavorites(character.favorites),
      info: character.synopsis || character.info || 'No hay información disponible',
      favorites: character.favorites || 0,
      synopsis: character.synopsis || character.info || '',
      obtainedAt: new Date(),
      source: character.source || 'unknown'
    };
    
    await progress.addCharacterToCollection(enrichedCharacter);

    // Crear también una instancia individual de Card (transferible en trades/combates)
    await Card.create({
      ownerId: req.user.id,
      characterId: String(enrichedCharacter.id),
      characterName: enrichedCharacter.name,
      image: enrichedCharacter.image,
      anime: enrichedCharacter.anime,
      rarity: enrichedCharacter.rarity,
      favorites: enrichedCharacter.favorites,
      synopsis: enrichedCharacter.synopsis,
      source: enrichedCharacter.source,
      isOriginal: enrichedCharacter.rarity === 'OR',
      obtainedAt: enrichedCharacter.obtainedAt
    });

    // Registrar transacción
    await Transaction.create({
      userId: req.user.id,
      type: 'earn',
      amount: 0,
      reason: 'purchase_character',
      metadata: {
        characterId: enrichedCharacter.id,
        characterName: enrichedCharacter.name,
        characterInfo: enrichedCharacter.info
      }
    });
    
    res.json({
      success: true,
      message: 'Personaje agregado a la colección',
      character: enrichedCharacter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Función auxiliar para determinar rareza por favorites
function getRarityFromFavorites(favorites = 0) {
  if (favorites >= 200000) return 'UR';
  if (favorites >= 100000) return 'SSR_SECRET';
  if (favorites >= 50000) return 'SSR';
  if (favorites >= 20000) return 'CR';
  if (favorites >= 5000) return 'SR';
  return 'R';
}

// @desc    Obtener colección de personajes
// @route   GET /api/progress/characters
// @access  Private
const getCharacterCollection = async (req, res) => {
  try {
    const progress = await UserProgress.findOne({ userId: req.user.id });
    
    const characters = progress ? progress.getCharacterCollection() : {};
    
    res.json({
      success: true,
      characters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener historial de transacciones
// @route   GET /api/progress/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Transaction.countDocuments({ userId: req.user.id });
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + transactions.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Sincronizar datos locales
// @route   POST /api/progress/sync
// @access  Private
const syncProgress = async (req, res) => {
  try {
    const { watchedEpisodes, characterCollection, points } = req.body;
    
    let progress = await UserProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        watchedEpisodes: [],
        points: 0,
        characterCollection: new Map()
      });
    }
    
    // Sincronizar episodios vistos (evitar duplicados)
    if (watchedEpisodes && Array.isArray(watchedEpisodes)) {
      for (const episode of watchedEpisodes) {
        const exists = progress.watchedEpisodes.some(
          ep => ep.animeId === episode.animeId && ep.episodeNumber === episode.episodeNumber
        );
        if (!exists) {
          progress.watchedEpisodes.push(episode);
        }
      }
    }
    
    // Sincronizar colección de personajes
    if (characterCollection && typeof characterCollection === 'object') {
      for (const [key, character] of Object.entries(characterCollection)) {
        const exists = progress.characterCollection.has(key);
        if (!exists) {
          progress.characterCollection.set(key, character);
        }
      }
    }
    
    // Sincronizar puntos (tomar el máximo entre local y servidor)
    if (points && points > progress.points) {
      progress.points = points;
    }
    
    progress.lastUpdated = new Date();
    await progress.save();
    
    res.json({
      success: true,
      data: {
        points: progress.points,
        watchedEpisodes: progress.watchedEpisodes,
        characterCollection: progress.getCharacterCollection()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProgress,
  markEpisodeAsWatched,
  isEpisodeWatched,
  getPoints,
  addPoints,
  subtractPoints,
  addCharacterToCollection,
  getCharacterCollection,
  getTransactions,
  syncProgress
};