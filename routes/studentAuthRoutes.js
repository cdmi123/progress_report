const Student = require('../models/Student');
const Report = require('../models/Report');
const express = require('express');
const router = express.Router();

function isStudentLoggedIn(req, res, next) {
  if (!req.session.studentId) return res.redirect('/');
  next();
}

router.get('/student/dashboard', isStudentLoggedIn, async (req, res) => {
  const student = await Student.findById(req.session.studentId).populate('courses');
  const studentReports = await Report.find({ student: student._id }).populate('course');

  res.render('student/dashboard', {
    student,
    studentReports,
    layout: 'student/layout'
  });
});
module.exports = router;