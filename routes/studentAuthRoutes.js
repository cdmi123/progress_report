const Student = require('../models/Student');
const Report = require('../models/Report');
const express = require('express');
const router = express.Router();

function isStudentLoggedIn(req, res, next) {
  if (!req.session.studentId) return res.redirect('/');
  next();
}

router.get('/student/dashboard', isStudentLoggedIn, async (req, res) => {
  try {
    const student = await Student.findById(req.session.studentId).populate('courses');
    const studentReports = await Report.find({ student: student._id }).populate('course');
    
    // Add mock data for demonstration (replace with your actual data structure)
    const enhancedReports = studentReports.map(report => ({
      ...report.toObject(),
      overallProgress: Math.floor(Math.random() * 30) + 70, // Random progress between 70-100%
      attendance: Math.floor(Math.random() * 15) + 85, // Random attendance between 85-100%
      assignmentsProgress: Math.floor(Math.random() * 30) + 70, // Random progress between 70-100%
      examsProgress: Math.floor(Math.random() * 30) + 70, // Random progress between 70-100%
      projectsProgress: Math.floor(Math.random() * 30) + 70, // Random progress between 70-100%
      assignments: [
        { title: 'Assignment 1', dueDate: '2023-10-15', submittedDate: '2023-10-14', grade: 92 },
        { title: 'Assignment 2', dueDate: '2023-11-01', submittedDate: '2023-10-30', grade: 88 },
        { title: 'Assignment 3', dueDate: '2023-11-15', submittedDate: null, grade: null }
      ],
      exams: [
        { title: 'Midterm Exam', date: '2023-10-20', completed: true, grade: 85 },
        { title: 'Final Exam', date: '2023-12-10', completed: false, grade: null }
      ],
      instructor: 'Dr. Jane Smith' // Add instructor info
    }));
    
    res.render('student/dashboard', {
      student,
      studentReports: enhancedReports,
      layout: 'student/layout'
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});


module.exports = router;