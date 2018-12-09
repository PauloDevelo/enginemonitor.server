const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/enginemaintenance', require('./enginemaintenance'));

module.exports = router;
