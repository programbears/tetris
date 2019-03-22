const logger = require('./lib/logger')();
const DEFAULT_ROUTER = 'v2';

const fs = require('fs');
const path = require('path');

const express = require('express');
const subdomain = require('express-subdomain');

logger('starting server');
const app = express();

const port = process.env.PORT || 4000;
const env = process.env.NODE_ENV;
if (env === 'production')
    app.set('url', 'progbears.herokuapp.com');
else
    app.set('url', `app.localhost:${port}`);

const subdomainRouter = new express.Router();
fs.readdirSync(path.join(__dirname, './routers')).forEach((file) => {
    const routerName = path.basename(file, '.js');
    const router = require(`./routers/${file}`);
    if (process.env.USE_SUBDOMAINS) {
        subdomainRouter.use(subdomain(routerName, router));
        logger(`initiliazed router ${routerName} at ${routerName}.${app.get('url')}`);
    } else {
        subdomainRouter.use(`/${routerName}`, router);
        logger(`initialized router ${routerName} at ${app.get('url')}/${routerName}`);
    }
});

if (process.env.USE_SUBDOMAINS && app.get('url').split('.').length > 2) {
    let rootSubdomain = app.get('url').split('.').slice(0, -2).join('.');
    logger(`root subdomain: ${rootSubdomain}`);
    app.use(subdomain(rootSubdomain, subdomainRouter));
} else {
    app.use(subdomainRouter);
}

app.use('*', function(req, res) {
    const url = process.env.USE_SUBDOMAINS ? `http://${DEFAULT_ROUTER}.${app.get('url')}` : `http://${app.get('url')}/${DEFAULT_ROUTER}/`;
    logger(`${req.method} ${req.url} redirect ${url}`);
    res.redirect(url);
});

app.listen(port, function() {
    logger(`server started successfully, listening on port ${port}`);
});
