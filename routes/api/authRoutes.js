const express = require('express');
const router = express.Router();
const authController = require('../../controller/authController');

router.post('/admin/login', authController.adminLogin);
router.get('/admin/logout', authController.adminLogout);

router.post('/student/login', authController.studentLogin);
router.get('/student/logout', authController.studentLogout);

module.exports = router;
