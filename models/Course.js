const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: String,
  addedBy: {
    type: String, // 'admin' or 'student'
    default: 'admin'
  },
  addedByStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  name: String,           // e.g., "Node.js"
  topicName: String,      // Main topic name for the course
  topics: [topicSchema]   // Dynamic topics per course
});

module.exports = mongoose.model('Course', courseSchema);
