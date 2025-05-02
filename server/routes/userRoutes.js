const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth); // All routes require authentication

router.get('/', userController.searchUsers);

module.exports = router;

