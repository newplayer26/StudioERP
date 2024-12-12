const express = require("express");
const router = express.Router({ mergeParams: true });
router.use(express.json());

const APIauth = require("../../controllers/api/auth");

router.post('/sys-login', APIauth.sysLogin);
router.post('/auto-login', APIauth.autoLogin);

module.exports = router;
