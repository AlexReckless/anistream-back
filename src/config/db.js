// config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

// Configurar DNS personalizados
dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        
        console.log('🔄 Conectando a MongoDB...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,    // Aumentado a 30 segundos
            socketTimeoutMS: 60000,              // Aumentado a 60 segundos
            connectTimeoutMS: 30000,             // Aumentado a 30 segundos
            family: 4,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        
        console.log('✅ Conectado a MongoDB Atlas');
        console.log('🔗 Host:', mongoose.connection.host);
        console.log('📦 Base de datos:', mongoose.connection.name);
        
        // Verificar la conexión
        await mongoose.connection.db.admin().ping();
        console.log('🏓 Ping a MongoDB exitoso');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        
        // Reintentar con opciones más permisivas
        console.log('🔄 Reintentando con opciones alternativas...');
        
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 60000,
                socketTimeoutMS: 120000,
                connectTimeoutMS: 60000,
                family: 4,
                tls: true,
                tlsAllowInvalidCertificates: true,
                retryWrites: true,
                retryReads: true,
                maxPoolSize: 5,
            });
            
            console.log('✅ Conectado exitosamente en segundo intento');
        } catch (retryError) {
            console.error('❌ Falló nuevamente:', retryError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;