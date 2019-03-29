import axios from "axios";
import mongoose from "mongoose";
import passport from "passport";
import config from "../../utils/configUtils";

import express from "express";
const router = express.Router();

import auth from "../auth";

import Users from "../../models/Users";

const baseUrl = config.get("oldServerUrl");

function checkAuth(req: any, res: any, authSucceed: any) {
    const { payload: { id } } = req;

    return Users.findById(id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(400);
      }

      return authSucceed();
    });
}

router.use( auth.required, (req, res, next) => {
    checkAuth(req, res, next);
});

router.get("/\*", auth.required, (req, res, next) => {
    axios.get(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path)
    .then((response) => {
        return res.json(response.data);
    })
    .catch((error) => {
        // tslint:disable-next-line:no-console
        console.log( error );
        return res.status(500).json(error);
    });
});

router.post("/\*", auth.required, (req, res, next) => {
    axios.post(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path, req.body)
    .then((response) => {
        return res.json(response.data);
    })
    .catch((error) => {
        // tslint:disable-next-line:no-console
        console.log( error );
        return res.status(500).json(error);
    });
});

router.delete("/tasks/\*", auth.required, (req, res, next) => {
    axios.delete(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path)
    .then((response) => {
        return res.json(response.data);
    })
    .catch((error) => {
        // tslint:disable-next-line:no-console
        console.log( error );
        return res.status(500).json(error);
    });
});

export default router;
