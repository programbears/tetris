const express = require('express');
const logger = require('../lib/logger')('v2');
const { serveStatic } = require('../lib/utils');

const path = require('path');

const router = new express.Router();

serveStatic(router, path.join(__dirname, '../../v2'), { logger });

router.get('*', function(req, res) {
    logger(`GET ${req.url} - index.html`);
    res.sendFile(path.join(__dirname, '../../v2/index.html'));
});

module.exports = router;
