const Report = require('../models/Report');
const Student = require('../models/Student');
const Course = require('../models/Course');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'progressreport97@gmail.com',
        pass: 'blfs wdnj plwo tbal'
    }
});

exports.getReport = async (req, res) => {
    try {
        const { studentId, courseId } = req.query;
        const finalStudentId = studentId || req.params.studentId;

        const student = await Student.findById(finalStudentId).populate('courses');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const finalCourseId = courseId || (student.courses[0]?._id.toString());
        if (!finalCourseId) return res.status(400).json({ success: false, message: 'Course not specified' });

        const report = await Report.findOne({ student: finalStudentId, course: finalCourseId }).populate('course');
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        res.json({ success: true, data: { student, report } });
    } catch (err) {
        console.error('API Get report error:', err);
        res.status(500).json({ success: false, message: 'Error loading report' });
    }
};

exports.updateTopicProgress = async (req, res) => {
    try {
        const { reportId, topicIndex, isChecked, date } = req.body;

        const report = await Report.findById(reportId);
        if (!report || !report.topics[topicIndex]) {
            return res.status(404).json({ success: false, message: "Topic not found" });
        }

        report.topics[topicIndex].isChecked = isChecked === true || isChecked === 'true';
        report.topics[topicIndex].date = isChecked ? date : '';
        await report.save();

        const student = await Student.findById(report.student);
        if (student && student.email && (isChecked === true || isChecked === 'true')) {
            const topicTitle = report.topics[topicIndex].topicTitle;
            const mailOptions = {
                from: 'progressreport97@gmail.com',
                to: student.email,
                subject: `✅ Topic Completed by ${student.name}`,
                html: `<h3>Progress Update</h3><p>Dear Admin,</p><p><strong>${student.name}</strong> has completed: <strong>${topicTitle}</strong> on ${date}.</p>`
            };
            transporter.sendMail(mailOptions).catch(e => console.error('Email error:', e));
        }

        res.json({ success: true, message: 'Topic progress updated successfully' });
    } catch (err) {
        console.error('API Update topic progress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addTopicToReport = async (req, res) => {
    try {
        const { courseId, topicTitle } = req.body;
        const studentId = req.session.studentId || req.body.studentId;

        if (!courseId || !topicTitle || !studentId) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const report = await Report.findOne({ course: courseId, student: studentId });
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        report.topics.push({
            topicTitle,
            isChecked: false,
            date: '',
            addedBy: req.session.adminId ? 'admin' : 'student',
            addedByStudent: req.session.studentId ? req.session.studentId : null,
            addedAt: new Date()
        });
        await report.save();

        res.json({ success: true, message: 'Topic added to report', data: { title: topicTitle } });
    } catch (err) {
        console.error('API Add topic error:', err);
        res.status(500).json({ success: false, message: 'Failed to add topic' });
    }
};

exports.removeTopicFromReport = async (req, res) => {
    try {
        const { reportId, topicIndex } = req.body;
        const report = await Report.findById(reportId);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        if (!report.topics[topicIndex]) return res.status(404).json({ success: false, message: 'Topic not found' });

        report.topics.splice(topicIndex, 1);
        await report.save();

        res.json({ success: true, message: 'Topic removed successfully' });
    } catch (err) {
        console.error('API Remove topic error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove topic' });
    }
};
