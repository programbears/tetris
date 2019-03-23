/* global AVAILABLE_AI */

import { GameController } from './js/game.js';
import { AIController, HumanController } from './js/input.js';

const arcade = document.getElementById('arcade');
let tetrisCounter = 0;
let tetrisHighscore = { value: 0, player: null };
class Tetris {
    constructor() {
        this.$el = document.createElement('div');
        this.$el.classList.add('game');

        this.$el.append(this.createScoreboard());
        this.$el.classList.add(`tetris-${++tetrisCounter}`);

        this.$canvas = document.createElement('canvas');
        this.$canvas.id = `game-${++tetrisCounter}`;
        this.$el.append(this.$canvas);

        this.showButtons();

        this.$stats = document.getElementsByClassName('arcade-game tetris')[0];
        this.$highScore = this.$stats.getElementsByClassName('high-score value')[0];
        this.$bestPlayer = this.$stats.getElementsByClassName('best-player value')[0];

        this.gameController = new GameController(this.$canvas, { scoreElement: this.$score });
        this.gameController.emitter.addEventListener('score', (data) => {
            this.$score.textContent = data.detail.current;
            if (data.detail.current > tetrisHighscore.value) {
                this.$highScore.textContent = data.detail.current;
                this.$bestPlayer.textContent = this.inputMethod;
            }
        });
        this.gameController.emitter.addEventListener('gameover', () => {
            this.showButtons(true);
        });
    }
    createScoreboard() {
        if (this.$scoreboard) return this.$scoreboard;

        this.$scoreboard = document.createElement('div');
        this.$scoreboard.classList.add('scoreboard');

        this.$input = document.createElement('select');
        this.$input.append(new Option('Human', ''));
        AVAILABLE_AI.forEach((ai) => {
            this.$input.append(new Option(ai));
        });
        this.$scoreboard.append(this.$input);

        const $start = document.createElement('button');
        $start.textContent = 'Start Game';
        $start.addEventListener('click', this.startGame.bind(this));
        this.$scoreboard.append($start);

        this.$score = document.createElement('span');
        this.$score.textContent = 0;
        this.$scoreboard.append(this.$score);

        this.$nextPiece = document.createElement('canvas');
        this.$nextPiece.classList.add('next');
        this.$scoreboard.append(this.$nextPiece);

        return this.$scoreboard;
    }
    showButtons(show = true) {
        this.$scoreboard.classList.toggle('in-game', !show);
    }
    startGame() {
        this.setInputMethod(this.$input.value || false);
        this.showButtons(false);
        this.gameController.start();
    }
    setInputMethod(ai = false) {
        this.inputMethod = ai || 'Human';
        this.inputController =  ai ?
            new AIController(this.gameController, ai) :
            new HumanController(this.gameController);
    }
}

function onClickNewGame() {
    const game = new Tetris();

    arcade.append(game.$el);
}
document.getElementById('add-tetris')
    .addEventListener('click', onClickNewGame);
