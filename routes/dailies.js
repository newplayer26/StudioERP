const express = require("express");
const router = express.Router({ mergeParams: true });
const {renderEdit, deleteFile, postEdit, checkCredentials} = require("../controllers/dailies")
const {uploads} = require('../multerconf')

router.get('/:id/edit', checkCredentials,renderEdit)
router.delete('/:id/filedelete/:fileid', deleteFile);
router.post('/:id/edit',checkCredentials, uploads('dailies').array('files') ,postEdit)

module.exports = router;