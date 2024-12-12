const express = require("express");
const router = express.Router({ mergeParams: true });
router.use(express.json());

const APIauth = require("../../controllers/api/user");

router.post('/all-user-data', APIauth.allUserData);

module.exports = router;
