const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Report = require('../models/Report');
const Course = require('../models/Course');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');

// GET: View Progress Report
router.get('/report/:studentId', async (req, res) => {
  const { course } = req.query;
  const student = await Student.findById(req.params.studentId).populate('courses');
  const courseId = course || student.courses[0]; // default to first

  const report = await Report.findOne({ student: student._id, course: courseId });
  const selectedCourse = await Course.findById(courseId);

  res.render('admin/progressReport', { student, report, course: selectedCourse });
});


// Admin View Progress Report
router.get('/Admin/report/:studentId', async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('course');
  const report = await Report.findOne({ student: student._id });

  res.render('admin/progressReport', { student, course: student.course, report });
});

// POST: Update topic progress
router.post('/report/update-topic', async (req, res) => {
  const { reportId, topicIndex, isChecked, date } = req.body;

  try {
    const report = await Report.findById(reportId);

    if (!report || !report.topics[topicIndex]) {
      return res.status(404).send("Topic not found.");
    }

    // ✅ Update topic manually
    report.topics[topicIndex].isChecked = isChecked === true || isChecked === 'true';
    report.topics[topicIndex].date = isChecked ? date : '';

    await report.save(); // ✅ Save the full document

    console.log("✅ Topic updated:", report.topics[topicIndex]);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).send("Server error.");
  }
});



router.get('/report/:studentId/pdf', async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('course');
  const report = await Report.findOne({ student: student._id });

  // Render HTML using EJS
  const html = await ejs.renderFile(
    path.join(__dirname, '../views/reportPdfTemplate.ejs'),
    { student, report, course: student.course }
  );

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

  await browser.close();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="report-${student.name}.pdf"`,
  });

  res.send(pdfBuffer);
});

module.exports = router;
