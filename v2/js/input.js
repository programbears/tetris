class InputController {
    constructor(game) {
        this.game = game;
        game.emitter.addEventListener('frame', (data) => this.onFrame(data.detail));
    }
    onFrame(/* data */) { }
    onInput(input) {
        this.game.input(input);
    }
}

export class AIController extends InputController {
    constructor(game, path) {
        super(game);

        this.worker = new Worker(path);
        this.worker.onMessage(this.receive);
    }
    onFrame(frame) {
        this.worker.postMessage({ type: 'frame', data: frame });
    }
    receive(message) {
        this.game.input(/*...*/);
    }
}
export class HumanController extends InputController {
    constructor(game) {
        super(game);

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
            case 'ArrowLeft':
                this.onInput('LEFT');
                break;
            case 'ArrowRight':
                this.onInput('RIGHT');
                break;
            case 'ArrowDown':
                this.onInput('DOWN');
                break;
            case 'ArrowUp':
            case ' ':
                this.onInput('ROTATE');
            }
        });
    }
    onFrame(data) {
        // console.log('frame'); // eslint-disable-line
        // data.frame.forEach((col, idx) => {
        //     console.log(idx, JSON.stringify(col)); // eslint-disable-line
        // });
    }
}
