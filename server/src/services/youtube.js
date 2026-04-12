const axios = require('axios');

const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search YouTube for videos related to a topic.
 * @param {string} query - e.g. "Kinematics Physics"
 * @param {number} maxResults - number of results (default 6)
 */
const searchVideos = async (query, maxResults = 6) => {
  const { data } = await axios.get(`${YOUTUBE_BASE}/search`, {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults,
      relevanceLanguage: 'en',
      videoDuration: 'medium', // 4-20 min videos
      key: process.env.YOUTUBE_API_KEY,
    },
  });

  return data.items.map(item => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    channel:     item.snippet.channelTitle,
    thumbnail:   item.snippet.thumbnails.medium.url,
    url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
    publishedAt: item.snippet.publishedAt,
  }));
};

module.exports = { searchVideos };