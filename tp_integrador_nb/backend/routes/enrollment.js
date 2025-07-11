const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authenticateToken = require('../middlewares/auth');

router.post('/:id/enrollment', authenticateToken, enrollmentController.registerEnrollment);
router.delete('/:id/enrollment', authenticateToken, enrollmentController.removeEnrollment);

module.exports = router;
