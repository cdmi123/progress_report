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
