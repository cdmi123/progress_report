const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Report = require('../models/Report');

// Middleware to protect admin
function isAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin');
}

// GET: Show all courses
router.get('/admin/courses', isAdmin, async (req, res) => {
  const courses = await Course.find();
  res.render('admin/courseList', { courses , layout: 'admin/layout',activePage: 'addCourse'});
});

// GET: Add course form
router.get('/admin/course/add', isAdmin, (req, res) => {
  res.render('admin/addCourse',{activePage: 'addCourse' , layout: 'admin/layout'});
});

// POST: Add new course
router.post('/admin/course/add', isAdmin, async (req, res) => {
  try {
    const { name, topicName, topics } = req.body;
    
    if (!name) {
      return res.status(400).send('Course name is required');
    }

    const topicList = Array.isArray(topics) 
      ? topics.filter(t => t && t.trim()).map(t => ({ title: t.trim() }))
      : (topics && topics.trim() ? [{ title: topics.trim() }] : []);

    await Course.create({ name, topicName, topics: topicList });
    req.flash('success', 'Course added successfully!');
    res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).send('Failed to add course: ' + err.message);
  }
});

// DELETE course (optional)
router.get('/admin/course/delete/:id', isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).send('Course not found');
    }
    
    // Also delete related reports
    await Report.deleteMany({ course: req.params.id });
    
    req.flash('success', 'Course deleted successfully!');
    res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).send('Failed to delete course: ' + err.message);
  }
});

module.exports = router;
