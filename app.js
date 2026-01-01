const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');


// Load Routes
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
const flash = require('connect-flash');

// API Routes
const apiAuthRoutes = require('./routes/api/authRoutes');
const apiAdminRoutes = require('./routes/api/adminRoutes');
const apiCourseRoutes = require('./routes/api/courseRoutes');
const apiReportRoutes = require('./routes/api/reportRoutes');

// Load environment variables
dotenv.config();

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// View Engine & Middleware
app.set('view engine', 'ejs');
// Increase payload limits to allow base64 signature images
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.use(cors({
  origin: 'http://localhost:4200', // Default Angular port
  credentials: true
}));

// ✅ Register session middleware BEFORE routes
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

// connect-flash requires sessions; register AFTER session middleware
app.use(flash());

app.use((req, res, next) => {
  res.locals.adminRole = req.session.adminRole; // ✅ Now accessible in EJS
  next();
});
// Expose flash messages to all views
app.use((req, res, next) => {
  const successMsg = req.flash('success');
  const errorMsg = req.flash('error');
  res.locals.success = successMsg.length > 0 ? successMsg : null;
  res.locals.error = errorMsg.length > 0 ? errorMsg : null;
  next();
});
const pdfRoutes = require('./routes/pdfRoutes');
app.use('/pdf', pdfRoutes);

// Register routes
app.use('/', studentRoutes);
app.use('/', courseRoutes);
app.use('/', reportRoutes);
app.use('/', adminRoutes);
app.use('/', studentAuthRoutes);

// API Routes Registration
app.use('/api/v1/auth', apiAuthRoutes);
app.use('/api/v1/admin', apiAdminRoutes);
app.use('/api/v1/courses', apiCourseRoutes);
app.use('/api/v1/reports', apiReportRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500);

  // If it's an API request, return JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.json({
      success: false,
      error: err.message || 'Internal server error'
    });
  }

  // Otherwise render error page
  res.render('error', {
    error: err.message || 'Something went wrong!',
    layout: false
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page not found',
    layout: false
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
