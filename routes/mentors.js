const express = require('express');
const { getApprovedTeachers } = require('../controllers/userController');
const router = express.Router();

router.get('/', getApprovedTeachers);

module.exports = router;
