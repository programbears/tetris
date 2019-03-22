const fs = require('fs');
const path = require('path');

function serveStatic(router, directory, { recursive = true, logger, root } = {}) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((file) => {
        const filepath = path.join(directory, file.name);
        const url = `/${root ? path.join(root, file.name) : file.name}`;
        logger(`serving ${url} as static ${filepath}`);
        if (file.isFile()) {
            router.get(url, function(req, res) {
                if (logger) logger(`GET ${file.name} static`);
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
