const User = require('../models/User'); // Asumiendo que existe el modelo User
const Friendship = require('../models/Friendship');
const UserProgress = require('../models/UserProgress');

// Buscar usuarios por nombre
exports.searchUsers = async (req, res) => {
  try {
    const { name } = req.query;
    const users = await User.find({
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { user: { $regex: name, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }, // No encontrarse a sí mismo
      isAdmin: { $ne: true } // El admin nunca aparece en busquedas de usuarios normales
    }).select('name user').limit(10);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enviar solicitud de amistad
exports.sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'ID de destinatario requerido' });
    }

    // Verificar si ya existe una solicitud entre ambos usuarios
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Ya son amigos' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Ya existe una solicitud pendiente' });
      }
    }

    const friendship = await Friendship.create({
      requester: req.user.id,
      recipient: recipientId
    });
    console.log(`✅ Solicitud enviada: ${req.user.id} -> ${recipientId}`);
    res.json({ success: true, message: 'Solicitud enviada' });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(400).json({ success: false, message: error.message || 'Error al enviar solicitud' });
  }
};

// Aceptar solicitud
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'ID de solicitud requerido' });
    }

    // Verificar que la solicitud existe y el usuario actual es el destinatario
    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
    
    if (friendship.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para aceptar esta solicitud' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'La solicitud ya fue procesada' });
    }

    await Friendship.findByIdAndUpdate(requestId, { status: 'accepted' });
    console.log(`✅ Solicitud de amistad aceptada: ${requestId}`);
    res.json({ success: true, message: 'Amistad aceptada' });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al aceptar la solicitud' });
  }
};

// Obtener solicitudes pendientes recibidas
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user.id,
      status: 'pending'
    }).populate('requester', 'name user');

    const data = requests.map(r => ({
      id: r._id,
      userId: r.requester._id,
      name: r.requester.name,
      user: r.requester.user,
      createdAt: r.createdAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener amigos y sus rachas (Streaks)
exports.getFriendsWithStreaks = async (req, res) => {
  try {
    let friends;

    if (req.user.isAdmin) {
      // El admin "es amigo" de todos automaticamente, sin filas de Friendship reales.
      friends = await User.find({ _id: { $ne: req.user.id } }).select('name user');
    } else {
      const friendships = await Friendship.find({
        $or: [{ requester: req.user.id }, { recipient: req.user.id }],
        status: 'accepted'
      }).populate('requester recipient', 'name user isAdmin');

      friends = friendships
        .map(f => (f.requester._id.toString() === req.user.id ? f.recipient : f.requester))
        .filter(friend => !friend.isAdmin); // el admin queda invisible para usuarios normales
    }

    const friendsData = await Promise.all(friends.map(async (friend) => {
      const progress = await UserProgress.findOne({ userId: friend._id });
      const streak = calculateStreak(progress?.watchedEpisodes || []);
      return {
        id: friend._id,
        name: friend.name,
        user: friend.user,
        streak
      };
    }));

    res.json({ success: true, data: friendsData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function calculateStreak(watchedEpisodes) {
  if (!watchedEpisodes.length) return 0;
  const dates = watchedEpisodes.map(ep => new Date(ep.watchedAt).toDateString());
  const uniqueDates = [...new Set(dates)].map(d => new Date(d)).sort((a,b) => b-a);
  
  let streak = 0;
  let today = new Date();
  today.setHours(0,0,0,0);
  
  // Si la última vez fue hoy o ayer, empezamos a contar
  if (today - uniqueDates[0] > 86400000) return 0;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diff = (uniqueDates[i] - uniqueDates[i+1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak + 1;
}