const router = require("express").Router();
const ctrl = require("../controllers/sessionSave.controller");

router.post("/class/:classId/sessions/:sessionId/save-ui", ctrl.saveSessionUI);

module.exports = router;