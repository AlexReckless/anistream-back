const EpisodeComment = require('../models/EpisodeComment');
const User = require('../models/User');

// Publicar un comentario
exports.addComment = async (req, res) => {
  try {
    const { animeId, episodeNumber, content } = req.body;

    // Validar que el usuario está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Debe estar autenticado para comentar' 
      });
    }

    // Validar datos requeridos
    if (!animeId || episodeNumber === undefined || episodeNumber === null || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos: animeId, episodeNumber, content' 
      });
    }

    // Validar que el contenido no esté vacío
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'El comentario no puede estar vacío' 
      });
    }

    // Obtener nombre del usuario
    let userName = req.user.name || req.user.user || 'Usuario';
    
    // Si no tiene nombre, intentar obtenerlo de la base de datos
    if (!userName || userName === 'Usuario') {
      try {
        const user = await User.findById(req.user.id);
        if (user && (user.name || user.user)) {
          userName = user.name || user.user;
        }
      } catch (err) {
        console.error('Error getting user name:', err);
      }
    }
    
    // Crear comentario
    const comment = await EpisodeComment.create({
      animeId: String(animeId),
      episodeNumber: Number(episodeNumber),
      userId: req.user.id,
      userName: userName,
      content: content.trim()
    });

    console.log('✅ Comentario creado:', { animeId, episodeNumber, userId: req.user.id });

    res.status(201).json({ 
      success: true, 
      data: comment,
      message: 'Comentario publicado exitosamente'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al publicar el comentario: ' + error.message 
    });
  }
};

// Obtener comentarios de un episodio
exports.getComments = async (req, res) => {
  try {
    const { animeId, episodeNumber } = req.params;

    // Validar parámetros
    if (!animeId || !episodeNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros: animeId, episodeNumber' 
      });
    }

    const comments = await EpisodeComment.find({ 
      animeId: String(animeId), 
      episodeNumber: parseInt(episodeNumber) 
    }).sort({ createdAt: -1 });

    console.log(`📝 Obteniendo ${comments.length} comentarios para ${animeId} ep ${episodeNumber}`);

    res.json({ 
      success: true, 
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener comentarios: ' + error.message 
    });
  }
};