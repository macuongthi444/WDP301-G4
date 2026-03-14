const FileResource = require('../models/fileResource.model');
const supabase = require('../config/supabase');
const multer = require('multer');

// Chỉ dùng multer để parse file từ request (không lưu disk hay cloudinary)
const upload = multer().single('file');

// 1. Upload file lên Supabase Storage
exports.uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Lỗi parse file: ' + err.message });
    }

    try {
      const { type, ownerType, ownerId } = req.body;
      const uploadedBy = req.user._id;

      if (!type || !ownerType || !ownerId || !req.file) {
        return res.status(400).json({ message: 'Thiếu thông tin hoặc file' });
      }

      // Tạo tên file unique và đường dẫn trên Supabase
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = `tutor-${uploadedBy}/${fileName}`; // tổ chức theo tutor để dễ quản lý

      // Upload file lên bucket 'syllabus-files' (bucket bạn đã tạo public)
      const { data, error: uploadError } = await supabase.storage
        .from('WDP301')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false, // không ghi đè nếu trùng tên
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ message: 'Lỗi upload lên Supabase: ' + uploadError.message });
      }

      // Lấy public URL
      const { data: publicData } = supabase.storage
        .from('WDP301')
        .getPublicUrl(filePath);

      const finalUrl = publicData.publicUrl;

      // Lưu metadata vào MongoDB
      const resource = new FileResource({
        type: type || 'FILE', // 'FILE' hoặc 'IMAGE' tùy bạn phân biệt
        url_or_content: finalUrl,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        ownerType,
        ownerId,
        uploaded_by: uploadedBy,
      });

      await resource.save();

      res.status(201).json({
        message: 'Upload tài nguyên thành công',
        data: resource,
      });
    } catch (error) {
      console.error('Lỗi upload tổng:', error);
      res.status(500).json({ message: 'Lỗi server khi upload', error: error.message });
    }
  });
};

// 2. Lấy danh sách file theo owner (giữ nguyên như cũ, không liên quan Supabase)
exports.getFilesByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.query;
    const uploadedBy = req.user._id;

    if (!ownerType || !ownerId) {
      return res.status(400).json({ message: 'Thiếu ownerType hoặc ownerId' });
    }

    const files = await FileResource.find({
      ownerType,
      ownerId,
      uploaded_by: uploadedBy,
    })
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({
      message: 'Lấy danh sách tài nguyên thành công',
      data: files,
    });
  } catch (error) {
    console.error('Lỗi get files:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Xóa file (xóa metadata trong MongoDB + xóa file thật trên Supabase)
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const uploadedBy = req.user._id;

    const file = await FileResource.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
    }

    if (file.uploaded_by.toString() !== uploadedBy.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài nguyên này' });
    }

    // Nếu file có url Supabase → xóa file thật trên bucket
    if (file.url_or_content) {
      // Lấy filePath từ URL (ví dụ: https://abc.supabase.co/storage/v1/object/public/syllabus-files/tutor-xxx/tenfile.docx)
      const urlParts = file.url_or_content.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1]; // syllabus-files/tutor-xxx/tenfile.docx

        const { error: deleteError } = await supabase.storage
          .from('WDP301')
          .remove([filePath]);

        if (deleteError) {
          console.error('Supabase delete error:', deleteError);
          // Không return lỗi để tránh block nếu file đã bị xóa trước đó
        }
      }
    }

    // Xóa metadata trong MongoDB
    await FileResource.findByIdAndDelete(fileId);

    res.status(200).json({ message: 'Xóa tài nguyên thành công' });
  } catch (error) {
    console.error('Lỗi xóa file:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa', error: error.message });
  }
};