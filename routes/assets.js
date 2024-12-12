const express = require("express");
const router = express.Router({ mergeParams: true });
const {
    renderNew,
    renderAll,
    fetchAll,
    renderEdit,
    pushEdit,
    postNew,
    deleteAsset
} = require("../controllers/assets");


router.get('/', renderAll)
router.get('/fetch', fetchAll);
router.route('/new').get(renderNew).post(postNew);

router.route('/:id/edit').get( renderEdit).post(pushEdit).delete(deleteAsset)



module.exports = router;
