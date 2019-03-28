const axios = require('axios');
const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

var mode = 'dev'; //prod or demo
var baseUrl = "http://localhost:8081";
if(mode === 'prod'){
	baseUrl = "http://arbutuspi:8080";
}
else if(mode === 'demo'){
	baseUrl = "http://192.168.0.50:8080";
}

function checkAuth(req, res, authSucceed){
    const { payload: { id } } = req;

    return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return authSucceed();
    });
}

router.use( auth.required, (req, res, next) => {
    checkAuth(req, res, next);
})

router.get('/\*', auth.required, (req, res, next) =>{
    axios.get(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path)
    .then(response => {
        return res.json(response.data);
    })	
    .catch(error => {
        console.log( error );
        return res.status(500).json(error);
    });
});

router.post('/\*', auth.required, (req, res, next) => {
    axios.post(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path, req.body)
    .then(response => {
        return res.json(response.data);
    })	
    .catch(error => {
        console.log( error );
        return res.status(500).json(error);
    });
});

router.delete('/tasks/\*', auth.required, (req, res, next) => {
    axios.delete(baseUrl + "/engine-monitor/webapi/enginemaintenance" + req.path)
    .then(response => {
        return res.json(response.data);
    })	
    .catch(error => {
        console.log( error );
        return res.status(500).json(error);
    });
});

module.exports = router;