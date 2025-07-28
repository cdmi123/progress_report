const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Report = require('../models/Report');
const Course = require('../models/Course');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
let nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any service
  auth: {
    user: 'progressreport97@gmail.com',
    pass: 'blfs wdnj plwo tbal'
  }
});


// GET: View Progress Report
router.get('/report/:studentId', async (req, res) => {
  try {
    const { course } = req.query;
    const student = await Student.findById(req.params.studentId).populate('courses');

    if (!student) {
      return res.status(404).send('Student not found');
    }

    // Use query course OR fallback to first course
    const courseId = course || (student.courses[0]?._id.toString());

    if (!courseId) {
      return res.status(400).send('Course not specified and student has no courses');
    }

    const report = await Report.findOne({ student: student._id, course: courseId }).populate('course');

    if (!report) {
      return res.status(404).send('Progress report not found for this student and course');
    }

    const selectedCourse = report.course; // already populated

    res.render('admin/progressReport', {
      student,
      report,
      course: selectedCourse,
      layout: 'admin/layout',
      activePage: 'students'
    });
  } catch (err) {
    console.error('Error loading report:', err);
    res.status(500).send('Something went wrong');
  }
});



// Admin View Progress Report
router.get('/Admin/report/:studentId', async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('course');
  const report = await Report.findOne({ student: student._id });

  res.render('admin/progressReport', { student, course: student.course, report, layout: 'admin/layout' });
});

// POST: Update topic progress
router.post('/report/update-topic', async (req, res) => {
  const { reportId, topicIndex, isChecked, date, sendMail } = req.body;

  try {
    const report = await Report.findById(reportId);
    if (!report || !report.topics[topicIndex]) {
      return res.status(404).send("Topic not found.");
    }

    report.topics[topicIndex].isChecked = isChecked === true || isChecked === 'true';
    report.topics[topicIndex].date = isChecked ? date : '';
    await report.save();

    const student = await Student.findById(report.student);
    if (!student) return res.status(404).send("Student not found");
    if (!student.email) return res.status(400).send("Student email not found.");

    // ✅ Only send mail if checkbox selected and sendMail is true

    const topicTitle = report.topics[topicIndex].topicTitle;

    const mailOptions = {
      from: 'progressreport97@gmail.com',
      to: student.email,
      subject: `✅ Topic Completed by ${student.name}`,
     html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f6f9fc; color: #333;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #0d6efd; color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">📘 Student Progress Update</h2>
      </div>
      
      <!-- Body Content -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 10px;">Dear Admin,</p>
        <p style="margin: 0 0 15px;">
          <strong>${student.name}</strong> has successfully completed the topic:
        </p>
        <p style="font-size: 20px; font-weight: bold; color: #0d6efd; margin: 0 0 20px;">
          ✅ ${topicTitle}
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; width: 40%;"><strong>Date:</strong></td>
            <td style="padding: 8px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Student Name:</strong></td>
            <td style="padding: 8px 0;">${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Contact Number:</strong></td>
            <td style="padding: 8px 0;">${student.contact || '-'}</td>
          </tr>
        </table>

        <!-- Gujarati Note Box -->
        <div style="margin-top: 30px; padding: 16px; background-color: #e6ffed; border-left: 5px solid #28a745;">
          <p style="margin: 0; color: #2e7d32;">
            📢 <strong>Reminder:</strong><br />
            જો તમને આ TOPIC સંપૂર્ણપણે સમજાય ન હોય તો કૃપા કરીને email દ્વારા ફરીથી માહિતી માટે સંપર્ક કરો.
          </p>
        </div>

        <p style="margin-top: 30px; font-size: 13px; color: #777;">
          This is an automated message from the Student Progress System. Please do not reply directly.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f1f1f1; padding: 16px; text-align: center; font-size: 13px; color: #555;">
        &copy; ${new Date().getFullYear()} Creative Design And Multimedia Institute <br />
        Progress Report System
      </div>
    </div>
  </div>
`


    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("❌ Email sending error:", error);
      } else {
        console.log('✅ Email sent:', info.response);
      }
    });


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
