import "phaser";
import { MainMenuScene } from './scenes/mainMenuScene';
import { TerminalScene } from './scenes/terminalScene';

const config: Phaser.Types.Core.GameConfig = {
  title: "Voyage of the Infinity",
  width: 800,
  height: 600,
  parent: "game",
  scene: [TerminalScene, MainMenuScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  backgroundColor: "#18216D"
};

export class TextAdventureGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new TextAdventureGame(config);
};
