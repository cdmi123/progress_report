const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');


// Load Routes
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
const flash = require('connect-flash');

// Load environment variables
dotenv.config();

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// View Engine & Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(flash());

// ✅ Register session middleware BEFORE routes
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.adminRole = req.session.adminRole; // ✅ Now accessible in EJS
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


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
