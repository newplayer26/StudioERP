const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  renderProjects,
  renderUsers,
  renderTimekeep,
  checkAccessLevel,
  fetchUsers,
  fetchSalary,
  renderDashboard,
  fetchChartProjects,
  rednerSalary,
  fetchTimekeep,
} = require("../controllers/manage");

const assetRoutes = require('./assets');
const  financeRoutes = require('./finance');

router.get("/", renderDashboard);
router.get("/projects", renderProjects);
router.get("/users", renderUsers);

router.get("/salary", rednerSalary);
router.get("/timekeep", renderTimekeep);


router.get("/users/fetch", fetchUsers);

router.get("/salary/fetch", fetchSalary);
router.get("/chart/projects", fetchChartProjects);
router.get("/timekeep/users", fetchTimekeep);

router.use('/assets', assetRoutes);
router.use('/finance', financeRoutes);

module.exports = router;
