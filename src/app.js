// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const progressRoutes = require('./routes/progressRoutes');
const timeout = require('connect-timeout');
const chatRoutes = require('./routes/chatRoutes');
const commentRoutes = require('./routes/commentRoutes');
const friendRoutes = require('./routes/friendRoutes');
const streakRoutes = require('./routes/streakRoutes');
const cardRoutes = require('./routes/cardRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const battleRoutes = require('./routes/battleRoutes');
const mangaRoutes = require('./routes/mangaRoutes');


// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB (con DNS personalizado)
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/manga', mangaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de AniStream funcionando',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});


app.use(timeout('30s'));
app.use((req, res, next) => {
    if (req.timedout) {
        res.status(503).json({
            success: false,
            message: 'La solicitud tomó demasiado tiempo'
        });
    } else {
        next();
    }
});
// Importar mongoose para verificar estado
const mongoose = require('mongoose');