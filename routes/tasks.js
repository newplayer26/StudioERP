const express = require("express");
const router = express.Router({ mergeParams: true });
const {renderTask, assessTask, checkCredentials, setStatus,deleteTask, renderEdit, editTask, submitReport, deleteReport, confirmRead, deleteFile} = require("../controllers/tasks")
const {uploads} = require('../multerconf')

router.route("/:id").get(renderTask).delete(checkCredentials, deleteTask).put(checkCredentials, editTask);
router.post("/:id/assess", uploads('reports').array('files'), assessTask)
router.post("/:id/report", uploads('reports').array('files'), submitReport)
router.route("/:id/edit").get(checkCredentials,renderEdit).put(checkCredentials, uploads('tasks').array('files'), editTask)
router.delete("/:id/reports/:repId", deleteReport);
router.post("/:id/confirmread", express.json(), confirmRead)
router.post('/:id/changestatus', express.json(), setStatus)
router.delete('/:id/filedelete/:fileid', checkCredentials, deleteFile);

module.exports = router;