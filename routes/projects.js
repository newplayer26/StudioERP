const express = require("express");
const router = express.Router({ mergeParams: true });
const { uploads } = require("../multerconf");

const {
  renderProjectPage,
  renderNew,
  renderProject,
  checkCredentials,
  checkCredentials2,
  createProject,
  postTask,
  deleteProject,
  editProject,
  renderEdit,
  newTaskForm,
  renderMembersPage,
  deleteMember,
  addMembers,
  editMemberRights,
  isOwnProject,
  addFiles,
  deleteFile,
  renderKpis,
} = require("../controllers/projects");

router.get("/", renderProjectPage);
router.get("/new", checkCredentials, renderNew);
router.post("/", checkCredentials, createProject);
router
  .route("/:id")
  .get(renderProject)
  .delete(checkCredentials, deleteProject)
  .patch(checkCredentials2, uploads("projects").array("files"), editProject);
router.get("/:id/tasks/new", isOwnProject, newTaskForm);
router.post(
  "/:id/tasks",
  isOwnProject,
  uploads("tasks").array("uploadedFiles"),
  postTask
);
router.get("/:id/edit", checkCredentials2, renderEdit);
router.get("/:id/members", isOwnProject, renderMembersPage);

router.delete("/:id/deletemember", checkCredentials2, deleteMember);
router.post("/:id/addmember", checkCredentials2, addMembers);

router.post("/:id/editmemberrights", checkCredentials2, editMemberRights);
//router.post("/:id/kpi", checkCredentials2, postKpi);
router.post(
  "/:id/addfiles",
  checkCredentials2,
  uploads("projects").array("files"),
  addFiles
);

router.delete("/:id/filedelete/:fileid", checkCredentials2, deleteFile);

module.exports = router;
