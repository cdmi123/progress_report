const Course = require('../models/Course');
const Report = require('../models/Report');

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json({ success: true, data: courses });
    } catch (err) {
        console.error('API Get courses error:', err);
        res.status(500).json({ success: false, message: 'Error loading courses' });
    }
};

exports.addCourse = async (req, res) => {
    try {
        const { name, topicName, topics } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const topicList = Array.isArray(topics)
            ? topics.filter(t => t && t.trim()).map(t => ({ title: t.trim() }))
            : (topics && typeof topics === 'string' && topics.trim() ? [{ title: topics.trim() }] : []);

        const newCourse = await Course.create({ name, topicName, topics: topicList });
        res.status(201).json({ success: true, message: 'Course added successfully', data: newCourse });
    } catch (err) {
        console.error('API Add course error:', err);
        res.status(500).json({ success: false, message: 'Failed to add course: ' + err.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { name, topics } = req.body;
        const courseId = req.params.id;

        const formattedTopics = Array.isArray(topics)
            ? topics.map(t => ({ title: typeof t === 'string' ? t.trim() : t.title.trim() }))
            : (topics ? [{ title: topics.trim() }] : []);

        const oldCourse = await Course.findById(courseId);
        if (!oldCourse) return res.status(404).json({ success: false, message: 'Course not found' });

        const oldTopicTitles = oldCourse.topics.map(t => t.title);
        const newTopicTitles = formattedTopics.map(t => t.title);

        // Update the course
        const updatedCourse = await Course.findByIdAndUpdate(courseId, {
            name,
            topics: formattedTopics,
        }, { new: true });

        // Sync reports
        const reports = await Report.find({ course: courseId });
        for (const report of reports) {
            let updated = false;

            // Rename topics if changed
            for (let i = 0; i < oldTopicTitles.length; i++) {
                const oldTitle = oldTopicTitles[i];
                const newTitle = newTopicTitles[i];
                if (newTitle && oldTitle !== newTitle) {
                    report.topics = report.topics.map(entry =>
                        entry.topicTitle === oldTitle ? { ...entry.toObject(), topicTitle: newTitle } : entry
                    );
                    updated = true;
                }
            }

            // Add new topics
            for (const newTitle of newTopicTitles) {
                const alreadyExists = report.topics.some(p => p.topicTitle === newTitle);
                if (!alreadyExists) {
                    report.topics.push({
                        topicTitle: newTitle,
                        isChecked: false,
                        date: '',
                    });
                    updated = true;
                }
            }

            if (updated) await report.save();
        }

        res.json({ success: true, message: 'Course and student reports updated successfully', data: updatedCourse });
    } catch (err) {
        console.error('API Update course error:', err);
        res.status(500).json({ success: false, message: 'Error updating course or reports' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        await Report.deleteMany({ course: req.params.id });
        res.json({ success: true, message: 'Course and related reports deleted successfully' });
    } catch (err) {
        console.error('API Delete course error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete course' });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.json({ success: true, data: course });
    } catch (err) {
        console.error('API Get course details error:', err);
        res.status(500).json({ success: false, message: 'Failed to get course details' });
    }
};
