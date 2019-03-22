const fs = require('fs');
const path = require('path');

function serveStatic(router, directory, { recursive = true, logger, root } = {}) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((file) => {
        const filepath = path.join(directory, file.name);
        const url = `/${root ? path.join(root, file.name) : file.name}`;
        if (file.isFile()) {
            logger(`serving ${url} as static ${filepath}`);
            router.get(url, function(req, res) {
                if (logger) logger(`GET ${req.originalUrl} static ${file.name}`);
                res.sendFile(filepath);
            });
        } else if (file.isDirectory() && recursive) {
            serveStatic(router, filepath, { recursive, logger, root: root ? path.join(root, file.name) : file.name });
        }
    });

}

module.exports = {
    serveStatic: serveStatic,
};
