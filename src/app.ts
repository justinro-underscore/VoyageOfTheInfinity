import "phaser";
import { MainMenuScene } from "./scenes/mainMenuScene";
import { CutsceneScene } from "./scenes/cutsceneScene";
import { TerminalScene } from "./scenes/terminalScene";
import { MapTerminalScene } from "./scenes/mapTerminalScene";
import { DebugMapScene } from "./scenes/debugMapScene";

const config: Phaser.Types.Core.GameConfig = {
  title: "Voyage of the Infinity",
  width: 800,
  height: 600,
  parent: "game",
  scene: [MainMenuScene, DebugMapScene, CutsceneScene, TerminalScene, MapTerminalScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  audio: {
    disableWebAudio: true
  },
  backgroundColor: "#111111"
};

export class TextAdventureGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  new TextAdventureGame(config);
};
