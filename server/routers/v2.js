const express = require('express');
const logger = require('../lib/logger')('v2');
const { serveStatic } = require('../lib/utils');

const fs = require('fs');
const path = require('path');

const router = new express.Router();

serveStatic(router, path.join(__dirname, '../../v2'), { logger, exclude: 'index.html' });
router.get('*', function(req, res, next) {
    logger(`GET ${req.url} - index.html`);
    // TODO parse just once on startup, directory/file contents won't change
    fs.readFile(path.join(__dirname, '../../v2/index.html'), { encoding: 'utf8' }, (err, file) => {
        if (err) {
            logger('Error reading index.html', err);
            res.status(500).send('Unexpected error');
        } else fs.readdir(path.join(__dirname, '../../v2/ai'), (err, ai) => {
            if (err) {
                logger('Error reading contents of /ai directory', err);
                res.status(500).send('Unexpected error');
            } else res.send(file.replace('{{ inject }}', `const AVAILABLE_AI = ${JSON.stringify(ai)}`));
        });
    });
});

module.exports = router;
