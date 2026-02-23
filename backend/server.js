const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route test
app.get('/api', (req, res) => {
  res.json({ message: 'Backend Node.js + Express đang chạy ổn!' });
});

// Route sẽ thêm sau (user, post, auth...)
app.get('/', (req, res) => {
  res.send('Welcome to WDP301 Backend');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});