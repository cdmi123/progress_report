const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: String
});

const courseSchema = new mongoose.Schema({
  name: String,           // e.g., "Node.js"
  topics: [topicSchema]   // Dynamic topics per course
});

module.exports = mongoose.model('Course', courseSchema);
