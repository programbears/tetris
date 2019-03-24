/*
 * functions to handle logging, giving the ai a unique identifier so the logs make sense
 */

const NAME = 'BasicAI';
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

function isGameover(board) {
    return board.some((col) => col[0] === 1) ? 1 : 0;
}
function getIsolatedSquares(board) {
    return board.map((col) => {
        const highestSquare = col.findIndex((sq) => sq === 1);
        if (highestSquare === -1) return []; // no filled squares in this col

        return col.filter((sq, y) => {
            return sq === 0 && y > highestSquare;
        });
    }).flat().length;
}
function getSurfaceGradient(board) {
    const surface = board.map((col) => {
        const highestSquare = Math.min(...col.map((sq, y) => y).filter(y => col[y] === 1));
        if (highestSquare === Infinity) return col.length;

        return highestSquare;
    });
    return Math.max(...surface) - Math.min(...surface);
}
function compareOutcomes(a, b) {
    // if isgameover(b)===1 and isgameover(a)===0, then returns -1 as a is better
    return isGameover(a) - isGameover(b)
    // less isolated squares is better
        || getIsolatedSquares(a) - getIsolatedSquares(b)
    // lower surface gradient is better
        || getSurfaceGradient(a) - getSurfaceGradient(b);
}

function getRotatedSquare(square, centre) {
    let rotationVector = square.map((v, ax) => v - centre[ax]);
    let vector = [rotationVector[1], -rotationVector[0]];
    return square.map((v, ax) => centre[ax] + vector[ax]);
}
let currentState = 0; // 0 - nothing done, 1 - rotating, 2 - moving, 3 - happy
let currentTarget = null;
let scored = false;
function handleFrame(frame) {
    const activeSquares = frame.map((col, x) => {
        return col.map((sq, y) => [x, y]);
    }).flat().filter((sq) => {
        return frame[sq[0]][sq[1]] === 2;
    });

    const currentShapeCol = Math.min(...activeSquares.map((sq) => sq[0]));
    const currentShapeRow = Math.min(...activeSquares.map((sq) => sq[1]));
    const currentShape = activeSquares.map((sq) => {
        return [sq[0] - currentShapeCol, sq[1] - currentShapeRow];
    });

    const currentShapeRotations = Array.from(new Array(4), (_, rotations) => {
        let shape = currentShape;
        while (rotations-- > 0) {
            shape = shape.map(sq => getRotatedSquare(sq, shape[0]));
        }
        const shapeCol = Math.min(...shape.map((sq) => sq[0]));
        const shapeRow = Math.min(...shape.map((sq) => sq[1]));
        return shape.map((sq) => [sq[0] - shapeCol, sq[1] - shapeRow]);
    });

    const bestRotationOutcomes = currentShapeRotations.map((rotatedShape) => {
        // get what board would look like with shape in each column
        const possibleOutcomes = (new Array(frame.length))
            // remove currentshape from board
            .fill(frame.map((col) => {
                return col.map(sq => {
                    return sq === 2 ? 0 : sq;
                });
            }))
            // add currentshape to filledsquares if it was dropped in targetcol
            .map((board, targetCol) => {
                const currentShapeInTargetCol = rotatedShape.map((sq) => {
                    return [sq[0] + targetCol, sq[1]];
                });
                const colIsPossibleByWidth = currentShapeInTargetCol.every((sq) => {
                    return sq[0] < frame.length && sq[0] >= 0;
                });
                // if targetcol isn't a possible choice, return entire board filled (worst possible outcome) to avoid picking
                if (!colIsPossibleByWidth) return board.map((col) => col.map(() => 1));

                let droppedCurrentShape = currentShapeInTargetCol;
                while (droppedCurrentShape.every((sq) => board[sq[0]][sq[1]+1] === 0)) {
                    droppedCurrentShape = droppedCurrentShape.map((sq) => [sq[0], sq[1]+1]);
                }
                const colIsPossibleByHeight = droppedCurrentShape.every((sq) => {
                    return sq[1] > 0; // don't include 0, as is a loss
                });
                if (!colIsPossibleByHeight) return board.map((col) => col.map(() => 1));

                const ret = board.map((col, x) => {
                    if (!droppedCurrentShape.some(sq => sq[0] === x)) return col;

                    return col.map((square, y) => {
                        if (square === 1) return 1;

                        const dropped = droppedCurrentShape.some((sq) => {
                            return sq[0] === x && sq[1] === y;
                        });
                        if (dropped) return 1;

                        return 0;
                    });
                });
                return ret;
            });

        const sortedOutcomes = [...possibleOutcomes].sort(compareOutcomes);
        const bestColumn = possibleOutcomes.indexOf(sortedOutcomes[0]);
        return { column: bestColumn, outcome: possibleOutcomes[bestColumn] };
    });
    const sortedRotations = bestRotationOutcomes.map((best) => best.outcome).sort(compareOutcomes);
    const bestRotation = bestRotationOutcomes.map((best) => best.outcome).indexOf(sortedRotations[0]);
    const target = bestRotationOutcomes[bestRotation];

    if (currentState === 0 && currentTarget !== null && scored === false) {
        const previousTargetAchieved = frame.every((col, x) => col.every((square, y) => {
            return square === 2 ? currentTarget[x][y] === 0 : currentTarget[x][y] === square;
        }));
        debug('previous target achieved:', previousTargetAchieved);
        if (!previousTargetAchieved) {
            debug('expected:', currentTarget);
            debug('actual:', frame);
            // postMessage({ type: 'input', input: 'PAUSE' });
        }
    }
    currentTarget = target.outcome;
    scored = false;

    if (bestRotation !== 0) {
        if (currentState !== 1) {
            debug(`currently rotating ${bestRotation} times`);
            debug(`targeting ${getSurfaceGradient(target.outcome)} surface gradient, ${getIsolatedSquares(target.outcome)} isolated squares`);
            currentState = 1;
        }
        postMessage({ type: 'input', input: 'ROTATE' });
    } else if (target.column < currentShapeCol) {
        if (currentState !== 2) {
            debug(`currently moving to column ${target.column}`);
            debug(`targeting ${getSurfaceGradient(target.outcome)} surface gradient, ${getIsolatedSquares(target.outcome)} isolated squares`);
            currentState = 2;
        }
        postMessage({ type: 'input', input: 'LEFT' });
    } else if (target.column > currentShapeCol) {
        if (currentState !== 2) {
            debug(`currently moving to column ${target.column}`);
            debug(`targeting ${getSurfaceGradient(target.outcome)} surface gradient, ${getIsolatedSquares(target.outcome)} isolated squares`);
            currentState = 2;
        }
        postMessage({ type: 'input', input: 'RIGHT' });
    } else {
        if (currentState !== 3) {
            debug('currently happy!');
            debug(`targeting ${getSurfaceGradient(target.outcome)} surface gradient, ${getIsolatedSquares(target.outcome)} isolated squares`);
            currentState = 3;
        }
        postMessage({ type: 'input', input: 'DOWN' });
    }
}

// handle receiving data from the main thread
onmessage = function(msg) {
    if (msg.data.type === 'frame') {
        handleFrame(msg.data.frame);
    } else if (msg.data.type === 'newshape') {
        debug('new shape! exciting!');
        currentState = 0;
    } else if (msg.data.type === 'score') {
        debug(`yay i scored ${msg.data.change} points!`);
        scored = true;
    } else if (msg.data.type === 'level') {
        debug(`i leveled up! currently at level ${msg.data.current}`);
    } else if (msg.data.type === 'gameover') {
        debug('oh no i lost');
    } else if (!msg.data.type) {
        error(`Received message with no type: ${msg.data}`);
    } else {
        warn(`Unhandled worker message type: ${msg.data.type}`);
    }
};

debug(`started successfully (v${Object.values(VERSION).join('.')})`);
