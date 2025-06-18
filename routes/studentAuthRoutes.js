const Report = require('../models/Report');
const Course = require('../models/Course');

router.get('/student/dashboard', isStudentLoggedIn, async (req, res) => {
  const student = await Student.findById(req.session.studentId).populate('courses');
  const reports = await Report.find({ student: student._id }).populate('course');

  res.render('student/dashboard', {
    layout: 'student/layout',
    student,
    reports
  });
});
