const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  checkCredentials,
  renderNewForm,
  createUser,
  renderProfile,
  renderEdit,
  pushEditPi,
  showEmployees,
  editPw,
  setAvatar,
  isOwnProfile,
  workInfoPage,
  submitInfoPage,
} = require("../controllers/hr");

const { uploads } = require("../multerconf");
router.route("/").get(showEmployees);
router
  .route("/new")
  .get(checkCredentials, renderNewForm)
  .post(checkCredentials, uploads("contracts").single("contract"), createUser);

router.route("/:id/").get(renderProfile).put(isOwnProfile, pushEditPi);

router.route("/:id/edit").get(renderEdit);

router.post("/:id/pw", isOwnProfile, editPw);

router.post(
  "/:id/avatar",
  isOwnProfile,
  uploads("avatars").single("avatar"),
  setAvatar
);

router
  .route("/:id/info")
  .get(checkCredentials, workInfoPage)
  .post(
    checkCredentials,
    uploads("contracts").single("contract"),
    submitInfoPage
  );

module.exports = router;
