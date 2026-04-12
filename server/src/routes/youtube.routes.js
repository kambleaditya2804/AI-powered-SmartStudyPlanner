const router = require('express').Router();
const { searchForTopic, saveResource, removeResource, getResources } = require('../controllers/youtube.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search',                         searchForTopic);
router.post('/save',                          saveResource);
router.get('/topic/:topicId',                 getResources);
router.delete('/topic/:topicId/:videoId',     removeResource);

module.exports = router;