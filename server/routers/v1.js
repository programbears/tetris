const express = require('express');
const logger = require('../lib/logger')('v1');
const { serveStatic } = require('../lib/utils');

const path = require('path');

const router = new express.Router();

serveStatic(router, path.join(__dirname, '../../v1'), { logger });
router.get('*', function(req, res) {
    logger(`GET ${req.url} - tetris.html`);
    res.sendFile(path.join(__dirname, '../../v1/tetris.html'));
});

module.exports = router;
