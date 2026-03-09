// backend/src/routers/teachingSession.routes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");

const tsCtrl = require("../controllers/teachingSession.controller");
const saveCtrl = require("../controllers/sessionSave.controller");

// helper: bắt lỗi rõ ràng handler nào undefined
const mustFn = (fn, name) => {
  if (typeof fn !== "function") {
    throw new Error(`[teachingSession.routes] Handler "${name}" is ${typeof fn}. Check export/import.`);
  }
  return fn;
};

router.use(protect);
router.use(authorize("TUTOR"));

// routes cũ
router.get("/:classId/sessions", mustFn(tsCtrl.getSessionsByClass, "getSessionsByClass"));
router.get("/:classId/sessions/:sessionId", mustFn(tsCtrl.getSessionDetail, "getSessionDetail"));
router.patch(
  "/:classId/sessions/:sessionId/status",
  mustFn(tsCtrl.updateSessionStatus, "updateSessionStatus")
);

// ✅ routes mới cho UI
router.post(
  "/:classId/sessions/ui-detail",
  mustFn(tsCtrl.getSessionUIDetailByDate, "getSessionUIDetailByDate")
);

router.post(
  "/:classId/sessions/:sessionId/save-ui",
  mustFn(saveCtrl.saveSessionUI, "saveSessionUI")
);
router.get('/', mustFn(tsCtrl.getTutorAllSessions, "getTutorAllSessions"));
module.exports = router;