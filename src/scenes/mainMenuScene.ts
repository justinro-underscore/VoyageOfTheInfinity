import "phaser";
import { TerminalInputScene, SuggestionObj } from "./abstractscenes/terminalInputScene";
import { MapHandler } from "../handler/mapHandler";
import { EventHandler } from "../handler/eventHandler";
import { ShaderHandler } from "../handler/shaderHandler";
import { AudioHandler } from "../handler/audioHandler";
import { SettingsHandler } from "../handler/settingsHandler";
import { TextCutsceneHandler } from "../handler/textCutsceneHandler";

/**
 * Defines the initial scene that users see when they start the game
 */
export class MainMenuScene extends TerminalInputScene {
  suggestions: SuggestionObj; // Suggestions for the main menu

  initData: {instantiate: boolean}; // Defines the data sent in from the scene that started this scene

  title: Phaser.GameObjects.Text; // Text which holds the title of the game
  terminalText: Phaser.GameObjects.Text; // Text that shows various information

  /**
   * Determines if we should intialize all of the variables again or not
   * Only initialize variables if this is the first time we start the scene
   * @param data The data containing if we should instantiate or not
   */
  init(data: any) {
    if (Object.keys(data).length > 0) {
      this.initData = <{instantiate: boolean}>data;
    }
    else {
      this.initData = {instantiate: true};
    }
  }

  constructor() {
    super("MainMenuScene");
  }

  /**
   * Load all audio
   */
  preload() {
    if (this.initData.instantiate) {
      AudioHandler.loadAudio(this);
    }
    this.load.image("blackTerminalScreen", "assets/img/black-terminal-screen.png");
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /**************************************************
     * Set up shaders, audio, settings, and cutscenes *
     **************************************************/
    if (this.initData.instantiate) {
      ShaderHandler.instantiateShaders(this.game);
      AudioHandler.instantiateAudio(this.game);
      SettingsHandler.instantiateSettings();
      TextCutsceneHandler.processCutscenes();
    }

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
      { font: "42px Monospace", fill: "#dddddd" });
    this.terminalText = this.add.text(15, 15 + this.title.height + 5, "Created by Justin Roderman and Sean Poole\nType \"start\" to begin the game\nType \"settings\" to adjust game settings",
      { font: "24px Monospace", fill: "#dddddd" });

    /*********************
     * Add terminal input *
     *********************/
    this.suggestions = new Map(Object.entries({
      "start": null,
      "settings": null
    }));
    super.createTerminalInput({ fontSize: 24 });

    /**************
     * Add shader *
     **************/
    ShaderHandler.setRenderToShaders(this, "terminal");

    /************************
     * Add background music *
     ************************/
    if (this.initData.instantiate) {
      AudioHandler.playMusic("mainTheme");
    }
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
      let startingMap = "voyage";
      MapHandler.instantiateInstance(startingMap);
      EventHandler.instantiateEventMap(startingMap);
      // Start the game
      this.scene.start("TerminalScene");
      // this.scene.start("CutsceneScene", {cutsceneKey: "testing", toScene: "TerminalScene"});
    }
    else if (inputStr === "settings") {
      this.scene.start("SettingsScene");
    }
  }
}
