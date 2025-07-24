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
  res.redirect('/admin');
}

// ✅ GET: Admin Dashboard (only one definition)
router.get('/admin/dashboard', isAuthenticated, async (req, res) => {
  try {
      const totalStudents = await Student.countDocuments();
      const totalCourses = await Course.countDocuments();
      const totalReports = await Report.countDocuments();
      const totalAdmins = await Admin.countDocuments();
  
      const courses = await Course.find();
      const chartLabels = [];
      const chartData = [];
  
      for (const course of courses) {
        const studentCount = await Student.countDocuments({ courses: course._id });
        chartLabels.push(course.name);
        chartData.push(studentCount);
      }
  
      res.render('admin/dashboard', {
        totalStudents,
        totalCourses,
        totalReports,
        totalAdmins,
        chartLabels: ['Node.js', 'PHP', 'Laravel'],
        chartData: [5, 3, 8],
        activePage: 'dashboard',
        layout: 'admin/layout'
      });
  
    } catch (err) {
      console.error('Dashboard Load Error:', err);
      res.status(500).send('Error loading dashboard');
    }
});



// GET: Register page
router.get('/admin/register', (req, res) => {
  res.render('admin/register',{ layout: false });
});

// POST: Register
router.post('/admin/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await Admin.create({ name, email, password: hashed });
    res.redirect('/admin');
  } catch (err) {
    res.send("Email already exists");
  }
});

// GET: Login page
router.get('/admin', (req, res) => {
  res.render('admin/login', { layout: false });
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
  res.redirect('/admin');
});

router.get('/admin/student/edit/:id', async (req, res) => {

  const student = await Student.findById(req.params.id).populate('courses');
  const courses = await Course.find();

  res.render('admin/editStudent', {
    layout: 'admin/layout',
    student,
    courses,
     activePage: 'students',
  });
});

router.post('/admin/student/edit/:id', async (req, res) => {
  const { name, regNo, contact, facultyName, startDate, endDate, password, courses } = req.body;

  try {
    // 1. Update student
    const student = await Student.findByIdAndUpdate(req.params.id, {
      name,
      regNo,
      contact,
      facultyName,
      startDate,
      endDate,
      password,
      courses,
      signatureData: req.body.signatureData
    }, { new: true });

    // 2. Ensure `courses` is always an array
    const updatedCourses = Array.isArray(courses) ? courses : [courses];

    // 3. Loop through each selected course
    for (const courseId of updatedCourses) {
      const existing = await Report.findOne({ student: student._id, course: courseId });

      if (!existing) {
        // Get course topics
        const course = await Course.findById(courseId);
        const blankTopics = course.topics.map(topic => ({
          topicTitle: topic.title,
          isChecked: false,
          date: ''
        }));

        // Create blank report
        const newReport = new Report({
          student: student._id,
          course: courseId,
          topics: blankTopics
        });

        await newReport.save();
      }
    }

    req.flash('success', 'Student updated successfully!');
    res.redirect('/admin/students');

  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).send('Failed to update student'+err);
  }
});


router.post('/admin/report/custom/:studentId', async (req, res) => {
  const { courseName, topicTitles } = req.body;

  try {
    const topics = (Array.isArray(topicTitles) ? topicTitles : [topicTitles])
      .map(title => ({
        topicTitle: title,
        isChecked: false,
        date: ''
      }));

    const report = new Report({
      student: req.params.studentId,
      course: { name: courseName },
      topics
    });

    await report.save();
    res.redirect('/admin/students'); // or show success message
  } catch (err) {
    console.error('Custom report save error:', err);
    res.status(500).send('Error creating report');
  }
});

// GET route to show edit course form
// GET: Edit Course Form
router.get('/admin/course/edit/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send('Course not found');

    res.render('admin/editCourse', {
      course,
      layout: 'admin/layout',
      activePage: 'courses'
    });
  } catch (error) {
    console.error('Error loading course:', error);
    res.status(500).send('Failed to load course');
  }
});

router.post('/admin/course/edit/:id', async (req, res) => {
  try {
    const { name, topics } = req.body;

    const formattedTopics = Array.isArray(topics)
      ? topics.map(t => ({ title: t.trim() }))
      : [{ title: topics.trim() }];

    const courseId = req.params.id;

    // Step 1: Get old course topics
    const oldCourse = await Course.findById(courseId);
    const oldTopics = oldCourse.topics.map(t => t.title);
    const newTopics = formattedTopics.map(t => t.title);

    // Step 2: Update the course
    await Course.findByIdAndUpdate(courseId, {
      name,
      topics: formattedTopics,
    });

    // Step 3: Get all reports for this course
    const reports = await Report.find({ CourseId: courseId });

    // Step 4: Sync updated topic names and add new topics
    for (const report of reports) {
      let updated = false;

      // --- Rename topics if changed ---
      for (let i = 0; i < oldTopics.length; i++) {
        const oldTitle = oldTopics[i];
        const newTitle = newTopics[i];
        if (oldTitle !== newTitle) {
          report.progress = report.progress.map(entry =>
            entry.topic === oldTitle ? { ...entry.toObject(), topic: newTitle } : entry
          );
          updated = true;
        }
      }

      // --- Add new topics not present in report.progress ---
      for (const newTitle of newTopics) {
        const alreadyExists = report.progress.some(p => p.topic === newTitle);
        if (!alreadyExists) {
          report.progress.push({
            topic: newTitle,
            status: false,
            date: '',
            signature: '',
          });
          updated = true;
        }
      }

      if (updated) await report.save();
    }

    req.flash('success', 'Course and student reports updated successfully!');
    res.redirect('/admin/courses');

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Error updating course or reports.');
  }
});







module.exports = router;
