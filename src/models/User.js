// User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const securityQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    enum: [
      'nombre_mascota',
      'nombre_madre',
      'serie_favorita',
      'pelicula_favorita'
    ],
    required: true
  },
  answer: {
    type: String,
    required: true
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  user: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  securityQuestions: [securityQuestionSchema],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  avatarBase64: String,
  bannerBase64: String,
  bio: {
    type: String,
    maxlength: [300, 'La bio no puede superar los 300 caracteres'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Índice de tiempo para ordenamiento de registros
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);

userSchema.on('index', (error) => {
    if (error) console.error('Error creando índice en User:', error);
});