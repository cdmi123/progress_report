const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Middleware to protect admin
function isAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin');
}

// GET: Show all courses
router.get('/admin/courses', isAdmin, async (req, res) => {
  const courses = await Course.find();
  res.render('admin/courseList', { courses });
});

// GET: Add course form
router.get('/admin/course/add', isAdmin, (req, res) => {
  res.render('admin/addCourse');
});

// POST: Add new course
router.post('/admin/course/add', isAdmin, async (req, res) => {
  const { name, topics } = req.body;
  const topicList = Array.isArray(topics) ? topics.map(t => ({ title: t })) : [{ title: topics }];

  await Course.create({ name, topics: topicList });
  res.redirect('/admin/courses');
});

// DELETE course (optional)
router.get('/admin/course/delete/:id', isAdmin, async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.redirect('/admin/courses');
});

module.exports = router;
