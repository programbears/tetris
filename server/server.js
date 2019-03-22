const logger = require('./lib/logger')();
const DEFAULT_ROUTER = 'v2';

const fs = require('fs');
const path = require('path');

const express = require('express');
const subdomain = require('express-subdomain');

logger('Starting server');
const app = express();

const port = process.env.PORT || 4000;
const env = process.env.NODE_ENV;
if (env === 'production')
    app.set('url', 'progbears.herokuapp.com');
else
    app.set('url', `app.localhost:${port}`);

const subdomainRouter = new express.Router();
fs.readdirSync(path.join(__dirname, './routers')).forEach((file) => {
    const router = path.basename(file, '.js');
    subdomainRouter.use(subdomain(router, require(`./routers/${file}`)));
    logger(`Initialized router: ${router}`);
});

if (app.get('url').split('.').length > 2) {
    let rootSubdomain = app.get('url').split('.').slice(0, -2).join('.');
    logger(`root subdomain: ${rootSubdomain}`);
    app.use(subdomain(rootSubdomain, subdomainRouter));
} else {
    app.use(subdomainRouter);
}

app.use('*', function(req, res) {
    logger(`${req.method} ${req.url} redirect http://${DEFAULT_ROUTER}.${app.get('url')}`);
    res.redirect(`http://${DEFAULT_ROUTER}.${app.get('url')}`);
});

app.listen(port, function() {
    logger(`server started successfully, listening on port ${port}`);
});
