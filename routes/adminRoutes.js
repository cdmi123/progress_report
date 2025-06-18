const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Report = require('../models/Report');


// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin/login');
}

// ✅ GET: Admin Dashboard (only one definition)
router.get('/admin/dashboard', isAuthenticated, async (req, res) => {
  const studentCount = await Student.countDocuments();
  const courseCount = await Course.countDocuments();
  const reportCount = await Report.countDocuments();
  const courses = await Course.find();
  const admin = await Admin.findById(req.session.adminId);

  res.render('admin/dashboard', {
    layout: 'admin/layout',
    admin,
    studentCount,
    courseCount,
    reportCount,
    courses
  });
});



// GET: Register page
router.get('/admin/register', (req, res) => {
  res.render('admin/register');
});

// POST: Register
router.post('/admin/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await Admin.create({ name, email, password: hashed });
    res.redirect('/admin/login');
  } catch (err) {
    res.send("Email already exists");
  }
});

// GET: Login page
router.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

// POST: Login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (admin && await bcrypt.compare(password, admin.password)) {
    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } else {
    res.send('Invalid email or password');
  }
});

// GET: Logout
router.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;
