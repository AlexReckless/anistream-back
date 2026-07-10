//authController.js
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const UserProgress = require('../models/UserProgress');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
// controllers/authController.js - Modifica las funciones

// @desc    Registrar usuario
const registerUser = async (req, res) => {
    try {
        const { name, user, email, password, securityQuestions } = req.body;

        // Verificar si el usuario ya existe (con timeout)
        const userExists = await User.findOne({ 
            $or: [{ email }, { user }] 
        }).maxTimeMS(15000); // Timeout de 15 segundos para esta operación

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'El usuario o email ya está registrado'
            });
        }

        // Crear usuario con opciones de timeout
        const newUser = await User.create({
            name,
            user,
            email,
            password,
            securityQuestions
        });

        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                user: newUser.user,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Error en registerUser:', error);
        
        // Mensajes de error más específicos
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({
                success: false,
                message: 'La base de datos está tardando en responder. Por favor, intenta de nuevo.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { user, password } = req.body;

    // Verificar si el usuario existe (por user o email)
    const foundUser = await User.findOne({
      $or: [{ user }, { email: user }]
    });

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordMatch = await foundUser.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = generateToken(foundUser._id);

    res.json({
      success: true,
      token,
      user: {
        id: foundUser._id,
        name: foundUser.name,
        user: foundUser.user,
        email: foundUser.email,
        isAdmin: foundUser.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener preguntas de seguridad de un usuario
// @route   POST /api/auth/get-security-questions
// @access  Public
const getSecurityQuestions = async (req, res) => {
  try {
    const { user } = req.body;
    
    const foundUser = await User.findOne({
      $or: [{ user }, { email: user }]
    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Devolver solo las preguntas, no las respuestas
    const questions = foundUser.securityQuestions.map(q => ({
      question: q.question
    }));

    res.json({
      success: true,
      userId: foundUser._id,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verificar respuestas de seguridad
// @route   POST /api/auth/verify-security-answers
// @access  Public
const verifySecurityAnswers = async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar respuestas
    let allCorrect = true;
    for (let i = 0; i < answers.length; i++) {
      const userAnswer = user.securityQuestions[i];
      if (!userAnswer || userAnswer.answer.toLowerCase() !== answers[i].toLowerCase()) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Respuestas incorrectas'
      });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos
    await user.save();

    res.json({
      success: true,
      resetToken,
      message: 'Respuestas verificadas correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resetear contraseña
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -securityQuestions');
    const progress = await UserProgress.findOne({ userId: req.user.id }).select('watchedEpisodes');
    res.json({
      success: true,
      user: { ...user.toObject(), watchedEpisodesCount: progress?.watchedEpisodes?.length || 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar perfil de usuario (nombre, bio, avatar, banner)
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarBase64, bannerBase64, freethaiApiKey } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof bio === 'string') user.bio = bio.slice(0, 300);
    if (typeof avatarBase64 === 'string') user.avatarBase64 = avatarBase64;
    if (typeof bannerBase64 === 'string') user.bannerBase64 = bannerBase64;
    // string vacio o null = volver a usar la key compartida del chatbot
    if (typeof freethaiApiKey === 'string') user.freethaiApiKey = freethaiApiKey.trim() || null;
    else if (freethaiApiKey === null) user.freethaiApiKey = null;

    await user.save();

    const { password, securityQuestions, ...safeUser } = user.toObject();

    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtener perfil publico de otro usuario (uno mismo o un amigo aceptado)
// @route   GET /api/auth/profile/:userId
// @access  Private
const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id && !req.user.isAdmin) {
      const friendship = await Friendship.findOne({
        status: 'accepted',
        $or: [
          { requester: req.user.id, recipient: userId },
          { requester: userId, recipient: req.user.id }
        ]
      });

      if (!friendship) {
        return res.status(403).json({ success: false, message: 'Solo puedes ver el perfil de tus amigos' });
      }
    }

    const user = await User.findById(userId).select('name user avatarBase64 bannerBase64 bio createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const progress = await UserProgress.findOne({ userId }).select('watchedEpisodes milestone50Seen');
    const watchedEpisodesCount = progress?.watchedEpisodes?.length || 0;

    // El admin visitando el perfil de otro usuario "atiende" el aviso de
    // hito de 50 capitulos -- por eso el badge desaparece recien al entrar.
    if (req.user.isAdmin && userId !== req.user.id && progress && !progress.milestone50Seen) {
      progress.milestone50Seen = true;
      await progress.save();
    }

    res.json({ success: true, user: { ...user.toObject(), watchedEpisodesCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getSecurityQuestions,
  verifySecurityAnswers,
  resetPassword,
  getProfile,
  updateProfile,
  getUserProfileById
};