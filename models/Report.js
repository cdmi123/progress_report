const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
  topicTitle: String,
  isChecked: { type: Boolean, default: false },
  date: { type: String, default: '' },
  // Track who added the topic at the report level
  addedBy: { type: String, enum: ['admin', 'student'], default: 'admin' },
  addedByStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  addedAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  topics: [topicProgressSchema]
});

module.exports = mongoose.model('Report', reportSchema);
