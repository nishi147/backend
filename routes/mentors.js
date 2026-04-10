const express = require('express');
const { getApprovedTeachers, getTeacherDetail } = require('../controllers/userController');
const router = express.Router();

router.get('/', getApprovedTeachers);
router.get('/:id', getTeacherDetail);

module.exports = router;
