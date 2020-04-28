import "phaser";
import { TerminalInputScene, SuggestionObj } from "./abstractscenes/terminalInputScene";
import { MapHandler } from "../handler/mapHandler";
import { EventHandler } from "../handler/eventHandler";
import { ShaderHandler } from "../handler/shaderHandler";
import { AudioHandler } from "../handler/audioHandler";
import { TextCutsceneHandler } from "../handler/textCutsceneHandler";

/**
 * Defines the initial scene that users see when they start the game
 */
export class MainMenuScene extends TerminalInputScene {
  suggestions: SuggestionObj; // Suggestions for the main menu

  title: Phaser.GameObjects.Text; // Text which holds the title of the game
  terminalText: Phaser.GameObjects.Text; // Text that shows various information

  constructor() {
    super("MainMenuScene");
  }

  /**
   * Load all audio
   */
  preload() {
    AudioHandler.loadAudio(this);
    this.load.image("blackTerminalScreen", "assets/img/black-terminal-screen.png");
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /***************************************
     * Set up shaders, audio and cutscenes *
     ***************************************/
    ShaderHandler.instantiateShaders(this.game);
    AudioHandler.instantiateAudio(this.game);
    TextCutsceneHandler.processCutscenes();

    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "blackTerminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

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
    this.suggestions = new Map(Object.entries({
      "start": null
    }));
    super.createTerminalInput({ fontSize: 24 });

    /**************
     * Add shader *
     **************/
    ShaderHandler.setRenderToShaders(this, "terminal");
  }

  /**
   * Update the shaders
   * @param time The amount of time that has passed
   */
  update(time: number) {
    ShaderHandler.updateShaders(time);
  }

  /*************************
   *   PROTECTED METHODS   *
   *************************/

  protected onEnterFunc(inputStr: string) {
    if (inputStr === "start") {
      // Set up the game
      MapHandler.instantiateInstance("testing");
      EventHandler.instantiateEventMap("testing");
      // Start the game
      this.scene.start("TerminalScene");
      // this.scene.start("CutsceneScene", {cutsceneKey: "testing", toScene: "TerminalScene"});
    }
  }
}
