import { Game } from './game/Game.js'

const container = document.getElementById('game-container')
const game = new Game(container)
game.init()
game.startGame()
