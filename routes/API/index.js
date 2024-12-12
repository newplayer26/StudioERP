const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./user");

let router = express.Router();

let initAPIRoutes = (app) => {

    router.use("/auth", authRoutes);
    router.use("/user", userRoutes);

    return app.use("/api", router);
}

module.exports = initAPIRoutes;