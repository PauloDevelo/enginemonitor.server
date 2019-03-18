const express = require("express");
const auth = require("../auth");

const router = express.Router();

router.use("/enginemaintenance", require("./enginemaintenance"));

let users = require("./users");
router  .post("/users",         auth.optional, users.createUser)
        .post("/users/login",   auth.optional, users.login)
        .get( "/users/current", auth.required, users.getCurrent);

const importEngineMaintenance = require("./importEngineMaintenance")
let equipments = require("./equipments");
router.use(     "/equipments",                  auth.required, equipments.checkAuth)
        .get(   "/equipments",                  auth.required, equipments.getEquipments)
        .get(   "/equipments/:equipmentId/import/:serverIpAddress",     auth.required, importEngineMaintenance.importMaintenanceHistory)
        .post(  "/equipments",                  auth.required, equipments.addEquipment)
        .post(  "/equipments/:equipmentId",     auth.required, equipments.changeEquipment)
        .delete("/equipments/:equipmentId",     auth.required, equipments.deleteEquipment);


let tasks = require("./tasks");
router.use(     "/tasks/:equipmentId",         auth.required, tasks.checkAuth)
        .get(   "/tasks/:equipmentId",         auth.required, tasks.getTasks)
        .post(  "/tasks/:equipmentId",         auth.required, tasks.createTask)
        .post(  "/tasks/:equipmentId/:taskId", auth.required, tasks.changeTask)
        .delete("/tasks/:equipmentId/:taskId", auth.required, tasks.deleteTask);


let entries = require("./entries");
router.use(     "/entries/:equipmentId",                 auth.required, entries.checkAuth)
        .get(   "/entries/:equipmentId/:taskId",         auth.required, entries.getEntries)
        .post(  "/entries/:equipmentId/:taskId",         auth.required, entries.createEntry)
        .post(  "/entries/:equipmentId/:taskId/:entryId",auth.required, entries.changeEntry)
        .delete("/entries/:equipmentId/:taskId/:entryId",auth.required, entries.deleteEntry);


router.use("/", (err, req, res, next) => {
    if(err){
        res.status(err.status || 500).json({
            errors: {
                message: err.message,
                error: err,
            },
        });
    }
});

module.exports = router;