// src/controllers/syllabus.controller.js
const Syllabus = require('../models/syllabus.model');
const FileResource = require('../models/fileResource.model');
const mongoose = require('mongoose');
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
      classLevel = [], 
      file_resources = [],
    } = req.body;

    // console.log('Payload nhận được từ frontend:', {
    //   title,
    //   classLevel: classLevel,                // xem có mảng ID không
    //   classLevelType: typeof classLevel,     // nên là 'object' (array)
    //   firstClassIdType: classLevel[0] ? typeof classLevel[0] : 'empty'
    // });

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Tiêu đề syllabus là bắt buộc' });
    }

    // Cast classLevel từ string[] → ObjectId[]
    let validClassLevel = [];
    if (Array.isArray(classLevel) && classLevel.length > 0) {
      validClassLevel = classLevel.map((id, index) => {
        if (!id) {
          throw new Error(`ID lớp tại vị trí ${index} là rỗng`);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`ID lớp không hợp lệ tại vị trí ${index}: ${id}`);
        }
        return new mongoose.Types.ObjectId(id); // ← CAST Ở ĐÂY
      });
    }

    const syllabus = new Syllabus({
      tutor_user_id: tutorId,
      title: title.trim(),
      description: description?.trim(),
      version: version?.trim() || '1.0',
      gradeLevel,
      subject: subject?.trim(),
      classLevel: validClassLevel,           // dùng mảng đã cast
      file_resources,
    });

    await syllabus.save();

    // Populate sau khi save thành công
    await syllabus.populate([
      { path: 'file_resources' },
      { path: 'classLevel' }
    ]);

    res.status(201).json({
      message: 'Tạo syllabus thành công',
      data: syllabus,
    });
  } catch (error) {
    console.error('Lỗi tạo syllabus:', error); // log đầy đủ stack
    res.status(500).json({ 
      message: 'Lỗi server khi tạo syllabus', 
      error: error.message,
      stack: error.stack?.split('\n').slice(0,3).join('\n') // chỉ lấy vài dòng đầu
    });
  }
};

// 2. Lấy danh sách syllabus của tutor
exports.getMySyllabi = async (req, res) => {
  try {
    const tutorId = req.user._id;

    const syllabi = await Syllabus.find({ tutor_user_id: tutorId })
      .sort({ created_at: -1 })
      .populate('file_resources')
      .populate('classLevel');

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
      .populate('file_resources')
      .populate('classLevel');

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