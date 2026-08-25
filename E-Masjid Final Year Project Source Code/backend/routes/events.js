const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/eventsController');

router.get('/', ctrl.listPublic);
router.get('/admin', protect, authorize('admin', 'manager', 'scholar', 'committee'), ctrl.listForCaller);

router.get('/:id', ctrl.getById);
router.get('/:id/registrations', protect, authorize('admin', 'manager', 'scholar', 'committee'), ctrl.getRegistrations);
router.post('/:id/register', protect, ctrl.register);

router.post('/', protect, authorize('admin', 'manager'), upload.single('image'), ctrl.create);
router.put('/:id', protect, authorize('admin', 'manager'), upload.single('image'), ctrl.update);
router.delete('/:id', protect, authorize('admin', 'manager'), ctrl.remove);

module.exports = router;
