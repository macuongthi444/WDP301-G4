// server.js (đặt ở thư mục gốc dự án)

const express = require('express');
const dotenv = require('dotenv');
const db = require('./src/models/index'); // Đường dẫn đến file models/index.js

// Load biến môi trường từ .env
dotenv.config();

// Kết nối database
db.connectDB();

// Tạo Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// CORS nếu cần (cho phép truy cập từ frontend, ví dụ: React app)
const cors = require('cors');
app.use(cors({ origin: '*' })); // Thay '*' bằng domain cụ thể cho production

// Routes placeholder (thêm routes thực tế ở đây)
app.get('/', (req, res) => {
  res.send('Welcome to Education Management API!');
});

// Ví dụ route sử dụng model (lấy danh sách users)
app.get('/users', async (req, res) => {
  try {
    const users = await db.user.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ví dụ route khác (lấy danh sách classes)
app.get('/classes', async (req, res) => {
  try {
    const classes = await db.class.find();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Listen port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});