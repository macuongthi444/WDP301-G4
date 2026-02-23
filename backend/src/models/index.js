// src/models/index.js
const mongoose = require('mongoose');
const Role = require('./role.model');
const User = require('./user.model');
const Class = require('./class.model');
const ClassEnrollment = require('./classEnrollment.model');
const WeeklySchedule = require('./weeklySchedule.model');
const TeachingSession = require('./teachingSession.model');
const Attendance = require('./attendance.model');
const SessionAssessment = require('./sessionAssessment.model');
const Syllabus = require('./syllabus.model');
const Assignment = require('./assignment.model');
const HomeworkSubmission = require('./homeworkSubmission.model');
const FileResource = require('./fileResource.model');
const PlatformPolicy = require('./platformPolicy.model');
const Notification = require('./notification.model');

// Cấu hình mongoose dạng global
mongoose.Promise = global.Promise;

// Định nghĩa đối tượng DB
const db = {};
db.mongoose = mongoose;

// Bổ sung các thuộc tính cho DB
db.role = Role;
db.user = User;
db.class = Class;
db.classEnrollment = ClassEnrollment;
db.weeklySchedule = WeeklySchedule;
db.teachingSession = TeachingSession;
db.attendance = Attendance;
db.sessionAssessment = SessionAssessment;
db.syllabus = Syllabus;
db.assignment = Assignment;
db.homeworkSubmission = HomeworkSubmission;
db.fileResource = FileResource;
db.platformPolicy = PlatformPolicy;
db.notification = Notification;


// Thuộc tính tham chiếu tới action kết nối CSDL
db.connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.DB_NAME,
    })
        .then(() => console.log("Connect to MongoDB success"))
        .catch(error => {
            console.error(error.message);
            process.exit();
        });
};

module.exports = db;