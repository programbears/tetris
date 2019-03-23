import { GenericShape, TetrisShapes } from './shapes.js';

const COLOURS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#CD853F'];
const TICK_INTERVAL = 100;
export class GameController {
    constructor(canvas, { dimensions = [10, 20], level = 1 } = {}) {
        this.emitter = document.createElement('emitter');

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.dimensions = dimensions;
        this.initialLevel = level;

        this.reset();
    }

    get events() {
        return ['frame', 'score', 'level', 'gameover'];
    }

    incrementScore(n) {
        this.score += n;
        if (this.score > this.nextLevel) {
            this.level++;
            this.nextLevel += 100;
            this.emitter.dispatchEvent(new CustomEvent('level', {
                detail: { current: this.level, next: this.nextLevel },
            }));
        }
        this.emitter.dispatchEvent(new CustomEvent('score', {
            detail: { current: this.score, change: n },
        }));
    }

    spawnShape(shape) {
        let color = COLOURS[Math.floor(Math.random()*COLOURS.length)];
        let position = [Math.floor(this.dimensions[0] / 2), 0];
        if (shape instanceof GenericShape) {
            this.currentShape = new shape({ color, position });
        } else if (shape in TetrisShapes) {
            this.currentShape = new TetrisShapes[shape]({ color, position });
        } else {
            let shapeKey = Object.keys(TetrisShapes)[Math.floor(Math.random()*Object.keys(TetrisShapes).length)];
            this.currentShape = new TetrisShapes[shapeKey]({ color, position });
        }
    }
    resolveShapeState() {
        let currentShapeBottomed = this.currentShape.squares.some((square) => {
            return this.filledSquares.some((filledSquare) => {
                return square[0] === filledSquare[0]
                    && square[1] + 1 === filledSquare[1];
            });
        });
        if (currentShapeBottomed) {
            this.filledSquares.push(...this.currentShape.squares);
            this.spawnShape();
        }
    }
    resolveLinesState() {
        let lines = (new Array(this.dimensions[1])).fill(null)
            .map((val, y) => {
                return this.filledSquares.filter((square) => square[1] === y).length === this.dimensions[0] ?
                    y : val;
            })
            .filter((val) => val !== null);
        lines.forEach((line) => {
            this.filledSquares = this.filledSquares.filter((square) => square[1] !== line)
                .map((square) => {
                    return square[1] < line ? [square[0], square[1] + 1] : square;
                });
        });

        if (lines.length) this.incrementScore(lines.length === 4 ? 100 : lines.length * 20);
    }
    resolveGameState() {
        let gameOver = this.filledSquares.some((square) => square[1] === 0);

        if (gameOver) {
            clearInterval(this.clock);
            this.currentShape = null;
            this.emitter.dispatchEvent(new CustomEvent('gameover'));
        }
    }
    resolveState() {
        this.resolveShapeState();
        this.resolveLinesState();
        this.resolveGameState();
    }

    get frame() {
        return (new Array(this.dimensions[0]))
            .fill((new Array(this.dimensions[1])).fill(null))
            .map((arr, x) => arr.map((val, y) => {
                if (this.filledSquares.some((square) => square[0] === x && square[1] === y))
                    return 1;
                if (this.currentShape && this.currentShape.squares.some((square) => square[0] === x && square[1] === y))
                    return 2;
                return 0;
            }));
    }
    emitFrame() {
        this.emitter.dispatchEvent(new CustomEvent('frame', {
            detail: { frame: this.frame },
        }));
    }
    render() {
        if (this.isValidPosition(this.currentShape.down(false))) {
            this.currentShape.down();
        } else {
            this.resolveShapeState();
        }
        this.resolveLinesState();
        this.resolveGameState();
        this.emitFrame();
    }
    draw() {
        const width = this.canvas.scrollWidth;
        const height = this.canvas.scrollHeight;

        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;

        const boxWidth = width/this.dimensions[0];
        const boxHeight = height/this.dimensions[1];

        this.ctx.clearRect(0, 0, width, height);
        const drawSquare = (pos, col) => {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(pos[0]*boxWidth, pos[1]*boxHeight, boxWidth, boxHeight);
            this.ctx.fillStyle = col;
            this.ctx.fillRect(pos[0]*boxWidth + 2, pos[1]*boxHeight + 2, boxWidth - 4, boxHeight - 4);
        };
        this.filledSquares.forEach((square) => drawSquare(square, '#aaaaaa'));
        if (this.currentShape) this.currentShape.squares.forEach((square) => drawSquare(square, this.currentShape.color));
    }

    reset() {
        this.currentShape = null;
        // start with squares offscreen at bottom filled
        this.filledSquares =  (new Array(this.dimensions[0])).fill(null).map((val, x) => {
            return [x, this.dimensions[1]];
        });

        this.score = 0;
        this.level = this.initialLevel;
        this.nextLevel = 100;
        this.ticksUntilRender = 10;
    }
    tick() {
        this.ticksUntilRender -= this.level;
        if (this.ticksUntilRender <= 0) {
            this.render();
            this.ticksUntilRender = 10;
        }
        this.draw();
    }
    start() {
        this.reset();

        this.clock = setInterval(this.tick.bind(this), TICK_INTERVAL);
        this.spawnShape();
        this.tick();
    }

    isValidPosition(squares) {
        const isOffscreen = squares.some((square) => {
            return square[0] < 0 || square[0] >= this.dimensions[0];
        });
        const isFilled = squares.some((square) => {
            return this.filledSquares.some((filledSquare) => {
                return square[0] === filledSquare[0] &&
                    square[1] === filledSquare[1];
            });
        });
        return !isOffscreen && !isFilled;
    }

    input(action) {
        if (!this.currentShape) return;
        if (action === 'DOWN') {
            if (this.isValidPosition(this.currentShape.down(false)))
                this.currentShape.down();
            else
                this.resolveState();
        } else if (action === 'LEFT') {
            if (this.isValidPosition(this.currentShape.left(false)))
                this.currentShape.left();
        } else if (action === 'RIGHT') {
            if (this.isValidPosition(this.currentShape.right(false)))
                this.currentShape.right();
        } else if (action === 'ROTATE') {
            if (this.isValidPosition(this.currentShape.rotate(false)))
                this.currentShape.rotate();
        }
        this.emitFrame();
        this.draw();
    }
}
