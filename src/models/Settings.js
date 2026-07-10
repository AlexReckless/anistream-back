// Settings.js — configuracion global de la app (un solo documento siempre).
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  pointsPerEpisode: {
    type: Number,
    default: 5,
    min: 0
  }
}, { timestamps: true });

// Siempre hay un unico documento de configuracion. getOrCreate() lo trae (o
// lo crea con los defaults la primera vez) sin tener que acordarse de ningun id.
settingsSchema.statics.getOrCreate = async function () {
  return this.findOneAndUpdate({}, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('Settings', settingsSchema);
