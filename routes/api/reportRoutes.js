const express = require('express');
const router = express.Router();
const reportController = require('../../controller/reportController');

function isAuthorized(req, res, next) {
    if (req.session.adminId || req.session.studentId) return next();
    res.status(401).json({ success: false, message: 'Unauthorized' });
}

router.get('/details', isAuthorized, reportController.getReport);
router.post('/update-progress', isAuthorized, reportController.updateTopicProgress);
router.post('/add-topic', isAuthorized, reportController.addTopicToReport);
router.post('/remove-topic', isAuthorized, reportController.removeTopicFromReport);

module.exports = router;
