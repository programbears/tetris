class InputController {
    constructor(game) {
        this.game = game;

        this.handlers = this.game.events.reduce((handlers, event) => {
            if (!this[`on${event}`]) {
                this[`on${event}`] = () => window['console']
                    .warn(`"${event}" event handler not implemented for InputController: ${this.constructor.name}`);
            }
            handlers[event] = (data) => this[`on${event}`](data.detail);
            this.game.emitter.addEventListener(event, handlers[event]);
            return handlers;
        }, {});
    }

    kill() {
        this.game.events.forEach((event) => {
            this.game.emitter.removeEventListener(event, this.handlers[event]);
        });
    }
}

export class AIController extends InputController {
    constructor(game, src) {
        super(game);

        this.worker = new Worker(`./ai/${src}`);
        this.worker.onmessage = this.receive.bind(this);
    }
    send(message) {
        this.worker.postMessage(message);
    }
    receive(message) {
        if (message.data.type === 'input') {
            this.game.input(message.data.input);
        } else {
            window['console'].warn('Unrecognised message received from AI worker:', message.data);
        }
    }

    onframe({ frame }) {
        this.send({ type: 'frame', frame });
    }
    onscore({ change, current }) {
        this.send({ type: 'score', change, current });
    }
    onlevel({ current, next }) {
        this.send({ type: 'level', current, next });
    }
    ongameover() {
        this.send({ type: 'gameover' });
        this.kill();
    }
}
export class HumanController extends InputController {
    constructor(game) {
        super(game);

        this.handler = this.keydownHandler.bind(this);
        document.addEventListener('keydown', this.handler);
    }

    keydownHandler(e) {
        switch (e.key) {
        case 'ArrowLeft':
            this.game.input('LEFT');
            break;
        case 'ArrowRight':
            this.game.input('RIGHT');
            break;
        case 'ArrowDown':
            this.game.input('DOWN');
            break;
        case 'ArrowUp':
        case ' ':
            this.game.input('ROTATE');
        }
    }

    onframe() {}
    onscore() {}
    onlevel() {}
    ongameover() {
        this.kill();
    }

    kill() {
        document.removeEventListener('keydown', this.handler);
        InputController.prototype.kill.call(this);
    }
}
