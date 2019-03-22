module.exports = function(...context) {
    const timestamp = `\x1b[90m[${(new Date()).toISOString()}]\x1b[0m`;

    return function(...args) {
        process.stdout.write([
            timestamp,
            ...context.map((ctx) => `[${ctx}]`),
            ...args,
            '\n',
        ].join(' '));
    };
};

