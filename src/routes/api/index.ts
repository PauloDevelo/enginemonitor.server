import express from "express";
import auth from "../auth";

const router = express.Router();

import users from "./users";
router  .post("/users",                 auth.optional, users.createUser)
        .post("/users/login",           auth.optional, users.login)
        .post("/users/resetpassword",   auth.optional, users.resetPassword)
        .post("/users/verificationemail", auth.optional, users.verificationEmail)
        .get( "/users/changepassword",  auth.optional, users.changePassword)
        .get( "/users/verification",    auth.optional, users.checkEmail)
        .get( "/users/current",         auth.required, users.getCurrent);

import equipments from "./equipments";
import importEngineMaintenance from "./importEngineMaintenance";
router.use(     "/equipments",                  auth.required, equipments.checkAuth)
        .get(   "/equipments",                  auth.required, equipments.getEquipments)
         // tslint:disable-next-line:max-line-length
        .get(   "/equipments/:equipmentId/import/:serverIpAddress",     auth.required, importEngineMaintenance.importMaintenanceHistory)
        .post(  "/equipments",                  auth.required, equipments.addEquipment)
        .post(  "/equipments/:equipmentId",     auth.required, equipments.changeEquipment)
        .delete("/equipments/:equipmentId",     auth.required, equipments.deleteEquipment);

import tasks from "./tasks";
router.use(     "/tasks/:equipmentId",         auth.required, tasks.checkAuth)
        .get(   "/tasks/:equipmentId",         auth.required, tasks.getTasks)
        .post(  "/tasks/:equipmentId",         auth.required, tasks.createTask)
        .post(  "/tasks/:equipmentId/:taskId", auth.required, tasks.changeTask)
        .delete("/tasks/:equipmentId/:taskId", auth.required, tasks.deleteTask);

import entries from "./entries";
router.use(     "/entries/:equipmentId",                 auth.required, entries.checkAuth)
        .get(   "/entries/:equipmentId/:taskId",         auth.required, entries.getEntries)
        .post(  "/entries/:equipmentId/:taskId",         auth.required, entries.createEntry)
        .post(  "/entries/:equipmentId/:taskId/:entryId", auth.required, entries.changeEntry)
        .delete("/entries/:equipmentId/:taskId/:entryId", auth.required, entries.deleteEntry);

router.use("/", (err: any, req: express.Request, res: express.Response, next: any) => {
    if (err) {
        res.status(err.status || 500).json({
            errors: {
                error: err,
                message: err.message,
            },
        });
    }
});

export default router;
