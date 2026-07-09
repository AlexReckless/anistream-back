// mangaController.js — favoritos e historial de lectura de manga
const MangaProgress = require('../models/MangaProgress');

// Fuentes que ya no existen en anime1v-api-main (se sacaron por bloqueo de
// Cloudflare). Los registros viejos de usuarios que las usaron antes de sacarlas
// se quedan huerfanos en Mongo para siempre si no se filtran aca: el front
// intenta abrir la obra con ese "source" y el backend de manga responde 400
// "Fuente de manga desconocida", pareciendo que la app "quiere abrir ZonaTMO".
const DEAD_SOURCES = new Set(['zonatmo', 'kingcomix']);
const isLiveSource = (entry) => !DEAD_SOURCES.has(entry.source);

async function getOrCreate(userId) {
  let progress = await MangaProgress.findOne({ userId });
  if (!progress) {
    progress = await MangaProgress.create({ userId, favorites: [], readChapters: [] });
  }
  return progress;
}

// @desc    Obtener favoritos de manga
// @route   GET /api/manga/favorites
const getFavorites = async (req, res) => {
  try {
    const progress = await getOrCreate(req.user.id);
    res.json({ success: true, data: progress.favorites.filter(isLiveSource) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Agregar/quitar un manga de favoritos (toggle)
// @route   POST /api/manga/favorites
const toggleFavorite = async (req, res) => {
  try {
    const { source, mangaId, slug, title, cover } = req.body;
    if (!source || !mangaId || !slug || !title) {
      return res.status(400).json({ success: false, message: 'source, mangaId, slug y title son requeridos' });
    }

    const progress = await getOrCreate(req.user.id);
    const existingIdx = progress.favorites.findIndex((f) => f.source === source && f.mangaId === mangaId);

    let isFavorite;
    if (existingIdx >= 0) {
      progress.favorites.splice(existingIdx, 1);
      isFavorite = false;
    } else {
      progress.favorites.push({ source, mangaId, slug, title, cover });
      isFavorite = true;
    }

    await progress.save();
    res.json({ success: true, isFavorite, data: progress.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Historial de lectura (ultimo capitulo leido por obra, mas reciente primero)
// @route   GET /api/manga/history
const getHistory = async (req, res) => {
  try {
    const progress = await getOrCreate(req.user.id);

    const byManga = new Map();
    for (const entry of progress.readChapters.filter(isLiveSource)) {
      const key = `${entry.source}_${entry.mangaId}`;
      const existing = byManga.get(key);
      if (!existing || new Date(entry.readAt) > new Date(existing.readAt)) {
        byManga.set(key, entry);
      }
    }

    const history = Array.from(byManga.values()).sort((a, b) => new Date(b.readAt) - new Date(a.readAt));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Marcar un capitulo como leido (upsert)
// @route   POST /api/manga/read
const markChapterRead = async (req, res) => {
  try {
    const { source, mangaId, slug, title, cover, chapterId, chapterNumber } = req.body;
    if (!source || !mangaId || !chapterId) {
      return res.status(400).json({ success: false, message: 'source, mangaId y chapterId son requeridos' });
    }

    const progress = await getOrCreate(req.user.id);
    const existing = progress.readChapters.find(
      (c) => c.source === source && c.mangaId === mangaId && c.chapterId === chapterId
    );

    if (existing) {
      existing.readAt = new Date();
    } else {
      progress.readChapters.push({
        source,
        mangaId,
        slug,
        title,
        cover,
        chapterId,
        chapterNumber,
        readAt: new Date()
      });
    }

    await progress.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    IDs de capitulos leidos de una obra especifica
// @route   GET /api/manga/read/:source/:mangaId
const getReadChapters = async (req, res) => {
  try {
    const { source, mangaId } = req.params;
    const progress = await getOrCreate(req.user.id);
    const chapterIds = progress.readChapters
      .filter(isLiveSource)
      .filter((c) => c.source === source && c.mangaId === mangaId)
      .map((c) => c.chapterId);
    res.json({ success: true, data: chapterIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
  getHistory,
  markChapterRead,
  getReadChapters
};
