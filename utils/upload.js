const multer = require('multer');
const path = require('path');
const fs = require('fs');

// No need to ensure uploads directory for memory storage

// Set storage engine
const storage = multer.memoryStorage(); // Vercel-safe memory storage

// Check file type
  // Mobile devices might send heic/heif or webp. CSV for lead sharing.
  const filetypes = /jpeg|jpg|png|gif|webp|heic|heif|csv/;
  
  // Extension checking can be tricky on mobile, some browsers don't append it correctly
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';

  // If mimetype is correct, we should generally allow it. 
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Error: Invalid file type! Received name: ${file.originalname}, type: ${file.mimetype}. Allowed types: images, csv`));
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
