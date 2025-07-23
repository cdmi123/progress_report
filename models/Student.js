const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  contact: String,
  regNo: String,
  facultyName: String,
  startDate: String,
  endDate: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // ✅ multiple courses
  password: { type: String, required: true },
   signatureData: {
    type: String,
    default: null // base64 signature image
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Student', studentSchema);
