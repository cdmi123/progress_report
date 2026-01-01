const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
      req.flash('error', 'Invalid credentials');
      return res.redirect('/');
    }

    req.session.studentId = student._id;
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal server error');
  }
});

router.get('/student/login', (req, res) => {
  res.redirect('/');
});

router.get('/student/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ------------------------
// STUDENT REGISTRATION
// ------------------------
router.get('/student/register', (req, res) => {
  res.render('student/register', { layout: false });
});

router.post('/student/register', async (req, res) => {
  try {
    const { name, contact, email, password } = req.body;

    // Check if student exists
    const existing = await Student.findOne({ $or: [{ email }, { contact }] });
    if (existing) {
      req.flash('error', 'Email or contact already registered');
      return res.redirect('/student/register');
    }

    await Student.create({ name, contact, email, password });
    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'Failed to register');
    res.redirect('/student/register');
  }
});

// ------------------------
// FORGOT PASSWORD
// ------------------------
router.get('/forgot-password', (req, res) => {
  res.render('student/forgotPassword', { layout: false });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });

    if (!student) {
      req.flash('error', 'Email not found');
      return res.redirect('/forgot-password');
    }

    // In a real app, you'd send a reset link. For now, we'll just show a success message.
    req.flash('success', 'Password reset instructions sent to your email.');
    res.redirect('/');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/forgot-password');
  }
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
      success: null,
    });
  } catch (err) {
    console.error('Error loading add student page:', err);
    res.status(500).send('Error loading form');
  }
});

router.post('/admin/student/add', isAdmin, async (req, res) => {
  try {
    console.log('DEBUG /admin/student/add body:', req.body);
    const {
      name, contact, regNo, facultyName,
      startDate, endDate, courses, password,
      email, signatureData
    } = req.body;

    // Validation
    if (!name || !contact || !regNo || !facultyName || !email || !password) {
      const courses = await Course.find();
      const staffList = await Admin.find();
      return res.render('admin/addStudent', {
        layout: 'admin/layout',
        courses,
        staffList,
        activePage: 'addStudent',
        error: 'All required fields must be filled'
      });
    }

    if (password.length < 6) {
      const courses = await Course.find();
      const staffList = await Admin.find();
      return res.render('admin/addStudent', {
        layout: 'admin/layout',
        courses,
        staffList,
        activePage: 'addStudent',
        error: 'Password must be at least 6 characters'
      });
    }

    if (!courses || (Array.isArray(courses) && courses.length === 0)) {
      const courses = await Course.find();
      const staffList = await Admin.find();
      return res.render('admin/addStudent', {
        layout: 'admin/layout',
        courses,
        staffList,
        activePage: 'addStudent',
        error: 'At least one course must be selected'
      });
    }

    const selectedCourses = Array.isArray(courses) ? courses.filter(c => c) : [courses].filter(c => c);

    // Validate facultyName is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(facultyName)) {
      const courses = await Course.find();
      const staffList = await Admin.find();
      return res.render('admin/addStudent', {
        layout: 'admin/layout',
        courses,
        staffList,
        activePage: 'addStudent',
        error: 'Invalid faculty selection'
      });
    }

    const student = await Student.create({
      name,
      contact,
      regNo,
      facultyName,
      startDate,
      endDate,
      courses: selectedCourses,
      password,
      signatureData: signatureData || null,
      email
    });

    // Create blank reports for each course
    for (const courseId of selectedCourses) {
      if (!courseId) continue;

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

    req.flash('success', 'Student added successfully!');
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Error adding student:', err);
    const courses = await Course.find();
    const staffList = await Admin.find();

    let errorMsg = 'Failed to add student';
    if (err.code === 11000) {
      errorMsg = 'Email or registration number already exists';
    } else if (err.name === 'ValidationError') {
      errorMsg = Object.values(err.errors).map(e => e.message).join(', ');
    }

    res.render('admin/addStudent', {
      layout: 'admin/layout',
      courses,
      staffList,
      activePage: 'addStudent',
      error: errorMsg
    });
  }
});

// ------------------------
// ADMIN: DELETE STUDENT
// ------------------------
router.get('/admin/student/delete/:id', isAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).send('Student not found');
    }

    await Report.deleteMany({ student: req.params.id });
    req.flash('success', 'Student deleted successfully!');
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).send('Failed to delete student: ' + err.message);
  }
});

// Update student status
router.post('/admin/student/update-status/:id', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const studentId = req.params.id;

    if (!status || !['Running', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { status },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: `Student status updated to ${status}`,
      status: student.status
    });
  } catch (err) {
    console.error('Error updating student status:', err);
    res.status(500).json({ success: false, message: 'Failed to update status: ' + err.message });
  }
});

// ------------------------
// ADMIN: STUDENT LIST
// ------------------------
router.get('/admin/students', isAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId);

    if (!admin) {
      return res.redirect('/admin');
    }

    let query = {};

    // Role filter
    if (admin.role === 2) {
      query.facultyName = admin._id; // Show only students assigned to this admin
    }

    // Status filter - default to "Running"
    const statusFilter = req.query.status || 'Running';
    if (statusFilter && statusFilter !== 'All') {
      if (statusFilter === 'Running') {
        // Include students with status "Running" OR null/undefined (default is Running)
        // MongoDB will AND this with other query conditions (like facultyName)
        query.$or = [
          { status: 'Running' },
          { status: null },
          { status: '' },
          { status: { $exists: false } }
        ];
      } else {
        // For "Completed" status, only show students explicitly marked as Completed
        query.status = statusFilter;
      }
    }

    const students = await Student.find(query)
      .populate('courses')
      .populate('facultyName')
      .sort({ createdAt: -1 });

    // Get all reports with populated course and student
    const allReports = await Report.find()
      .populate('course')
      .populate('student');

    const studentData = students.map(student => {
      const courseProgress = [];
      const reports = [];

      if (student.courses && Array.isArray(student.courses)) {
        student.courses.forEach(course => {
          if (!course || !course._id) return;

          // Find report for this student and course
          const report = allReports.find(r => {
            const studentMatch = r.student && (
              (typeof r.student === 'object' && r.student._id && r.student._id.toString() === student._id.toString()) ||
              (typeof r.student === 'string' && r.student.toString() === student._id.toString())
            );
            const courseMatch = r.course && r.course._id && r.course._id.toString() === course._id.toString();
            return studentMatch && courseMatch;
          });

          const total = course.topics?.length || 0;
          const completed = report && report.topics ? report.topics.filter(t => t && t.isChecked).length : 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          courseProgress.push({
            courseId: course._id.toString(),
            courseName: course.name || 'Unknown Course',
            percent
          });

          if (report) reports.push(report);
        });
      }

      return {
        ...student.toObject(),
        courseProgress: courseProgress.length > 0 ? courseProgress : [],
        reports: reports.length > 0 ? reports : []
      };
    });

    res.render('admin/studentList', {
      students: studentData,
      activePage: 'students',
      layout: 'admin/layout',
      currentStatus: statusFilter
    });

  } catch (err) {
    console.error('Error loading student list:', err);
    res.status(500).send('Failed to load student list: ' + err.message);
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

    // Get existing course to preserve topic metadata
    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) {
      return res.status(404).send('Course not found');
    }

    // Map topics while preserving existing metadata
    const updatedTopics = Array.isArray(topics)
      ? topics.map((t, index) => {
        // If topic exists in current course, preserve its metadata
        if (existingCourse.topics[index]) {
          return {
            title: t,
            addedBy: existingCourse.topics[index].addedBy || 'admin',
            addedByStudent: existingCourse.topics[index].addedByStudent || null,
            addedAt: existingCourse.topics[index].addedAt || new Date()
          };
        } else {
          // New topic - set as admin added
          return {
            title: t,
            addedBy: 'admin',
            addedByStudent: null,
            addedAt: new Date()
          };
        }
      })
      : [{
        title: topics,
        addedBy: 'admin',
        addedByStudent: null,
        addedAt: new Date()
      }];

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
    const student = await Student.findById(req.session.studentId).populate('facultyName');

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

// Student add topic to course (only for their own report)
router.post('/student/add-topic', isStudentLoggedIn, async (req, res) => {
  try {
    const { courseId, topicTitle } = req.body;
    const studentId = req.session.studentId;
    const student = await Student.findById(studentId);

    if (!courseId || !topicTitle) {
      return res.status(400).json({ success: false, message: 'Course ID and topic title are required' });
    }

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find ONLY this student's report for the course
    const report = await Report.findOne({ course: courseId, student: studentId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found for this student' });
    }

    // Add topic only to this student's report
    report.topics.push({
      topicTitle,
      isChecked: false,
      date: '',
      addedBy: 'student',
      addedByStudent: studentId,
      addedAt: new Date()
    });
    await report.save();

    res.json({
      success: true,
      message: 'Topic added to your report',
      topic: { title: topicTitle }
    });

  } catch (err) {
    console.error('Error adding topic:', err);
    res.status(500).json({ success: false, message: 'Failed to add topic: ' + err.message });
  }
});

// Admin remove topic (only student-added topics)
router.post('/admin/remove-topic', isAdmin, async (req, res) => {
  try {
    const { courseId, topicIndex } = req.body;

    if (!courseId || topicIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Course ID and topic index are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if topic exists and was added by student
    if (topicIndex >= course.topics.length) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const topic = course.topics[topicIndex];
    if (topic.addedBy !== 'student') {
      return res.status(403).json({ success: false, message: 'Only student-added topics can be removed' });
    }

    // Remove topic from course
    course.topics.splice(topicIndex, 1);
    await course.save();

    // Remove topic from all reports for this course
    const reports = await Report.find({ course: courseId });
    for (const report of reports) {
      if (report.topics[topicIndex]) {
        report.topics.splice(topicIndex, 1);
        await report.save();
      }
    }

    res.json({
      success: true,
      message: 'Topic removed successfully'
    });

  } catch (err) {
    console.error('Error removing topic:', err);
    res.status(500).json({ success: false, message: 'Failed to remove topic' });
  }
});

// Get course details for admin
router.get('/admin/course/details/:id', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (err) {
    console.error('Error getting course details:', err);
    res.status(500).json({ success: false, message: 'Failed to get course details' });
  }
});


router.get('/admin/student/report/:reportId', async (req, res) => {
  try {
    const student = await Report.findById(req.params.reportId).populate('course').populate('student');
    const report = await Report.findById(req.params.reportId).populate('course');


    // console.log(student.student);
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
