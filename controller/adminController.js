const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Report = require('../models/Report');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        let totalStudents;
        if (admin.role === 1) {
            totalStudents = await Student.countDocuments();
        } else {
            totalStudents = await Student.countDocuments({ facultyName: admin._id });
        }

        const totalCourses = await Course.countDocuments();
        const totalReports = await Report.countDocuments();
        const totalAdmins = await Admin.countDocuments();

        // Chart data (Existing logic used hardcoded labels/data, kept for consistency)
        const chartLabels = ['Node.js', 'PHP', 'Laravel'];
        const chartData = [5, 3, 8];

        res.json({
            success: true,
            data: {
                totalStudents,
                totalCourses,
                totalReports,
                totalAdmins,
                chartLabels,
                chartData
            }
        });
    } catch (err) {
        console.error('API Dashboard Stats Error:', err);
        res.status(500).json({ success: false, message: 'Error loading dashboard stats' });
    }
};

// Staff Management
exports.registerStaff = async (req, res) => {
    try {
        const { name, email, password, contact, role, status } = req.body;

        if (!name || !email || !password || !contact) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const adminRole = role ? parseInt(role) : 2;
        const adminStatus = status || 'Active';

        const newAdmin = await Admin.create({
            name, email, password: hashed, contact, role: adminRole, status: adminStatus
        });

        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            data: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email }
        });
    } catch (err) {
        console.error('API Staff Registration error:', err);
        const errorMsg = err.code === 11000 ? 'Email already exists' : 'Error creating staff member';
        res.status(500).json({ success: false, message: errorMsg });
    }
};

exports.getStaffList = async (req, res) => {
    try {
        const staff = await Admin.find().select('-password');
        res.json({ success: true, data: staff });
    } catch (err) {
        console.error('API Staff list error:', err);
        res.status(500).json({ success: false, message: 'Error loading staff list' });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { name, email, password, contact, status } = req.body;

        if (!name || !email || !contact) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const updateData = { name, email, contact, status };

        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, message: 'Staff member updated successfully', data: admin });
    } catch (err) {
        console.error('API Update staff error:', err);
        const errorMsg = err.code === 11000 ? 'Email already exists' : 'Error updating staff member';
        res.status(500).json({ success: false, message: errorMsg });
    }
};

// Student Management (Administrative)
exports.addStudent = async (req, res) => {
    try {
        const {
            name, contact, regNo, facultyName,
            startDate, endDate, courses, password,
            email, signatureData
        } = req.body;

        if (!name || !contact || !regNo || !facultyName || !email || !password) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        if (!courses || (Array.isArray(courses) && courses.length === 0)) {
            return res.status(400).json({ success: false, message: 'At least one course must be selected' });
        }

        const selectedCourses = Array.isArray(courses) ? courses.filter(c => c) : [courses].filter(c => c);

        if (!mongoose.Types.ObjectId.isValid(facultyName)) {
            return res.status(400).json({ success: false, message: 'Invalid faculty selection' });
        }

        const student = await Student.create({
            name, contact, regNo, facultyName,
            startDate, endDate, courses: selectedCourses,
            password, signatureData: signatureData || null, email
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

        res.status(201).json({ success: true, message: 'Student added successfully', data: { id: student._id, name: student.name } });
    } catch (err) {
        console.error('API Add student error:', err);
        let errorMsg = 'Failed to add student';
        if (err.code === 11000) errorMsg = 'Email or registration number already exists';
        res.status(500).json({ success: false, message: errorMsg });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { name, regNo, contact, facultyName, startDate, endDate, password, courses, email, signatureData } = req.body;

        if (!name || !regNo || !contact || !email || !facultyName) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        const updatedCourses = Array.isArray(courses) ? courses : (courses ? [courses] : []);
        if (updatedCourses.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one course must be selected' });
        }

        const updateData = { name, regNo, contact, facultyName, startDate, endDate, courses: updatedCourses, email };

        if (password && password.trim() !== '') {
            if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            updateData.password = password;
        }

        if (signatureData && signatureData.trim() !== '') {
            updateData.signatureData = signatureData;
        }

        const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // Sync reports for newly added courses
        for (const courseId of updatedCourses) {
            if (!courseId) continue;
            const existing = await Report.findOne({ student: student._id, course: courseId });
            if (!existing) {
                const course = await Course.findById(courseId);
                if (!course) continue;
                const blankTopics = course.topics.map(topic => ({ topicTitle: topic.title, isChecked: false, date: '' }));
                await Report.create({ student: student._id, course: courseId, topics: blankTopics });
            }
        }

        res.json({ success: true, message: 'Student updated successfully', data: student });
    } catch (err) {
        console.error('API Update student error:', err);
        res.status(500).json({ success: false, message: 'Failed to update student: ' + err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        await Report.deleteMany({ student: req.params.id });
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        console.error('API Delete student error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
};

exports.updateStudentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['Running', 'Completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const student = await Student.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        res.json({ success: true, message: `Student status updated to ${status}`, data: { status: student.status } });
    } catch (err) {
        console.error('API Update student status error:', err);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

exports.getStudentList = async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        let query = {};
        if (admin.role === 2) query.facultyName = admin._id;

        const statusFilter = req.query.status || 'Running';
        if (statusFilter && statusFilter !== 'All') {
            if (statusFilter === 'Running') {
                query.$or = [{ status: 'Running' }, { status: null }, { status: '' }, { status: { $exists: false } }];
            } else {
                query.status = statusFilter;
            }
        }

        const students = await Student.find(query).populate('courses').populate('facultyName').sort({ createdAt: -1 });
        const allReports = await Report.find().populate('course').populate('student');

        const studentData = students.map(student => {
            const courseProgress = [];
            if (student.courses && Array.isArray(student.courses)) {
                student.courses.forEach(course => {
                    if (!course || !course._id) return;
                    const report = allReports.find(r =>
                        r.student?._id?.toString() === student._id.toString() &&
                        r.course?._id?.toString() === course._id.toString()
                    );
                    const total = course.topics?.length || 0;
                    const completed = report?.topics ? report.topics.filter(t => t.isChecked).length : 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    courseProgress.push({ courseId: course._id, courseName: course.name, percent });
                });
            }
            return { ...student.toObject(), courseProgress };
        });

        res.json({ success: true, data: studentData });
    } catch (err) {
        console.error('API Student list error:', err);
        res.status(500).json({ success: false, message: 'Failed to load student list' });
    }
};
