const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticateToken = require('../middlewares/auth');

router.get('/', authenticateToken, eventController.listEvents);
router.get('/:id', authenticateToken, eventController.getEventById);
router.post('/', authenticateToken, eventController.createEvent);
router.put('/', authenticateToken, eventController.updateEvent);
router.delete('/:id', authenticateToken, eventController.deleteEvent);

module.exports = router;
