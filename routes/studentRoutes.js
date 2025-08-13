const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const Report = require('../models/Report');
const Admin = require('../models/Admin');

// ------------------------
// MIDDLEWARES
// ------------------------
function isAdmin(req, res, next) {
  if (req.session.adminId) return next();
  res.redirect('/admin');
}

function isStudentLoggedIn(req, res, next) {
  if (!req.session.studentId) return res.redirect('/');
  next();
}

// ------------------------
// STUDENT LOGIN / LOGOUT
// ------------------------
router.get('/', (req, res) => {
  res.render('student/login', { layout: false });
});

router.post('/student/login', async (req, res) => {
  try {
    const { contact, password } = req.body;
    const student = await Student.findOne({ contact, password });

    if (!student) {
      return res.render('student/login', { layout: false, error: 'Invalid credentials' });
    }

    req.session.studentId = student._id;
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal server error');
  }
});

router.get('/student/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/student/login');
  });
});

// ------------------------
// ADMIN: ADD STUDENT
// ------------------------
router.get('/admin/student/add', isAdmin, async (req, res) => {
  try {
    const courses = await Course.find();
    const staffList = await Admin.find();
    res.render('admin/addStudent', {
      layout: 'admin/layout',
      courses,
      staffList,
      activePage: 'addStudent',
      success:'true',
    });
  } catch (err) {
    console.error('Error loading add student page:', err);
    res.status(500).send('Error loading form');
  }
});

router.post('/admin/student/add', isAdmin, async (req, res) => {
  try {
    const {
      name, contact, regNo, facultyName,
      startDate, endDate, courses, password,
      email, signatureData
    } = req.body;

    const selectedCourses = Array.isArray(courses) ? courses : [courses];

    const student = await Student.create({
      name,
      contact,
      regNo,
      facultyName,
      startDate,
      endDate,
      courses: selectedCourses,
      password,
      signatureData,
      email
    });

    // Create blank reports for each course
    for (const courseId of selectedCourses) {
      const course = await Course.findById(courseId);
      if (!course) continue;

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
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).send('Failed to add student');
  }
});

// ------------------------
// ADMIN: DELETE STUDENT
// ------------------------
router.get('/admin/student/delete/:id', isAdmin, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    await Report.deleteMany({ student: req.params.id });
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).send('Failed to delete student');
  }
});

// ------------------------
// ADMIN: STUDENT LIST
// ------------------------
router.get('/admin/students', isAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId);
    let query = {};

    // Role filter
    if (admin.role === 2) {
      query.facultyName = admin._id; // Show only students assigned to this admin
    }

    const students = await Student.find(query)
      .populate('courses')
      .populate('facultyName');

    const allReports = await Report.find().populate('course');

    const studentData = students.map(student => {
      const courseProgress = [];
      const reports = [];

      student.courses.forEach(course => {
        const report = allReports.find(
          r => r.student.equals(student._id) && r.course._id.equals(course._id)
        );

        const total = course.topics?.length || 0;
        const completed = report?.topics?.filter(t => t.isChecked)?.length || 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        courseProgress.push({
          courseId: course._id.toString(),
          courseName: course.name,
          percent
        });

        if (report) reports.push(report);
      });

      return {
        ...student.toObject(),
        courseProgress,
        reports
      };
    });

    res.render('admin/studentList', {
      students: studentData,
      activePage: 'students',
      layout: 'admin/layout'
    });

  } catch (err) {
    console.error('Error loading student list:', err);
    res.status(500).send('Failed to load student list');
  }
});

// ------------------------
// ADMIN: EDIT COURSE
// ------------------------
router.get('/admin/course/edit/:id', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send('Course not found');

    res.render('admin/editCourse', {
      course,
      layout: 'admin/layout',
      activePage: 'courses'
    });
  } catch (err) {
    console.error('Error loading edit course page:', err);
    res.status(500).send('Failed to load course');
  }
});

router.post('/admin/course/edit/:id', isAdmin, async (req, res) => {
  try {
    const { name, topics } = req.body;

    const updatedTopics = Array.isArray(topics)
      ? topics.map(t => ({ title: t }))
      : [{ title: topics }];

    await Course.findByIdAndUpdate(req.params.id, {
      name,
      topics: updatedTopics
    });

    res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).send('Failed to update course');
  }
});

// ------------------------
// STUDENT: VIEW REPORT
// ------------------------
router.get('/student/report/:reportId', isStudentLoggedIn, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId).populate('course');
    const student = await Student.findById(req.session.studentId);

    if (!report) return res.status(404).send('Report not found');

    res.render('student/progressReport', {
      student,
      report,
      course: report.course,
      layout: 'student/layout',
      activePage: 'report'
    });
  } catch (err) {
    console.error('Error loading report:', err);
    res.status(500).send('Error loading report');
  }
});


router.get('/admin/student/report/:reportId', async (req, res) => {
  try {
    const student = await Report.findById(req.params.reportId).populate('course').populate('student');
    const report = await Report.findById(req.params.reportId).populate('course');

    const fc_id = student.student.facultyName;

    const facultyName = await Admin.findById(fc_id);

    if (!student) return res.status(404).send('Report not found');

    res.render('admin/progressReport', {
      student: student.student,
      report,
      course: student.course,
      f_name: facultyName.name,
      layout: 'admin/layout',
      activePage: 'report'
    });
  } catch (err) {
    console.error('Error loading report:', err);
    res.status(500).send('Error loading report');
  }
});


module.exports = router;
