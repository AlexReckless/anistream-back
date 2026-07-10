const mongoose = require('mongoose');

const watchedEpisodeSchema = new mongoose.Schema({
  animeId: {
    type: String,
    required: true
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
});

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  watchedEpisodes: [watchedEpisodeSchema],
  points: {
    type: Number,
    default: 0
  },
  characterCollection: {
    type: Map,
    of: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      anime: String,
      rarity: { type: String, required: true },
      info: String,
      synopsis: String,
      favorites: Number,
      source: String,
      obtainedAt: { type: Date, default: Date.now }
    },
    default: new Map()
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  cardsMigrated: {
    type: Boolean,
    default: false
  }
});

// Índices
userProgressSchema.index({ userId: 1 }, { unique: true });
userProgressSchema.index({ 'watchedEpisodes.animeId': 1, 'watchedEpisodes.episodeNumber': 1 });
userProgressSchema.index({ points: -1 });
userProgressSchema.index({ lastUpdated: -1 });

// Método para verificar si un episodio está visto
userProgressSchema.methods.isEpisodeWatched = function(animeId, episodeNumber) {
  return this.watchedEpisodes.some(
    ep => ep.animeId === animeId && ep.episodeNumber === episodeNumber
  );
};

// Método para marcar episodio como visto. pointsAward lo decide el llamador
// (el controller lo trae de Settings.pointsPerEpisode, configurable por el admin).
userProgressSchema.methods.markEpisodeAsWatched = async function(animeId, episodeNumber, pointsAward = 5) {
  if (!this.isEpisodeWatched(animeId, episodeNumber)) {
    this.watchedEpisodes.push({
      animeId,
      episodeNumber,
      watchedAt: new Date()
    });
    this.points += pointsAward;
    this.lastUpdated = new Date();
    await this.save();
    return { success: true, points: this.points };
  }
  return { success: false, points: this.points };
};

// Método mejorado para agregar personaje a la colección
userProgressSchema.methods.addCharacterToCollection = async function(character) {
  if (!character || !character.id || !character.name) {
    throw new Error('Personaje inválido: faltan campos requeridos');
  }
  
  const characterKey = character.id.toString();
  
  // Enriquecer el personaje con campos por defecto
  const enrichedCharacter = {
    id: character.id,
    name: character.name || 'Personaje desconocido',
    image: character.image || 'https://via.placeholder.com/300x400?text=No+Image',
    anime: character.anime || 'Desconocido',
    rarity: character.rarity || 'R',
    info: character.info || character.synopsis || 'No hay información disponible',
    synopsis: character.synopsis || character.info || '',
    favorites: character.favorites || 0,
    source: character.source || 'unknown',
    obtainedAt: character.obtainedAt || new Date()
  };
  
  const existingChar = this.characterCollection.get(characterKey);
  
  // Preservar datos existentes si son mejores
  if (existingChar) {
    if (!enrichedCharacter.synopsis && existingChar.synopsis) {
      enrichedCharacter.synopsis = existingChar.synopsis;
    }
    if (!enrichedCharacter.info && existingChar.info) {
      enrichedCharacter.info = existingChar.info;
    }
    enrichedCharacter.obtainedAt = existingChar.obtainedAt;
  }
  
  this.characterCollection.set(characterKey, enrichedCharacter);
  this.lastUpdated = new Date();
  await this.save();
  return true;
};

// Método para obtener personajes
userProgressSchema.methods.getCharacterCollection = function() {
  const collection = {};
  for (const [key, value] of this.characterCollection) {
    collection[key] = value;
  }
  return collection;
};

// Método para resetear progreso
userProgressSchema.methods.resetProgress = async function() {
  this.watchedEpisodes = [];
  this.points = 0;
  this.characterCollection = new Map();
  this.lastUpdated = new Date();
  await this.save();
  return true;
};

// Middleware para validar antes de guardar
userProgressSchema.pre('save', function(next) {
  // Validar que characterCollection no tenga personajes inválidos
  if (this.characterCollection && this.characterCollection.size > 0) {
    for (const [key, character] of this.characterCollection) {
      if (!character.name || !character.image) {
        console.warn(`Personaje con ID ${key} tiene datos incompletos`);
      }
    }
  }
  next();
});

module.exports = mongoose.model('UserProgress', userProgressSchema);