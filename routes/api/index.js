const express = require("express");
const auth = require("../auth");

const router = express.Router();

router.use("/enginemaintenance", require("./enginemaintenance"));


let users = require("./users");
router  .post("/users",         auth.optional, users.createUser)
        .post("/users/login",   auth.optional, users.login)
        .get( "/users/current", auth.required, users.getCurrent);


let boats = require("./boats");
router.use(     "/boats",         auth.required, boats.checkAuth)
        .get(   "/boats",         auth.required, boats.getBoats)
        .post(  "/boats",         auth.required, boats.addBoat)
        .post(  "/boats/:boatId", auth.required, boats.changeBoat)
        .delete("/boats/:boatId", auth.required, boats.deleteBoat);


let tasks = require("./tasks");
router.use(     "/tasks/:boatId",         auth.required, tasks.checkAuth)
        .get(   "/tasks/:boatId",         auth.required, tasks.getTasks)
        .post(  "/tasks/:boatId",         auth.required, tasks.createTask)
        .post(  "/tasks/:boatId/:taskId", auth.required, tasks.changeTask)
        .delete("/tasks/:boatId/:taskId", auth.required, tasks.deleteTask);


let entries = require("./entries");
router.use(     "/entries/:boatId",                 auth.required, entries.checkAuth)
        .get(   "/entries/:boatId/:taskId",         auth.required, entries.getEntries)
        .post(  "/entries/:boatId/:taskId",         auth.required, entries.createEntry)
        .post(  "/entries/:boatId/:taskId/:entryId",auth.required, entries.changeEntry)
        .delete("/entries/:boatId/:taskId/:entryId",auth.required, entries.deleteEntry);


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