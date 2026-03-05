const Assignment = require("../models/assignment.model");



exports.createAssignment = async (req, res) => {
    try {
        const assignment = new Assignment(req.body);

        await assignment.save();

        res.status(201).json({
            message: "Tạo assignment thành công",
            data: assignment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi tạo assignment",
            error: error.message,
        });
    }
};



exports.getAssignments = async (req, res) => {
    try {
        const { class_id, session_id, syllabus_id } = req.query;

        let filter = {};

        if (class_id) filter.class_id = class_id;
        if (session_id) filter.session_id = session_id;
        if (syllabus_id) filter.syllabus_id = syllabus_id;

        const assignments = await Assignment.find(filter)
            .populate("class_id")
            .populate("session_id")
            .populate("syllabus_id")
            .sort({ created_at: -1 });

        res.status(200).json({
            message: "Lấy danh sách assignment thành công",
            data: assignments,
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message,
        });
    }
};




exports.getAssignmentDetail = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const assignment = await Assignment.findById(assignmentId)
            .populate("class_id")
            .populate("session_id")
            .populate("syllabus_id");

        if (!assignment) {
            return res.status(404).json({
                message: "Không tìm thấy assignment",
            });
        }

        res.status(200).json({
            message: "Lấy chi tiết assignment thành công",
            data: assignment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi server",
            error: error.message,
        });
    }
};



exports.updateAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const assignment = await Assignment.findByIdAndUpdate(
            assignmentId,
            req.body,
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                message: "Không tìm thấy assignment",
            });
        }

        res.status(200).json({
            message: "Cập nhật assignment thành công",
            data: assignment,
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi cập nhật assignment",
            error: error.message,
        });
    }
};



exports.deleteAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const assignment = await Assignment.findByIdAndDelete(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                message: "Không tìm thấy assignment",
            });
        }

        res.status(200).json({
            message: "Xóa assignment thành công",
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi khi xóa assignment",
            error: error.message,
        });
    }
};