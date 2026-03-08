const express = require("express");
const router = express.Router();

const {
    createAssignment,
    getAssignments,
    getAssignmentDetail,
    updateAssignment,
    deleteAssignment,
} = require("../controllers/assignment.controller");

const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);

router.post("/", authorize("TUTOR", "ADMIN"), createAssignment);

router.get("/", getAssignments);
router.get("/:id", getAssignmentDetail);

router.put("/:id", authorize("TUTOR", "ADMIN"), updateAssignment);

router.delete("/:id", authorize("TUTOR", "ADMIN"), deleteAssignment);

module.exports = router;