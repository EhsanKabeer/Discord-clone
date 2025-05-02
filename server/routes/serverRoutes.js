const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const auth = require('../middleware/auth');

router.use(auth); // All routes require authentication

router.get('/', serverController.getServers);
router.post('/', serverController.createServer);
router.get('/:id/channels', serverController.getChannels);
router.post('/:id/channels', serverController.createChannel);

module.exports = router;

