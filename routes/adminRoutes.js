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
       const admin = await Admin.findById(req.session.adminId);

    let totalStudents;
    if (admin.role === 1) {
      // Role 1: Count all students
      totalStudents = await Student.countDocuments();
    } else {
      // Role 2: Count only their students
      totalStudents = await Student.countDocuments({ facultyName: admin._id });
    }
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
  res.render('admin/register',{ layout: 'admin/layout',activePage: 'staff'});
});

// POST: Register
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    
    // Validation
    if (!name || !email || !password || !contact) {
      return res.render('admin/register', {
        layout: 'admin/layout',
        activePage: 'staff',
        error: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.render('admin/register', {
        layout: 'admin/layout',
        activePage: 'staff',
        error: 'Password must be at least 6 characters'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const role = req.body.role ? parseInt(req.body.role) : 2;
    const status = req.body.status || 'Active';
    await Admin.create({ name, email, password: hashed, contact, role, status });
    req.flash('success', 'Staff member added successfully!');
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    const errorMsg = err.code === 11000 ? 'Email already exists' : 'Error creating staff member';
    res.render('admin/register', {
      layout: 'admin/layout',
      activePage: 'staff',
      error: errorMsg
    });
  }
});

router.get('/admin/view_staff', isAuthenticated, async (req, res) => {
  try {
    const staff = await Admin.find().select('-password');
    res.render('admin/view_staff', {
      staff,
      layout: 'admin/layout',
      activePage: 'view_staff'
    });
  } catch (err) {
    console.error('Error loading staff:', err);
    res.status(500).send('Error loading staff list');
  }
});

// GET: Login page
router.get('/admin', (req, res) => {
  res.render('admin/login', { layout: false });
});

// POST: Login
router.post('/admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('admin/login', {
        error: 'Email and password are required',
        layout: false
      });
    }

    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.render('admin/login', {
        error: 'Invalid email or password',
        layout: false
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.render('admin/login', {
        error: 'Invalid email or password',
        layout: false
      });
    }

    if (admin.status !== 'Active') {
      return res.render('admin/login', {
        error: 'Your account is blocked. Please contact administrator.',
        layout: false
      });
    }

    req.session.adminId = admin._id;
    req.session.adminRole = admin.role;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('admin/login', {
      error: 'An error occurred during login. Please try again.',
      layout: false
    });
  }
});

// GET: Logout
router.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin');
});

router.get('/admin/student/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('courses').populate('facultyName');
    
    if (!student) {
      return res.status(404).send('Student not found');
    }

    const courses = await Course.find();
    const staffList = await Admin.find().select('name _id');

    res.render('admin/editStudent', {
      layout: 'admin/layout',
      student,
      courses,
      staffList,
      activePage: 'students',
    });
  } catch (err) {
    console.error('Error loading edit student page:', err);
    res.status(500).send('Error loading student edit page');
  }
});

router.post('/admin/student/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, regNo, contact, facultyName, startDate, endDate, password, courses, email, signatureData } = req.body;

    // Validation
    if (!name || !regNo || !contact || !email || !facultyName) {
      return res.status(400).send('Required fields are missing');
    }

    // Ensure `courses` is always an array
    const updatedCourses = Array.isArray(courses) ? courses : (courses ? [courses] : []);

    if (updatedCourses.length === 0) {
      return res.status(400).send('At least one course must be selected');
    }

    // Prepare update object
    const updateData = {
      name,
      regNo,
      contact,
      facultyName,
      startDate,
      endDate,
      courses: updatedCourses,
      email
    };

    // Update password only if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).send('Password must be at least 6 characters');
      }
      updateData.password = password;
    }

    // Update signature only if provided
    if (signatureData && signatureData.trim() !== '') {
      updateData.signatureData = signatureData;
    }

    // 1. Update student
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!student) {
      return res.status(404).send('Student not found');
    }

    // 2. Add missing reports for newly added courses
    for (const courseId of updatedCourses) {
      if (!courseId) continue;
      
      const existing = await Report.findOne({ student: student._id, course: courseId });

      if (!existing) {
        const course = await Course.findById(courseId);
        if (!course) continue;

        const blankTopics = course.topics.map(topic => ({
          topicTitle: topic.title,
          isChecked: false,
          date: ''
        }));

        await Report.create({
          student: student._id,
          course: courseId,
          topics: blankTopics
        });
      }
    }

    req.flash('success', 'Student updated successfully!');
    res.redirect('/admin/students');

  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).send('Failed to update student: ' + err.message);
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

// Admin Routes
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

// GET: Edit admin page
router.get('/admin/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return res.status(404).send('Admin not found');
    }
    
    res.render('admin/editadmin', {
      layout: 'admin/layout',
      activePage: 'staff',
      admin
    });
  } catch (err) {
    console.error('Error loading edit admin page:', err);
    res.status(500).send('Error loading admin edit page');
  }
});

// POST: Update admin
router.post('/admin/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, email, password, contact, status } = req.body;
    
    if (!name || !email || !contact) {
      return res.status(400).send('Required fields are missing');
    }

    const updateData = { name, email, contact, status };

    // Only update password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).send('Password must be at least 6 characters');
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!admin) {
      return res.status(404).send('Admin not found');
    }
    
    req.flash('success', 'Staff member updated successfully!');
    res.redirect('/admin/view_staff');
  } catch (err) {
    console.error('Update admin error:', err);
    const errorMsg = err.code === 11000 ? 'Email already exists' : 'Error updating staff member';
    res.status(500).send(errorMsg);
  }
});






module.exports = router;
