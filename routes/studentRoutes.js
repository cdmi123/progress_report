const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const Report = require('../models/Report');

// Show login form
router.get('/', (req, res) => {
  res.render('student/login', { layout: false });
});

// Handle login
router.post('/student/login', async (req, res) => {
  const { contact, password } = req.body;
  const student = await Student.findOne({ contact, password });

  if (!student) {
    return res.render('student/login', { layout: false, error: 'Invalid credentials' });
  }

  req.session.studentId = student._id;
  res.redirect('/student/dashboard');
});

// Logout
router.get('/student/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/student/login');
  });
});

// Middleware to protect admin
function isAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin');
}

// Add student form
router.get('/admin/student/add', async (req, res) => {
  const courses = await Course.find();
  res.render('admin/addStudent', {
    layout: 'admin/layout',
    courses,
    success: '✅ Student added successfully!',
    activePage: 'addStudent',
    layout: 'admin/layout'
  });
});

// Save new student
router.post('/admin/student/add', async (req, res) => {
  const { name, contact, regNo, facultyName, startDate, endDate, courses , password } = req.body;

  const student = await Student.create({
    name,
    contact,
    regNo,
    facultyName,
    startDate,
    endDate,
    courses: Array.isArray(courses) ? courses : [courses], // ✅ support single & multiple
    password
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
  try {
    const students = await Student.find().populate('courses');

    for (const student of students) {
      student.courseProgress = [];

      for (const course of student.courses) {
        const report = await Report.findOne({ student: student._id, course: course._id });
        let completed = 0;

        if (report && Array.isArray(report.topics)) {
          completed = report.topics.filter(t => t.isChecked).length;
        }

        const total = course.topics.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;

        student.courseProgress.push({
          courseId: course._id.toString(),
          courseName: course.name,
          percent: Math.round(percent)
        });
      }
    }

    res.render('admin/studentList', { students , activePage: 'students',layout: 'admin/layout'});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading student list');
  }

});

function isStudentLoggedIn(req, res, next) {
  if (!req.session.studentId) return res.redirect('/student/login');
  next();
}

router.get('/student/report/:reportId', isStudentLoggedIn, async (req, res) => {
  const report = await Report.findById(req.params.reportId).populate('course');
  const student = await Student.findById(req.session.studentId);

  res.render('student/progressReport', {
    student,
    report,
    course: report.course,
    layout: 'student/layout',
    activePage: 'report'
  });
});



module.exports = router;