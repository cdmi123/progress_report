const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
  topicTitle: String,
  isChecked: { type: Boolean, default: false },
  date: { type: String, default: '' }
});

const reportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  topics: [topicProgressSchema]
});

module.exports = mongoose.model('Report', reportSchema);
