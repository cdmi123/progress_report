const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const Report = require('../models/Report');
const Course = require('../models/Course');

async function generateAssignmentSheet(req, res) {
  try {
    const { studentId, courseId } = req.params;

    // Fetch student, course, report
    const student = await Student.findById(studentId).populate('facultyName').lean();
    const course = await Course.findById(courseId).lean();
    const report = await Report.findOne({ student: studentId, course: courseId }).lean();

    if (!student || !course) return res.status(404).send("Student or Course not found");

    // Enable buffered pages (for page numbers)
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${student.name}_${course.name}_Sheet.pdf`
    );
    doc.pipe(res);

    // ---------------- HEADER ----------------
    doc.fontSize(18).font("Helvetica-Bold")
      .text("CREATIVE MULTIMEDIA INSTITUTE", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).font("Helvetica")
      .text(`PROGRESS REPORT (${course.name})`, { align: "center" });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // ---------------- TABLE ----------------
    const colWidths = { no: 40, topic: 240, date: 80, studentSign: 80, supervisorSign: 80 };

    function drawRow(y, row, isHeader = false, shade = false) {
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(10);

      // Calculate row height (dynamic for long topic text)
      const topicHeight = doc.heightOfString(row.topic, { width: colWidths.topic - 10 });
      const rowHeight = Math.max(25, topicHeight + 10);

      // Background shading
      if (shade && !isHeader) {
        doc.rect(40, y, 520, rowHeight).fill("#f5f5f5").fillColor("black");
      }

      // Cell borders
      doc.rect(40, y, colWidths.no, rowHeight).stroke();
      doc.rect(40 + colWidths.no, y, colWidths.topic, rowHeight).stroke();
      doc.rect(40 + colWidths.no + colWidths.topic, y, colWidths.date, rowHeight).stroke();
      doc.rect(40 + colWidths.no + colWidths.topic + colWidths.date, y, colWidths.studentSign, rowHeight).stroke();
      doc.rect(40 + colWidths.no + colWidths.topic + colWidths.date + colWidths.studentSign, y, colWidths.supervisorSign, rowHeight).stroke();

      // Values inside cells
      doc.text(row.no, 40, y + 7, { width: colWidths.no, align: "center" });
      doc.text(row.topic, 40 + colWidths.no + 5, y + 7, { width: colWidths.topic - 10, align: "left" });
      doc.text(row.date, 40 + colWidths.no + colWidths.topic, y + 7, { width: colWidths.date, align: "center" });

      // Student Signature
      if (row.signatureData) {
        try {
          let base64Data = row.signatureData.includes(",")
            ? row.signatureData.split(",")[1]
            : row.signatureData;
          const imgBuffer = Buffer.from(base64Data, "base64");
          doc.image(imgBuffer, 40 + colWidths.no + colWidths.topic + colWidths.date + 10, y + 3, { width: 60, height: 18 });
        } catch {
          doc.text("----", 40 + colWidths.no + colWidths.topic + colWidths.date, y + 7, { width: colWidths.studentSign, align: "center" });
        }
      } else {
        doc.text("----", 40 + colWidths.no + colWidths.topic + colWidths.date, y + 7, { width: colWidths.studentSign, align: "center" });
      }

      // Supervisor Sign
      doc.text(row.supervisorSign, 40 + colWidths.no + colWidths.topic + colWidths.date + colWidths.studentSign, y + 7, { width: colWidths.supervisorSign, align: "center" });

      return rowHeight; // return height so next row can adjust Y
    }

    // Header row
    let y = doc.y;
    let headerHeight = drawRow(y, {
      no: "No",
      topic: "Topic Name",
      date: "Date",
      studentSign: "Student Sign"
    }, true);
    y += headerHeight;

    // Data rows
    if (report?.topics?.length > 0) {
      report.topics.forEach((t, i) => {
        let rowHeight = drawRow(y, {
          no: i + 1,
          topic: t.topicTitle,
          date: t.date || "----",
          signatureData: student.signatureData,

        }, false, i % 2 === 0);
        y += rowHeight;
      });
    } else {
      doc.text("No topics found", 50, y + 10);
      y += 30;
    }

    doc.moveDown(2);

    // ---------------- FOOTER STUDENT INFO ----------------
    

    // Optional Student Signature bottom-right


    doc.moveDown(6);


    // ---------------- PAGE NUMBER ----------------
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).text(`Page ${i + 1} of ${range.count}`, 300, 820, { align: "center" });
    }

    doc.end();
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).send("Error generating PDF");
  }
}

module.exports = { generateAssignmentSheet };
