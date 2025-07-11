const express = require('express');
const router = express.Router();
const eventLocationController = require('../controllers/eventLocationController');
const authenticateToken = require('../middlewares/auth');

router.get('/', authenticateToken, eventLocationController.listEventLocations);
router.get('/:id', authenticateToken, eventLocationController.getEventLocationById);
router.post('/', authenticateToken, eventLocationController.createEventLocation);
router.put('/', authenticateToken, eventLocationController.updateEventLocation);
router.delete('/:id', authenticateToken, eventLocationController.deleteEventLocation);

module.exports = router;
