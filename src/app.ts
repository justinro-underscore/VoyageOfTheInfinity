import "phaser";
import { MainMenuScene } from './scenes/mainMenuScene';
import { PrologueScene } from './scenes/prologueScene';
import { TerminalScene } from './scenes/terminalScene';

const config: Phaser.Types.Core.GameConfig = {
  title: "Voyage of the Infinity",
  width: 800,
  height: 600,
  parent: "game",
  scene: [MainMenuScene, PrologueScene, TerminalScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  dom: {
    createContainer: true
  },
  backgroundColor: "#111111"
};

export class TextAdventureGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new TextAdventureGame(config);
};
