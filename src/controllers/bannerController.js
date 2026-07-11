const HomeBanner = require('../models/HomeBanner');

const sortSlots = (slots) => [...slots].sort((a, b) => a.order - b.order);

const getBanner = async (req, res) => {
  try {
    const banner = await HomeBanner.getOrCreate();
    res.json({ success: true, slots: sortSlots(banner.slots), updatedAt: banner.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chequeo liviano (sin slots/imagenes) para que el cliente sepa si su copia
// en caché sigue al día -- el banner cambia como mucho una o dos veces por
// mes, así que no tiene sentido volver a traer las imágenes completas cada
// vez que se abre Home. Solo cuando esta fecha no coincide con la cacheada
// vale la pena pedir /api/banner entero.
const getBannerVersion = async (req, res) => {
  try {
    const banner = await HomeBanner.getOrCreate();
    res.json({ success: true, updatedAt: banner.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upsertSlot = async (req, res) => {
  try {
    const order = Number(req.params.order);
    if (!Number.isInteger(order) || order < 0 || order > 7) {
      return res.status(400).json({ success: false, message: 'order debe ser un entero entre 0 y 7' });
    }

    const { animeTitle, animeRaw, provider, image, message } = req.body;
    if (!animeTitle || !animeRaw || !provider || !image) {
      return res.status(400).json({ success: false, message: 'animeTitle, animeRaw, provider e image son requeridos' });
    }

    const banner = await HomeBanner.getOrCreate();
    const slot = { order, animeTitle, animeRaw, provider, image, message: message || '' };
    const idx = banner.slots.findIndex((s) => s.order === order);
    if (idx >= 0) banner.slots[idx] = slot;
    else banner.slots.push(slot);

    await banner.save();
    res.json({ success: true, slots: sortSlots(banner.slots), updatedAt: banner.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const order = Number(req.params.order);
    const banner = await HomeBanner.getOrCreate();
    banner.slots = banner.slots.filter((s) => s.order !== order);
    await banner.save();
    res.json({ success: true, slots: sortSlots(banner.slots), updatedAt: banner.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBanner, getBannerVersion, upsertSlot, deleteSlot };
