const express = require("express");
const router = express.Router({ mergeParams: true });
const { Kpi, KpiGroup } = require("../models");
const { Op } = require("sequelize");
const wrapAsync = require("../utils/wrapAsync");
const moment = require("moment");


router.post('/', express.json() ,wrapAsync(async(req,res) => {
    const {title} = req.body;
    await KpiGroup.create({title});
    res.send('done');
}))

router.get('/kpiInfo', wrapAsync(async(req,res) => {
    const {id}= req.query;
    Kpi.findByPk(id).then(kpi => res.send(kpi)).catch(err => console.log(err));
}))

module.exports = router;