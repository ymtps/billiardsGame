import { Game } from './game/Game.js'
import { StartScreen } from './ui/StartScreen.js'

const container = document.getElementById('game-container')
const game = new Game(container)
game.init()

const startScreen = new StartScreen()
startScreen.init()
startScreen.onSelect((mode) => {
  startScreen.hide()
  game.startGame(mode)
})
