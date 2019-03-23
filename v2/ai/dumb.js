/*
 * functions to handle logging, giving the ai a unique identifier so the logs make sense
 */

const NAME = 'DumbAI';
const VERSION = { maj: 1, min: 0, pat: 0 };

const uid = crypto.getRandomValues(new Uint32Array(1))[0];
self.console.log(`[${NAME}] starting with id ${uid}`);
const identifier = NAME+':'+uid;

function debug(...args) {
    self.console.log(`[${identifier}]`, ...args);
}
function warn(...args) {
    self.console.warn(`[${identifier}]`, ...args);
}
function error(...args) {
    self.console.error(`[${identifier}]`, ...args);
}

/*
 * actual ai logic
 */

const possibleInputs = [
    { type: 'input', input: 'LEFT' },
    { type: 'input', input: 'RIGHT' },
    { type: 'input', input: 'DOWN' },
    { type: 'input', input: 'ROTATE' },
];
// send a random input 50% of the time
function handleFrame(frame) {
    if (Math.random() < 0.5) {
        let input = possibleInputs[Math.floor(Math.random() * possibleInputs.length)];
        debug('sending input:', input.input);
        postMessage(input);
    }
}

// handle receiving data from the main thread
onmessage = function(msg) {
    if (msg.data.type === 'frame') {
        // debug('frame received');
        handleFrame(msg.data.frame);
    } else if (msg.data.type === 'score') {
        debug(`yay i scored ${msg.data.change} points!`);
        debug(`my current score is ${msg.data.current}`);
    } else if (msg.data.type === 'level') {
        debug(`i leveled up! currently at level ${msg.data.current}`);
        debug(`next level will be when i pass a score of ${msg.data.next}`);
    } else if (msg.data.type === 'gameover') {
        debug('game over');
    } else if (!msg.data.type) {
        error(`Received message with no type: ${msg.data}`);
    } else {
        warn(`Unhandled worker message type: ${msg.data.type}`);
    }
};

debug(`started successfully (v${Object.values(VERSION).join('.')})`);
