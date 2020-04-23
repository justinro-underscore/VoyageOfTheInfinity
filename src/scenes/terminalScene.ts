import "phaser";
import { TerminalInputScene, SuggestionObj } from "./abstractscenes/terminalInputScene";
import { InputHandler, InputResponseType } from "../handler/inputHandler";
import { MapHandler } from "../handler/mapHandler";
import { ShaderHandler } from "../handler/shaderHandler";

// Coefficient that determines how fast a scroll moves
const SCROLL_COEF = 10;

// How many pixels wide the scroll bar is
const SCROLL_BAR_WIDTH = 5;

// How many lines of text the terminal can take
const MAX_NUM_TERMINAL_LINES = 90; // Equivalent to about 3 lengths of terminal height (each one being 29 lines)

/**
 * Defines the scene where user can input commands through a terminal interface
 */
export class TerminalScene extends TerminalInputScene {
  suggestions: SuggestionObj; // Suggestions for the terminal

  initData: {terminalData: string}; // Defines the data sent in from the scene that started this scene

  private static TERMINAL_HEIGHT: number; // Const that defines the height of the terminal screen
  terminalScreen: Phaser.GameObjects.Text; // Text that is shown to the user, holds all previous inputs and their responses
  scrollBar: Phaser.GameObjects.Image; // Scroll bar on the right side of the scene that keeps track of where the user has scrolled to

  shaders: Map<string, Phaser.Renderer.WebGL.WebGLPipeline>; // Defines what shaders are active right now
  lineShaderTint: number;

  constructor() {
    super("TerminalScene");
  }

  /**
   * Sets the terminal screen to whatever it was before
   * @param data The terminal data containing previous inputs
   */
  init(data: any) {
    if (Object.keys(data).length > 0) {
      this.initData = <{terminalData: string}>data;
    }
    else {
      this.initData = null;
    }
  }

  /**
   * Load images
   */
  preload() {
    this.load.image("scrollBar", "assets/img/white-pixel.png");
    this.load.image("terminalScreen", "assets/img/terminal-screen.png");
  }

  /**
   * Set up all game elements that are shown to the user
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    /******************************
     * Set up the terminal screen *
     ******************************/
    this.terminalScreen = this.add.text(10, 10, MapHandler.getCurrRoomInfo(true), {
      font: "16px Monospace",
      align: "left",
      fill: "#77ff55",
      wordWrap: { width: this.cameras.main.width - 20, useAdvancedWrap: false }
    });

    /***********************************************
     * Set up the scroll bar and its functionality *
     ***********************************************/
    this.scrollBar = this.add.image(this.cameras.main.width - SCROLL_BAR_WIDTH, 0, "scrollBar").setInteractive();
    this.scrollBar.setOrigin(0, 0);
    this.scrollBar.setTint(0x77ff55); // Should be the color of the text
    this.scrollBar.setDisplaySize(SCROLL_BAR_WIDTH, 0);

    // Set up draggable functionality
    this.scrollBar.on("pointerover", () => this.scrollBar.setTint(0xfdfdcd));
    this.scrollBar.on("pointerout", () => this.scrollBar.setTint(0x77ff55));
    this.input.setDraggable(this.scrollBar);
    this.input.on("drag", (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _x: number, y: number) => {
      this.moveScrollBar(y);
    });
    // When the user scrolls their scrollwheel, move the screen & scroll bar
    this.input.on("wheel", (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _deltaX: number, deltaY: number) => {
      const scrollDelta = deltaY * SCROLL_COEF;
      this.scrollTerminalScreenTo(this.terminalScreen.y - scrollDelta);
      this.updateScrollBarPosition();
    });
    this.scrollBar.setVisible(false); // Start out invisible

    /*********************************
     * Set up the command line input *
     *********************************/
    this.suggestions = InputHandler.getSuggestions();
    super.createTerminalInput({ primaryFontColor: "#77ff55" });

    /********************************************************
     * Set the terminal height based on command line height *
     ********************************************************/
    TerminalScene.TERMINAL_HEIGHT = this.cameras.main.height - (this.COMMAND_LINE_HEIGHT + 2 * TerminalInputScene.COMMAND_LINE_OFFSET);

    /*****************************************************
     * Set the terminal screen to whatever it was before *
     *****************************************************/
    if (this.initData != null) {
      this.updateTerminalScreen(this.initData.terminalData, true);
    }

    /******************
     * Set up shaders *
     ******************/
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

  /**
   * Defines what happens when the user presses enter on the keyboard
   * @param inputStr The string that is currently in the input of the command line
   */
  protected onEnterFunc(inputStr: string) {
    // Submit input
    let response = InputHandler.submitInput(inputStr);
    if (response.type === InputResponseType.STRING || response.type === InputResponseType.ERROR) {
      if (response.command === "go") { // If we have moved rooms, update the suggestions
        this.suggestions = InputHandler.getSuggestions();
      }

      // Update the terminal screen
      this.updateTerminalScreen(`\n\n> ${ inputStr }\n${ response.stringData }`);

      this.resetInput();
    }
    else if (response.type === InputResponseType.SCENE_CHANGE) {
      this.updateTerminalScreen(`\n\n> ${ inputStr }`);
      this.scene.start(response.sceneChangeData, {terminalData: this.terminalScreen.text});
    }

    // Check if terminal screen overflows allotted text amount
    let textArr = this.terminalScreen.text.split("\n");
    if (textArr.length > MAX_NUM_TERMINAL_LINES) { // If there are too many lines, trim it
      this.updateTerminalScreen(textArr.slice(textArr.length - MAX_NUM_TERMINAL_LINES).join("\n"), true);
    }
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Writes data to the terminal screen and updates it accordingly
   * @param data The strings to be added at the end of the terminal screen
   * @param overwrite If true, overwrite the terminal screen text with the data text
   */
  private updateTerminalScreen(data: string, overwrite=false) {
    if (overwrite) {
      this.terminalScreen.text = data;
    }
    else {
      this.terminalScreen.text += data;
    }
    this.scrollTerminalScreenTo(TerminalScene.TERMINAL_HEIGHT - this.terminalScreen.height); // Move the terminal screen to the bottom
    this.updateScrollBarSize(); // Update the scroll bar
  }

  /**
   * Moves the terminal screen to a specified location (used for scrolling)
   * @param newY The new Y-value the terminal screen should move to
   */
  private scrollTerminalScreenTo(newY: number) {
    if (this.terminalScreen.height > TerminalScene.TERMINAL_HEIGHT) {
      this.terminalScreen.y = newY;
      this.terminalScreen.y = Phaser.Math.Clamp(this.terminalScreen.y, TerminalScene.TERMINAL_HEIGHT - this.terminalScreen.height, 10);
      // Masking gets screwed up with the shaders, so we add a crop instead
      this.terminalScreen.setCrop(0, -this.terminalScreen.y, this.cameras.main.width, TerminalScene.TERMINAL_HEIGHT - (this.terminalScreen.y > 0 ? this.terminalScreen.y : 0));
    }
  }

  /**
   * Moves the scroll bar to a new position
   * NOTE: will also scroll the terminal screen to a new location
   * @param newY The new Y-value the scroll bar should move to
   */
  private moveScrollBar(newY: number) {
    this.scrollBar.y = newY;
    this.scrollBar.y = Phaser.Math.Clamp(this.scrollBar.y, 0, TerminalScene.TERMINAL_HEIGHT - this.scrollBar.displayHeight);

    // Calculate where the terminal screen should move to
    const [m, b] = this.getMB();
    const newTerminalScreenY = (this.scrollBar.y - b) / m;
    this.scrollTerminalScreenTo(newTerminalScreenY);
  }

  /**
   * Updates the scroll bar size depending on the size of the terminal screen
   * Will always be called when a new input is registered
   */
  private updateScrollBarSize() {
    // Only change the size if the terminal screen height has surpassed its masking
    if (this.terminalScreen.height > TerminalScene.TERMINAL_HEIGHT) {
      this.scrollBar.setVisible(true);
      // Set the height with HELLA maths (see notebook for description of how I got this)
      let scrollBarHeight = (TerminalScene.TERMINAL_HEIGHT * TerminalScene.TERMINAL_HEIGHT) / this.terminalScreen.height;
      scrollBarHeight = Phaser.Math.Clamp(scrollBarHeight, 3, TerminalScene.TERMINAL_HEIGHT); // Height should never be less than 3 pixels (but we shouldn't really ever get there)
      this.scrollBar.setDisplaySize(SCROLL_BAR_WIDTH, scrollBarHeight);
      this.scrollBar.y = TerminalScene.TERMINAL_HEIGHT - scrollBarHeight; // Set scroll bar location to bottom of screen
    }
    else {
      this.scrollBar.setVisible(false); // Hide the scroll bar if we don't need it
    }
  }

  /**
   * Sets the scroll bar's position using the height of the terminal screen
   * TODO Replace this with @see moveScrollBar
   */
  private updateScrollBarPosition() {
    const [m, b] = this.getMB();
    const scrollBarPos = m * (this.terminalScreen.y) + b;
    this.scrollBar.y = scrollBarPos;
  }

  /**
   * Calculates the m & b values for the linear equation relating scroll bar location to terminal screen location
   * m & b refer to the variables in the equation `y = mx + b`
   * @returns [m value, b value]
   */
  private getMB(): [number, number] {
    // Calculate m & b with HELLA maths (see notebook for description of how I got this)
    const m = (TerminalScene.TERMINAL_HEIGHT - this.scrollBar.displayHeight) / (TerminalScene.TERMINAL_HEIGHT - this.terminalScreen.height - 10);
    const b = -10 * m;
    return [m, b];
  }
}
