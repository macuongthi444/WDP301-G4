// src/controllers/fileResource.controller.js
const FileResource = require('../models/fileResource.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer lưu file vào public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ hỗ trợ file: images, pdf, doc, txt'));
  },
}).single('file'); // Field tên 'file' trong form-data

// 1. Upload file mới (cho Syllabus/Assignment/Submission)
exports.uploadFile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { type, ownerType, ownerId } = req.body;
      const uploadedBy = req.user._id;

      if (!type || !ownerType || !ownerId) {
        return res.status(400).json({ message: 'Thiếu type, ownerType hoặc ownerId' });
      }

      let url_or_content;
      let file_name;

      if (req.file) {
        // Upload file thật
        url_or_content = `/uploads/${req.file.filename}`;
        file_name = req.file.originalname;
      } else if (req.body.url_or_content) {
        // Link hoặc Text
        url_or_content = req.body.url_or_content;
        file_name = type === 'TEXT' ? 'Nội dung văn bản' : null;
      } else {
        return res.status(400).json({ message: 'Thiếu file hoặc url_or_content' });
      }

      const resource = new FileResource({
        type,
        url_or_content,
        file_name,
        ownerType,
        ownerId,
        uploaded_by: uploadedBy,
      });

      await resource.save();

      res.status(201).json({
        message: 'Upload file thành công',
        data: resource,
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server khi upload', error: error.message });
    }
  });
};

// 2. Lấy danh sách file theo owner
exports.getFilesByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.query;
    const uploadedBy = req.user._id;

    if (!ownerType || !ownerId) {
      return res.status(400).json({ message: 'Thiếu ownerType hoặc ownerId' });
    }

    const files = await FileResource.find({ ownerType, ownerId, uploaded_by: uploadedBy })
      .sort({ created_at: -1 });

    res.status(200).json({
      message: 'Lấy danh sách file thành công',
      data: files,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Xóa file
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const uploadedBy = req.user._id;

    const file = await FileResource.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'Không tìm thấy file' });
    }

    if (file.uploaded_by.toString() !== uploadedBy.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa file này' });
    }

    // Xóa file vật lý nếu là FILE/IMAGE
    if (file.type === 'FILE' || file.type === 'IMAGE') {
      const filePath = path.join(__dirname, '../../public', file.url_or_content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await FileResource.findByIdAndDelete(fileId);

    res.status(200).json({ message: 'Xóa file thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};