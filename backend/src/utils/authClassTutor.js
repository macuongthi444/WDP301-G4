// src/utils/authClassTutor.js
const Class = require("../models/class.model");

exports.mustBeTutorOfClass = async (classId, tutorId) => {
  const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
  if (!classDoc) {
    const err = new Error("Bạn không có quyền với lớp này");
    err.status = 403;
    throw err;
  }
  return classDoc;
};