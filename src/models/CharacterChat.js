const mongoose = require('mongoose');

// Schema para mensajes individuales
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: String,       
  imageBase64: String,    
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
});

// Schema del personaje para el chat
const characterChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ── Identificación del personaje ──
  characterId: {
    type: String,
    required: true,
  },
  characterName: {
    type: String,
    required: true,
  },
  characterAnime: String,
  characterRarity: String,

  // ── Media del personaje (Imagen / Video) ──
  imageUrl:    String,
  imageBase64: String,    
  imageIsCustom: {        
    type: Boolean,
    default: false,
  },
  videoUri:    String,    // NUEVO: Para guardar la ruta local del video
  mediaType: {            // NUEVO: 'image' o 'video'
    type: String,
    default: 'image',
  },

  // ── Datos del personaje (para el prompt) ──
  synopsis:    String,
  personality: String,    
  spicyLevel: {           
    type: Number,
    min: 1,
    max: 10,
    default: 3,
  },

  // ── Flag de personaje original ──
  isOriginal: {
    type: Boolean,
    default: false,
  },

  // ── Memoria a largo plazo ──
  summary: {
    type: String,
    default: '',
  },

  // ── Conversación guardada ──
  messages: [messageSchema],

  // ── Ranking del personaje (1-5 estrellas) ──
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },

  // ── Meta ──
  lastChatAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice compuesto — un chat por personaje por usuario
characterChatSchema.index({ userId: 1, characterId: 1 }, { unique: true });
characterChatSchema.index({ userId: 1, lastChatAt: -1 });

module.exports = mongoose.model('CharacterChat', characterChatSchema);