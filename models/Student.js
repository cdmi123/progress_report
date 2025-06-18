const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  contact: String,
  regNo: String,
  facultyName: String,
  startDate: String,
  endDate: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }] // ✅ multiple courses
});

module.exports = mongoose.model('Student', studentSchema);
