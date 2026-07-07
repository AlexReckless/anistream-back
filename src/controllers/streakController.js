const Streak = require('../models/Streak');

// Iniciar una racha con un amigo para un anime específico
exports.startStreak = async (req, res) => {
  try {
    const { friendId, animeId, animeTitle, animeImage, totalEpisodes } = req.body;

    if (!friendId || !animeId || !animeTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos: friendId, animeId, animeTitle' 
      });
    }

    // Verificar si ya hay una racha activa con este amigo para este anime
    const existing = await Streak.findOne({
      users: { $all: [req.user.id, friendId] },
      animeId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya tienes una racha activa con este amigo para este anime' 
      });
    }

    const streak = await Streak.create({
      users: [req.user.id, friendId],
      animeId,
      animeTitle,
      animeImage: animeImage || '',
      totalEpisodes: totalEpisodes || 0,
      episodesWatched: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastProgressDate: null,
      status: 'active',
      startedAt: new Date()
    });

    console.log(`🔥 Racha iniciada: ${animeTitle} entre ${req.user.id} y ${friendId}`);

    res.status(201).json({ 
      success: true, 
      data: streak,
      message: '¡Racha iniciada exitosamente!' 
    });
  } catch (error) {
    console.error('Error starting streak:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Registrar progreso en una racha (al ver un episodio)
exports.updateStreakProgress = async (req, res) => {
  try {
    const { streakId, episodeNumber } = req.body;

    if (!streakId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de racha requerido' 
      });
    }

    const streak = await Streak.findById(streakId);
    if (!streak) {
      return res.status(404).json({ 
        success: false, 
        message: 'Racha no encontrada' 
      });
    }

    // Verificar que el usuario pertenece a la racha
    if (!streak.users.some(u => u.toString() === req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No perteneces a esta racha' 
      });
    }

    if (streak.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Esta racha ya no está activa' 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDate = streak.lastProgressDate ? new Date(streak.lastProgressDate) : null;
    let newCurrentStreak = streak.currentStreak;

    if (lastDate) {
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Ya progresó hoy, no aumenta la racha pero sí cuenta el episodio
        console.log('📅 Ya hay progreso hoy, no se aumenta racha');
      } else if (diffDays === 1) {
        // Progresó ayer, racha continúa
        newCurrentStreak += 1;
      } else {
        // Se saltó días, racha se rompe
        newCurrentStreak = 1;
      }
    } else {
      // Primera vez que progresa
      newCurrentStreak = 1;
    }

    // Actualizar streak
    streak.currentStreak = newCurrentStreak;
    streak.longestStreak = Math.max(streak.longestStreak, newCurrentStreak);
    streak.lastProgressDate = today;
    
    // Incrementar episodios vistos si se proporciona
    if (episodeNumber && episodeNumber > streak.episodesWatched) {
      streak.episodesWatched = episodeNumber;
    } else if (episodeNumber) {
      streak.episodesWatched += 1;
    }

    // Verificar si completaron la serie
    if (streak.totalEpisodes > 0 && streak.episodesWatched >= streak.totalEpisodes) {
      streak.status = 'completed';
      streak.completedAt = new Date();
      console.log('🏆 Racha completada!');
    }

    await streak.save();

    console.log(`🔥 Progreso de racha actualizado: ${streak.currentStreak} días seguidos`);

    res.json({ 
      success: true, 
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        episodesWatched: streak.episodesWatched,
        status: streak.status
      },
      message: 'Progreso de racha actualizado' 
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Obtener rachas activas del usuario
exports.getMyStreaks = async (req, res) => {
  try {
    const streaks = await Streak.find({
      users: req.user.id,
      status: 'active'
    }).populate('users', 'name user').sort({ startedAt: -1 });

    const data = streaks.map(s => {
      const friend = s.users.find(u => u._id.toString() !== req.user.id);
      return {
        id: s._id,
        animeId: s.animeId,
        animeTitle: s.animeTitle,
        animeImage: s.animeImage,
        totalEpisodes: s.totalEpisodes,
        episodesWatched: s.episodesWatched,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        friend: friend ? { id: friend._id, name: friend.name, user: friend.user } : null,
        status: s.status,
        lastProgressDate: s.lastProgressDate,
        startedAt: s.startedAt
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting streaks:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Obtener rachas completadas del usuario
exports.getCompletedStreaks = async (req, res) => {
  try {
    const streaks = await Streak.find({
      users: req.user.id,
      status: { $in: ['completed', 'broken'] }
    }).populate('users', 'name user').sort({ completedAt: -1 }).limit(20);

    const data = streaks.map(s => {
      const friend = s.users.find(u => u._id.toString() !== req.user.id);
      return {
        id: s._id,
        animeId: s.animeId,
        animeTitle: s.animeTitle,
        animeImage: s.animeImage,
        totalEpisodes: s.totalEpisodes,
        episodesWatched: s.episodesWatched,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        friend: friend ? { id: friend._id, name: friend.name, user: friend.user } : null,
        status: s.status,
        lastProgressDate: s.lastProgressDate,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        brokenAt: s.brokenAt
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting completed streaks:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};