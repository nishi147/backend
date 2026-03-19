const multer = require('multer');
const path = require('path');
const fs = require('fs');

// No need to ensure uploads directory for memory storage

// Set storage engine
const storage = multer.memoryStorage(); // Vercel-safe memory storage

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 4000000 }, // 4MB (Stay below Vercel's 4.5MB limit)
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
