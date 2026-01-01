const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (admin.status !== 'Active') {
            return res.status(403).json({ success: false, message: 'Your account is blocked. Please contact administrator.' });
        }

        req.session.adminId = admin._id;
        req.session.adminRole = admin.role;

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Admin API Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.json({ success: true, message: 'Admin logout successful' });
    });
};

exports.studentLogin = async (req, res) => {
    try {
        const { contact, password } = req.body;

        if (!contact || !password) {
            return res.status(400).json({ success: false, message: 'Contact and password are required' });
        }

        // Following existing logic where student passwords are plain text 
        const student = await Student.findOne({ contact, password });

        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        req.session.studentId = student._id;

        res.json({
            success: true,
            message: 'Student login successful',
            data: {
                id: student._id,
                name: student.name,
                email: student.email,
                contact: student.contact
            }
        });
    } catch (err) {
        console.error('Student API Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.studentLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.json({ success: true, message: 'Student logout successful' });
    });
};
