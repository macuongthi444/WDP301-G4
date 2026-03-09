// src/controllers/syllabus.controller.js
const Syllabus = require('../models/syllabus.model');
const FileResource = require('../models/fileResource.model');

// 1. Tạo syllabus mới (có thể tạo kèm file nếu cần)
exports.createSyllabus = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const {
      title,
      description,
      version,
      gradeLevel,
      subject,
      classLevel = [], // giờ là mảng ObjectId (string dạng "64f...abc")
      file_resources = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Tiêu đề syllabus là bắt buộc' });
    }

    // Kiểm tra cơ bản (tùy chọn): classLevel phải là mảng ObjectId hợp lệ
    if (classLevel.length > 0 && !classLevel.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Một số ID lớp học không hợp lệ' });
    }

    const syllabus = new Syllabus({
      tutor_user_id: tutorId,
      title,
      description,
      version: version || '1.0',
      gradeLevel,
      subject,
      classLevel, // mảng ObjectId
      file_resources,
    });

    await syllabus.save();
    await syllabus.populate([
      'file_resources',
      'classLevel' // populate thêm thông tin lớp học
    ]);

    res.status(201).json({
      message: 'Tạo syllabus thành công',
      data: syllabus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo syllabus', error: error.message });
  }
};

// 2. Lấy danh sách syllabus của tutor
exports.getMySyllabi = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const syllabi = await Syllabus.find({ tutor_user_id: tutorId })
      .sort({ created_at: -1 })
      .populate('file_resources');

    res.status(200).json({
      message: 'Lấy danh sách syllabus thành công',
      data: syllabi,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Lấy chi tiết syllabus (bao gồm file)
exports.getSyllabusDetail = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const syllabusId = req.params.id;

    const syllabus = await Syllabus.findOne({ _id: syllabusId, tutor_user_id: tutorId })
      .populate('file_resources');

    if (!syllabus) {
      return res.status(404).json({ message: 'Không tìm thấy syllabus hoặc bạn không có quyền' });
    }

    res.status(200).json({
      message: 'Lấy chi tiết syllabus thành công',
      data: syllabus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 4. Cập nhật syllabus (có thể thêm/xóa file_resources)
exports.updateSyllabus = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const syllabusId = req.params.id;

    const updates = req.body;

    // Cho phép cập nhật các trường
    const allowedUpdates = [
      'title', 'description', 'version',
      'gradeLevel', 'subject', 'classLevel',
      'file_resources'
    ];

    const validUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });

    // Kiểm tra classLevel nếu có update
    if (validUpdates.classLevel && !validUpdates.classLevel.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'Một số ID lớp học không hợp lệ' });
    }

    const updatedSyllabus = await Syllabus.findOneAndUpdate(
      { _id: syllabusId, tutor_user_id: tutorId },
      validUpdates,
      { new: true, runValidators: true }
    ).populate(['file_resources', 'classLevel']);

    if (!updatedSyllabus) {
      return res.status(404).json({ message: 'Không tìm thấy syllabus hoặc không có quyền' });
    }

    res.status(200).json({
      message: 'Cập nhật syllabus thành công',
      data: updatedSyllabus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 5. Xóa syllabus (xóa cả file_resources liên quan nếu cần)
exports.deleteSyllabus = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const syllabusId = req.params.id;

    const syllabus = await Syllabus.findOne({ _id: syllabusId, tutor_user_id: tutorId });

    if (!syllabus) {
      return res.status(404).json({ message: 'Không tìm thấy syllabus hoặc không có quyền' });
    }

    // Optional: Xóa các FileResource liên quan
    await FileResource.deleteMany({ ownerType: 'SYLLABUS', ownerId: syllabusId });

    await Syllabus.findByIdAndDelete(syllabusId);

    res.status(200).json({
      message: 'Xóa syllabus thành công',
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};