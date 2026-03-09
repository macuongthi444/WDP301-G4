const Assignment = require("../models/assignment.model");
const HomeworkSubmission = require("../models/homeworkSubmission.model");
const FileResource = require("../models/fileResource.model");
const Class = require("../models/class.model"); // giả sử có model Class

// 1. Tạo bài tập mới (tutor tạo, mặc định DRAFT)
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
    } = req.body;

    console.log('[CREATE ASSIGNMENT] Request body:', req.body);
    console.log('[CREATE ASSIGNMENT] Tutor ID:', tutorId.toString());

    const classDoc = await Class.findById(class_id);
    if (!classDoc) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }
    if (classDoc.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: "Không có quyền tạo bài tập cho lớp này" });
    }

    // Kiểm tra ASSIGNMENT_STATUS - thêm fallback nếu chưa define
    const validStatuses = ["DRAFT", "PUBLISHED", "CLOSED"]; // tạm hardcode để test
    // Nếu bạn có định nghĩa ở file khác → import đúng: const { ASSIGNMENT_STATUS } = require('../constants');
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const assignment = new Assignment({
      class_id,
      session_id: session_id || null,
      syllabus_id: syllabus_id || null,
      tutor_user_id: tutorId,
      title: title?.trim() || "Bài tập không tên",
      description: description?.trim() || "",
      due_at: due_at ? new Date(due_at) : null,  // convert string → Date
      generated_by_ai,
      ai_prompt: generated_by_ai ? (ai_prompt?.trim() || null) : null,
      status,
    });

    console.log('[CREATE ASSIGNMENT] Assignment trước khi save:', assignment.toObject());

    await assignment.save();

    console.log('[CREATE ASSIGNMENT] Save thành công, ID:', assignment._id);

    res.status(201).json({
      message: "Tạo bài tập thành công",
      assignment,
    });
  } catch (error) {
    console.error('[CREATE ASSIGNMENT ERROR]:', error.stack || error);
    res.status(500).json({ 
      message: "Lỗi server khi tạo bài tập", 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n') // chỉ gửi 3 dòng đầu cho an toàn
    });
  }
};

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

// 3. Lấy danh sách bài tập của tutor
exports.getTutorAssignments = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { class_id, status } = req.query;

    const filter = { tutor_user_id: tutorId };
    if (class_id) filter.class_id = class_id;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate("class_id", "name")
      .sort({ created_at: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. Lấy chi tiết bài tập + thống kê submission
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id)
      .populate("class_id", "name students")
      .populate("tutor_user_id", "full_name");

    if (!assignment || assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    }

    // Thống kê số lượng theo status submission
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
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 5. Cập nhật bài tập (chỉ DRAFT hoặc chưa PUBLISHED)
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: "Không tìm thấy" });
    if (assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    if (assignment.status === "PUBLISHED" || assignment.status === "CLOSED") {
      return res.status(400).json({ message: "Không thể sửa bài đã giao hoặc đóng" });
    }

    const fields = ["title", "description", "due_at", "session_id", "syllabus_id", "status"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) assignment[f] = req.body[f];
    });

    await assignment.save();
    res.json({ message: "Cập nhật thành công", assignment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 6. Xóa bài tập
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.tutor_user_id.toString() !== tutorId.toString()) {
      return res.status(404).json({ message: "Không tìm thấy hoặc không có quyền" });
    }

    await HomeworkSubmission.deleteMany({ assignment_id: id });
    await FileResource.deleteMany({
      $or: [
        { ownerType: "ASSIGNMENT", ownerId: id },
        { ownerType: "SUBMISSION", ownerId: { $in: (await HomeworkSubmission.find({ assignment_id: id })).map(s => s._id) } }
      ]
    });

    await Assignment.findByIdAndDelete(id);

    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
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