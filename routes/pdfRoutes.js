const express = require('express');
const router = express.Router();
const { generateAssignmentSheet } = require('../controller/pdfController');

router.get('/report/:studentId/:courseId', generateAssignmentSheet); // ✅ pass function

module.exports = router;
