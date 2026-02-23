exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    if (user.status !== 'PENDING') {
      return res.status(400).json({ message: 'Tài khoản không ở trạng thái chờ duyệt' });
    }

    user.status = 'ACTIVE';
    await user.save();

    // Optional: Gửi email thông báo
    await sendOTPEmail(user.email, null, 'approval'); // chỉnh sendOTPEmail để hỗ trợ type 'approval'

    res.status(200).json({ message: 'Tài khoản đã được duyệt thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};