let shapeCounter = 0;
export class GenericShape {
    constructor(squares, { color, position = [0, 0] } = {}) {
        this._squares = squares;
        this.id = ++shapeCounter;

        this.color = color;

        this.x = position[0];
        this.y = position[1];
    }

    get position() {
        return [this.x, this.y];
    }
    getRotatedSquare(square, centre) {
        let rotationVector = square.map((v, ax) => v - centre[ax]);
        let vector = [rotationVector[1], -rotationVector[0]];
        return square.map((v, ax) => centre[ax] + vector[ax]);
    }
    getSquaresAtPosition(pos, orientation = this.orientation) {
        return this._squares.map((square) => {
            return [
                pos[0] + square[0],
                pos[1] + square[1],
            ];
        });
    }
    get squares() {
        return this.getSquaresAtPosition(this.position);
    }
    down(move = true) {
        if (!move) return this.getSquaresAtPosition([this.x, this.y+1]);

        this.y += 1;
        return this.squares;
    }
    left(move = true) {
        if (!move) return this.getSquaresAtPosition([this.x-1, this.y]);

        this.x -= 1;
        return this.squares;
    }
    right(move = true) {
        if (!move) return this.getSquaresAtPosition([this.x+1, this.y]);

        this.x += 1;
        return this.squares;
    }
    rotate(move = true) {
        if (!move) return this.squares.map((square, idx, squares) => {
            return this.getRotatedSquare(square, squares[0]);
        });

        this._squares = this._squares.map((square, idx, squares) => {
            return this.getRotatedSquare(square, squares[0]);
        });
        return this.squares;
    }
}

class Line extends GenericShape {
    constructor(opts) {
        super([[0,0], [1,0], [2,0], [3,0]], opts);
    }
}
class Tee extends GenericShape {
    constructor(opts) {
        super([[0,0], [1,0], [2,0], [1,1]], opts);
    }
}
class Square extends GenericShape {
    constructor(opts) {
        super([[0,0], [1,0], [0,1], [1,1]], opts);
    }
}
class Knob extends GenericShape {
    constructor(opts) {
        super([[0,0], [1,0], [2,0], [0,1]], opts);
    }
}
class bonK extends GenericShape {
    constructor(opts) {
        super([[0,1], [1,1], [2,1], [0,0]], opts);
    }
}
class ZigZag extends GenericShape {
    constructor(opts) {
        super([[0,0], [1,0], [1,1], [2,1]], opts);
    }
}
class ZagZig extends GenericShape {
    constructor(opts) {
        super([[0,1], [1,1], [1,0], [2,0]], opts);
    }
}
export const TetrisShapes = { Line, Tee, Square, Knob, bonK, ZigZag, ZagZig };
