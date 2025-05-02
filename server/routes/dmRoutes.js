const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const auth = require('../middleware/auth');

router.use(auth); // All routes require authentication

router.get('/', dmController.getDMs);
router.post('/', dmController.createDM);
router.get('/:id/messages', dmController.getDMMessages);

module.exports = router;

