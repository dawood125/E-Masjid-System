const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { requireRole } = require('../utils/routeHelpers');
const ctrl = require('../controllers/eventsController');

router.get('/', ctrl.listPublic);
router.get('/admin', ...requireRole('admin', 'manager', 'scholar', 'committee'), ctrl.listForCaller);

router.get('/:id', ctrl.getById);
router.get('/:id/registrations', ...requireRole('admin', 'manager', 'scholar', 'committee'), ctrl.getRegistrations);
router.post('/:id/register', protect, ctrl.register);

router.post('/', ...requireRole('admin', 'manager'), upload.single('image'), ctrl.create);
router.put('/:id', ...requireRole('admin', 'manager'), upload.single('image'), ctrl.update);
router.delete('/:id', ...requireRole('admin', 'manager'), ctrl.remove);

module.exports = router;
