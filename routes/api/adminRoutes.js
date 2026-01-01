const express = require('express');
const router = express.Router();
const adminController = require('../../controller/adminController');

// Middleware to protect routes
function isAdmin(req, res, next) {
    if (req.session.adminId) return next();
    res.status(401).json({ success: false, message: 'Unauthorized: Admin access required' });
}

router.get('/stats', isAdmin, adminController.getDashboardStats);

// Staff Management
router.post('/staff/register', isAdmin, adminController.registerStaff);
router.get('/staff/list', isAdmin, adminController.getStaffList);
router.put('/staff/:id', isAdmin, adminController.updateStaff);

// Student Management (Admin)
router.post('/students', isAdmin, adminController.addStudent);
router.get('/students', isAdmin, adminController.getStudentList);
router.put('/students/:id', isAdmin, adminController.updateStudent);
router.delete('/students/:id', isAdmin, adminController.deleteStudent);
router.patch('/students/:id/status', isAdmin, adminController.updateStudentStatus);

module.exports = router;
