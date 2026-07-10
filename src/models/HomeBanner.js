// HomeBanner.js — banner de Home curado a mano por el admin (un solo
// documento con hasta 8 slots, igual que Settings.js).
const mongoose = require('mongoose');

const bannerSlotSchema = new mongoose.Schema({
  order: { type: Number, required: true, min: 0, max: 7 },
  animeTitle: { type: String, required: true },
  // Objeto completo que devuelve la busqueda de anime (searchAnime), se le
  // pasa tal cual a AnimeDetail para navegar -- por eso es Mixed.
  animeRaw: { type: mongoose.Schema.Types.Mixed, required: true },
  provider: { type: String, required: true },
  // Imagen propia del admin en base64, nunca la del resultado de busqueda.
  image: { type: String, required: true },
  message: { type: String, default: '' },
}, { _id: false });

const homeBannerSchema = new mongoose.Schema({
  slots: { type: [bannerSlotSchema], default: [] },
}, { timestamps: true });

homeBannerSchema.statics.getOrCreate = async function () {
  return this.findOneAndUpdate({}, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('HomeBanner', homeBannerSchema);
