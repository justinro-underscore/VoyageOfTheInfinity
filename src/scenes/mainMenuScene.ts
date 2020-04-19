import "phaser";
import { TerminalInputHandler } from "../handler/terminalInputHandler";
import { MapHandler } from "../handler/mapHandler";
import { EventHandler } from "../handler/eventHandler";

/**
 * Defines the initial scene that users see when they start the game
 */
export class MainMenuScene extends Phaser.Scene {
  title: Phaser.GameObjects.Text; // Text which holds the title of the game
  terminalText: Phaser.GameObjects.Text; // Text that shows various information

  constructor() {
    super({
      key: "MainMenuScene"
    });
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /************
     * Add text *
     ************/
    this.title = this.add.text(15, 15, "Voyage of the Infinity",
      { font: "42px Monospace", fill: "#fbfbac" });
    this.terminalText = this.add.text(15, 15 + this.title.height + 5, "Created by Justin Roderman and Sean Poole\nType \"start\" to begin the game",
      { font: "24px Monospace", fill: "#fbfbac" });

    /*********************
     * Add terminal input *
     *********************/
    TerminalInputHandler.instantiateTerminalInput(this, MainMenuScene.onEnter, { fontSize: 24 });
  }

  private static onEnter(inputStr: string, scene: Phaser.Scene) {
    if (inputStr === "start") {
      // Set up the game
      MapHandler.instantiateInstance("testing");
      EventHandler.instantiateEventMap("testing");
      // Start the game
      scene.scene.start("TerminalScene");
    }
  }
}
