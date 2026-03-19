const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// Add routes removed to perfectly mirror previous working commit

// ===============================
// 📦 ADD MODULE
// ===============================
router.post('/:courseId/modules', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Module title is required' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const newModule = {
      title,
      lessons: []
    };

    course.modules.push(newModule);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Module added successfully',
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===============================
// 🎥 ADD LESSON
// ===============================
router.post('/:courseId/modules/:moduleId/lessons', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, videoUrl, pdfUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Lesson title is required' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const newLesson = {
      title,
      description,
      videoUrl,
      pdfUrl
    };

    module.lessons.push(newLesson);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson added successfully',
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===============================
// ✏️ UPDATE LESSON
// ===============================
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, videoUrl, pdfUrl } = req.body;

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const lesson = module.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Update fields only if provided
    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (pdfUrl !== undefined) lesson.pdfUrl = pdfUrl;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: course
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===============================
// ❌ DELETE LESSON
// ===============================
router.delete('/:courseId/modules/:moduleId/lessons/:lessonId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const lesson = module.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    lesson.remove();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===============================
// ❌ DELETE MODULE
// ===============================
router.delete('/:courseId/modules/:moduleId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    module.remove();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ===============================
// 📖 GET FULL CURRICULUM
// ===============================
router.get('/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select('modules');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      data: course.modules
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;