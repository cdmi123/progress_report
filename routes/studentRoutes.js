const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const Report = require('../models/Report');

// Middleware to protect admin
function isAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin/login');
}

// Add student form
router.get('/admin/student/add', async (req, res) => {
  const courses = await Course.find();
  res.render('admin/addStudent', {
    layout: 'admin/layout',
    courses
  });
});

// Save new student
router.post('/admin/student/add', async (req, res) => {
  const { name, contact, regNo, facultyName, startDate, endDate, courses } = req.body;

  const student = await Student.create({
    name,
    contact,
    regNo,
    facultyName,
    startDate,
    endDate,
    courses: Array.isArray(courses) ? courses : [courses] // ✅ support single & multiple
  });

  // Create a report for each selected course
  for (const courseId of student.courses) {
    const course = await Course.findById(courseId);
    const topics = course.topics.map(t => ({
      topicTitle: t.title,
      isChecked: false,
      date: ''
    }));

    await Report.create({
      student: student._id,
      course: course._id,
      topics
    });
  }

  res.redirect('/admin/students');
});


// Delete student
router.get('/admin/student/delete/:id', isAdmin, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  await Report.deleteOne({ student: req.params.id });
  res.redirect('/admin/students');
});


router.get('/admin/students', isAdmin, async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  const students = await Student.find(filter).populate('courses');
  const courses = await Course.find();

  res.render('admin/studentList', { students, courses, selectedCourse: req.query.course || '' });
});

module.exports = router;