const Assignment = require('../models/assignment.model');
const FileResource = require('../models/fileResource.model');
const Class = require('../models/class.model');
const HomeworkSubmission = require('../models/homeworkSubmission.model');
const mongoose = require('mongoose');

// 1. Tạo Assignment mới (nhận file_resources là mảng ID từ body)
exports.createAssignment = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const {
      class_id,
      session_id,
      syllabus_id,
      title,
      description,
      due_at,
      generated_by_ai = false,
      ai_prompt,
      status = "DRAFT",
      file_resources = [], // mảng ObjectId của FileResource
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Tiêu đề bài tập là bắt buộc' });
    }

    if (!class_id) {
      return res.status(400).json({ message: 'Phải chọn lớp học' });
    }

    // Kiểm tra lớp học tồn tại và thuộc tutor
    const classDoc = await Class.findById(class_id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Lớp học không tồn tại' });
    }
    if (classDoc.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: 'Không có quyền tạo bài tập cho lớp này' });
    }

    // Kiểm tra file_resources hợp lệ (nếu có)
    if (file_resources.length > 0) {
      const validIds = file_resources.every(id => mongoose.Types.ObjectId.isValid(id));
      if (!validIds) {
        return res.status(400).json({ message: 'Một số ID file không hợp lệ' });
      }

      // Kiểm tra quyền sở hữu file (chỉ file do tutor này upload)
      const files = await FileResource.find({
        _id: { $in: file_resources },
        uploaded_by: tutorId,
        ownerType: 'ASSIGNMENT', // có thể để trống hoặc 'ASSIGNMENT'
      });
      if (files.length !== file_resources.length) {
        return res.status(403).json({ message: 'Một số file không tồn tại hoặc không thuộc quyền của bạn' });
      }
    }

    const assignment = new Assignment({
      class_id,
      session_id: session_id || null,
      syllabus_id: syllabus_id || null,
      tutor_user_id: tutorId,
      title: title.trim(),
      description: description?.trim() || '',
      due_at: due_at ? new Date(due_at) : null,
      generated_by_ai,
      ai_prompt: generated_by_ai ? (ai_prompt?.trim() || null) : null,
      status,
      files: file_resources, // lưu mảng ID
    });

    await assignment.save();

    // Populate để trả về đầy đủ thông tin
    await assignment.populate([
      { path: 'class_id', select: 'name' },
      { path: 'files' },
      { path: 'tutor_user_id', select: 'full_name' },
    ]);

    res.status(201).json({
      message: 'Tạo bài tập thành công',
      assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Lỗi server khi tạo bài tập', 
      error: error.message 
    });
  }
};

// 2. Lấy danh sách bài tập của tutor
exports.getTutorAssignments = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { class_id, status } = req.query;

    const filter = { tutor_user_id: tutorId };
    if (class_id) filter.class_id = class_id;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate([
        { path: 'class_id', select: 'name' },
        { path: 'files' },
      ])
      .sort({ created_at: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Lấy chi tiết bài tập + thống kê
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id)
      .populate([
        { path: 'class_id', select: 'name students' },
        { path: 'tutor_user_id', select: 'full_name' },
        { path: 'files' },
      ]);

    if (!assignment || assignment.tutor_user_id._id.toString() !== tutorId.toString()) {
      return res.status(404).json({ message: 'Không tìm thấy hoặc không có quyền' });
    }

    // Thống kê submission (giữ nguyên)
    const stats = await HomeworkSubmission.aggregate([
      { $match: { assignment_id: assignment._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const submissionStats = {
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
      draft: stats.find(s => s._id === "DRAFT")?.count || 0,
      submitted: stats.find(s => s._id === "SUBMITTED")?.count || 0,
      graded: stats.find(s => s._id === "GRADED")?.count || 0,
    };

    res.json({ assignment, submission_stats: submissionStats });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 4. Cập nhật bài tập (chỉ DRAFT, hỗ trợ cập nhật file_resources)
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    if (assignment.status === 'PUBLISHED' || assignment.status === 'CLOSED') {
      return res.status(400).json({ message: 'Không thể sửa bài đã giao hoặc đóng' });
    }

    const updates = req.body;
    const allowedUpdates = [
      'title', 'description', 'due_at', 'session_id', 'syllabus_id', 'status',
      'generated_by_ai', 'ai_prompt', 'file_resources'
    ];

    const validUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });

    // Kiểm tra file_resources nếu có update
    if (validUpdates.file_resources) {
      if (!Array.isArray(validUpdates.file_resources)) {
        return res.status(400).json({ message: 'file_resources phải là mảng' });
      }
      const validIds = validUpdates.file_resources.every(id => mongoose.Types.ObjectId.isValid(id));
      if (!validIds) {
        return res.status(400).json({ message: 'Một số ID file không hợp lệ' });
      }

      // Kiểm tra quyền sở hữu file mới
      const files = await FileResource.find({
        _id: { $in: validUpdates.file_resources },
        uploaded_by: tutorId,
      });
      if (files.length !== validUpdates.file_resources.length) {
        return res.status(403).json({ message: 'Một số file không thuộc quyền của bạn' });
      }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      validUpdates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'class_id', select: 'name' },
      { path: 'files' },
      { path: 'tutor_user_id', select: 'full_name' },
    ]);

    res.json({ message: 'Cập nhật thành công', assignment: updatedAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 5. Xóa Assignment + xóa file liên quan
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findOne({ _id: id, tutor_user_id: tutorId });
    if (!assignment) {
      return res.status(404).json({ message: 'Không tìm thấy hoặc không có quyền' });
    }

    // Xóa các FileResource liên quan
    await FileResource.deleteMany({
      ownerType: 'ASSIGNMENT',
      ownerId: id,
    });

    // Xóa submission liên quan
    await HomeworkSubmission.deleteMany({ assignment_id: id });

    await Assignment.findByIdAndDelete(id);

    res.json({ message: 'Xóa bài tập thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Các hàm khác (publish, grade, count students...) giữ nguyên như cũ

// 2. Giao bài tập (cập nhật status thành PUBLISHED để học sinh thấy)
exports.publishAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: "Không tìm thấy bài tập" });
    if (assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    if (assignment.status === "PUBLISHED") {
      return res.status(400).json({ message: "Bài tập đã được giao rồi" });
    }

    assignment.status = "PUBLISHED";
    await assignment.save();

    res.json({ message: "Đã giao bài tập thành công", assignment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// 7. Lấy số học sinh được giao bài tập (dựa vào lớp)
exports.getAssignedStudentsCount = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).populate("class_id", "students");
    if (!assignment) return res.status(404).json({ message: "Không tìm thấy" });

    const count = assignment.class_id?.students?.length || 0;

    res.json({ total_assigned_students: count });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 8. Tutor chấm bài (cập nhật SUBMITTED → GRADED)
exports.gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const tutorId = req.user._id;
    const { score, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const submission = await HomeworkSubmission.findOne({
      assignment_id: assignmentId,
      student_user_id: studentId,
    });

    if (!submission) return res.status(404).json({ message: "Không tìm thấy bài nộp" });
    if (submission.status !== "SUBMITTED") {
      return res.status(400).json({ message: "Chỉ chấm được khi học sinh đã nộp" });
    }

    submission.status = "GRADED";
    submission.score = score;
    submission.feedback = feedback;
    submission.graded_at = new Date();

    await submission.save();

    res.json({ message: "Đã chấm bài thành công", submission });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};