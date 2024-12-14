const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  renderTask,
  assessTask,
  checkCredentials,
  setStatus,
  deleteTask,
  renderEdit,
  editTask,
  submitReport,
  deleteReport,
  confirmRead,
  deleteFile,
} = require("../controllers/tasks");
const { uploads } = require("../multerconf");

router.route("/:id").get(renderTask).delete(checkCredentials, deleteTask);
router.post(
  "/:id/assess",
  checkCredentials,
  uploads("task_reports").array("files"),
  assessTask
);
router.post(
  "/:id/report",
  uploads("task_reports").array("files"),
  submitReport
);
router
  .route("/:id/edit")
  .get(checkCredentials, renderEdit)
  .patch(checkCredentials, uploads("tasks").array("files"), editTask);
router.delete("/:id/reports/:repId", deleteReport);
router.delete("/:id/filedelete/:fileid", checkCredentials, deleteFile);

module.exports = router;
