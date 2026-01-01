const express = require('express');
const router = express.Router();
const courseController = require('../../controller/courseController');

function isAdmin(req, res, next) {
    if (req.session.adminId) return next();
    res.status(401).json({ success: false, message: 'Unauthorized: Admin access required' });
}

router.get('/list', courseController.getCourses);
router.get('/:id', courseController.getCourseDetails);
router.post('/add', isAdmin, courseController.addCourse);
router.put('/:id', isAdmin, courseController.updateCourse);
router.delete('/:id', isAdmin, courseController.deleteCourse);

module.exports = router;
