const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher/Admin)
exports.createAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.create({
            ...req.body,
            teacher: req.user.id
        });
        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get assignments created by the current teacher
// @route   GET /api/assignments/teacher/my-assignments
// @access  Private (Teacher/Admin)
exports.getTeacherAssignments = async (req, res) => {
    try {
        // Admins can see all, teachers only their own
        const filter = req.user.role === 'admin' ? {} : { teacher: req.user.id };
        const assignments = await Assignment.find(filter).populate('course', 'title');
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
exports.getAssignmentsByCourse = async (req, res) => {
    try {
        const assignments = await Assignment.find({ course: req.params.courseId });
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
    try {
        const submission = await Submission.create({
            student: req.user.id,
            assignment: req.params.id,
            ...req.body
        });
        res.status(201).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Teacher/Admin)
exports.gradeSubmission = async (req, res) => {
    try {
        const submission = await Submission.findByIdAndUpdate(req.params.id, {
            status: 'Graded',
            ...req.body
        }, { new: true });
        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Update an assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher/Admin)
exports.updateAssignment = async (req, res) => {
    try {
        let assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        if (assignment.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher/Admin)
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        if (assignment.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await assignment.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
