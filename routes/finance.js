const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  renderAll,
  renderNew,
  fetchFinances,
  postNew,
  checkProject,
  pushEdit,
  deleteFile,
  deleteFinance,
  fetchCharts,
  renderEdit,
} = require("../controllers/finance");

const { Finance } = require("../models");
const wrapAsync = require("../utils/wrapAsync");
const { uploads } = require("../multerconf");

router
  .route("/new")
  .get(renderNew)
  .post(checkProject, uploads("finance").array("files"), postNew);

router.get("/", renderAll);
router.get("/fetch", fetchFinances);
router.get("/charts", fetchCharts);
router
  .route("/:id/edit")
  .get(renderEdit)
  .post(
    wrapAsync(async (req, res, next) => {
      const { inproject } = req.query;
      const { id } = req.params;
      const finance = await Finance.findByPk(id);
      if (finance.UserId == null) {
        if (req.user.accessLevel <= 1 || req.user.isHr) {
          return next();
        }
      }
      let redirect = "/manage/finance";
      if (finance.ProjectId) {
        if (inproject) {
          redirect = `/projects/${finance.ProjectId}/finance`;
        }
      }
      if (finance.UserId == null || finance.UserId == "") {
        if (req.user.accessLevel <= 1) {
          return next();
        }
      } else {
        if (req.user.id == finance.UserId) {
          return next();
        }
      }
      res.redirect(redirect);
    }),
    uploads("finance").array("files"),
    pushEdit
  )
  .delete(deleteFinance);
router.delete("/:id/filedelete/:fileid", deleteFile);


module.exports = router;
