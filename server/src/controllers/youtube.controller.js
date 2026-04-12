const { searchVideos } = require('../services/youtube');
const { Topic } = require('../models/StudyPlan.model');

// ─── Search YouTube for a topic ───────────────────────────────────────────────
const searchForTopic = async (req, res, next) => {
  try {
    const { query, subject } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'query is required' });
    }

    const searchQuery = subject ? `${query} ${subject}` : query;
    const videos = await searchVideos(searchQuery);

    res.json({ success: true, query: searchQuery, count: videos.length, videos });
  } catch (err) {
    // Handle YouTube API quota errors gracefully
    if (err.response?.status === 403) {
      return res.status(403).json({ success: false, message: 'YouTube API quota exceeded. Try again tomorrow.' });
    }
    next(err);
  }
};

// ─── Save a video resource to a topic ────────────────────────────────────────
const saveResource = async (req, res, next) => {
  try {
    const { topicId, videoId, title, channel, thumbnail, url } = req.body;

    if (!topicId || !url || !title) {
      return res.status(400).json({ success: false, message: 'topicId, title and url are required' });
    }

    const topic = await Topic.findOne({ _id: topicId, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    // Add resource if not already saved
    if (!topic.resources) topic.resources = [];
    const alreadySaved = topic.resources.some(r => r.videoId === videoId);
    if (alreadySaved) {
      return res.status(409).json({ success: false, message: 'Resource already saved' });
    }

    topic.resources.push({ videoId, title, channel, thumbnail, url });
    await topic.save();

    res.json({ success: true, topic });
  } catch (err) {
    next(err);
  }
};

// ─── Remove a saved resource from a topic ────────────────────────────────────
const removeResource = async (req, res, next) => {
  try {
    const { topicId, videoId } = req.params;

    const topic = await Topic.findOne({ _id: topicId, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    topic.resources = (topic.resources || []).filter(r => r.videoId !== videoId);
    await topic.save();

    res.json({ success: true, message: 'Resource removed' });
  } catch (err) {
    next(err);
  }
};

// ─── Get saved resources for a topic ─────────────────────────────────────────
const getResources = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.topicId, user: req.user._id });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    res.json({ success: true, resources: topic.resources || [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchForTopic, saveResource, removeResource, getResources };