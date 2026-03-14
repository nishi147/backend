const Project = require('../models/Project');

// @desc    Get all approved projects
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ isApproved: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all projects (Admin only)
// @route   GET /api/projects/admin/all
// @access  Private (Admin)
exports.getAllProjectsAdmin = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get my projects (Student only)
// @route   GET /api/projects/my-projects
// @access  Private (Student)
exports.getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Student, Admin)
exports.createProject = async (req, res) => {
    try {
        console.log("Create Project Request Body:", req.body);
        console.log("User User:", req.user);

        if (req.user.role === 'student') {
            req.body.studentId = req.user.id;
            req.body.isApproved = false;
        } else if (req.user.role === 'admin') {
            if (!req.body.studentId) {
                delete req.body.studentId;
            }
        }

        const project = await Project.create(req.body);
        console.log("Project Created Successfully:", project._id);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error("Project Creation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Approve/Unapprove project
// @route   PUT /api/projects/approve/:id
// @access  Private (Admin)
exports.approveProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        project.isApproved = !project.isApproved;
        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, Owner)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check ownership or admin
        if (project.studentId?.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await project.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
