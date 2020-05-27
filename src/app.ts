import "phaser";
import { StartGameScene } from "./scenes/startGameScene";
import { MainMenuScene } from "./scenes/mainMenuScene";
import { SettingsScene } from "./scenes/settingsScene";
import { CutsceneScene } from "./scenes/cutsceneScene";
import { TerminalScene } from "./scenes/terminalScene";
import { MapTerminalScene } from "./scenes/mapTerminalScene";
import { DebugMapScene } from "./scenes/debugMapScene";

const config: Phaser.Types.Core.GameConfig = {
  title: "Voyage of the Infinity",
  width: 800,
  height: 600,
  parent: "game",
  scene: [StartGameScene, MainMenuScene, SettingsScene, DebugMapScene, CutsceneScene, TerminalScene, MapTerminalScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  audio: {
    disableWebAudio: true
  },
  "transparent": true
};

export class TextAdventureGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  new TextAdventureGame(config);
};
