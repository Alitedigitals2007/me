const express = require('express');

const router = express.Router();

router.use('/', require('../admin-index'));
router.use('/', require('../admin-content'));
router.use('/blog', require('../admin-blog'));
router.use('/ads', require('../admin-ads'));
router.use('/marketplace', require('../admin-marketplace'));

module.exports = router;
