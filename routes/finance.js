const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  renderAll,
  renderNew,
  fetchFinances,
  postNew,
  checkProject,
  pushEdit,
  deleteFinance,
  fetchCharts,
  renderEdit,
  isOwnReport,
  deleteFile,
} = require("../controllers/finance");

const { Finance } = require("../models");
const wrapAsync = require("../utils/wrapAsync");
const { uploads } = require("../multerconf");

router
  .route("/new")
  .get(renderNew)
  .post(uploads("finance").array("files"), postNew);

router.get("/", renderAll);
router.get("/fetch", fetchFinances);
router.get("/charts", fetchCharts);
router
  .route("/:id/edit")
  .get(isOwnReport, renderEdit)
  .post(isOwnReport, uploads("finance").array("files"), pushEdit);
//.delete(isOwnReport, deleteFinance);
router.delete("/:id/filedelete/:fileid", isOwnReport, deleteFile);

module.exports = router;
