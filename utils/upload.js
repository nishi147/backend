const multer = require('multer');
const path = require('path');
const fs = require('fs');

// No need to ensure uploads directory for memory storage

// Set storage engine
const storage = multer.memoryStorage(); // Vercel-safe memory storage

// Check file type
function checkFileType(file, cb) {
  // Allow images, CSV and PDF files
  const filetypes = /jpeg|jpg|png|gif|webp|heic|heif|csv|pdf/;
  
  // Extension checking can be tricky on mobile, some browsers don't append it correctly
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'text/csv' || file.mimetype === 'application/pdf';

  // If mimetype is correct, we should generally allow it. 
  // It's safer to rely on mimetype for mobile uploads where extension might be missing.
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Error: Invalid file type! Received name: ${file.originalname}, type: ${file.mimetype}. Allowed types: jpeg, jpg, png, gif, webp, heic, csv, pdf`));
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
