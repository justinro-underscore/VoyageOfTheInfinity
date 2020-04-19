import "phaser";
import { TerminalInputHandler, INPUT_HEIGHT } from "../handler/terminalInputHandler";
import { InputHandler, InputResponseType } from "../handler/inputHandler";
import { MapHandler } from "../handler/mapHandler";
// import { BlurPipeline } from "../shaders/blurPipeline";
// import { GrayscalePipeline } from "../shaders/grayscalePipeline";
// import { LinesPipeline } from "../shaders/linesPipeline";
// import { BulgePipeline } from "../shaders/bulgePipeline";
// import { TransparentPipeline } from "../shaders/transparentPipeline";

// Coefficient that determines how fast a scroll moves
const SCROLL_COEF = 10;

// How many pixels wide the scroll bar is
const SCROLL_BAR_WIDTH = 5;

// How many lines of text the terminal can take
const MAX_NUM_TERMINAL_LINES = 90; // Equivalent to about 3 lengths of terminal height (each one being 29 lines)

/**
 * Defines the scene where user can input commands through a terminal interface
 */
export class TerminalScene extends Phaser.Scene {
  initData: {terminalData: string}; // Defines the data sent in from the scene that started this scene

  private static TERMINAL_HEIGHT: number; // Const that defines the height of the terminal screen
  terminalScreen: Phaser.GameObjects.Text; // Text that is shown to the user, holds all previous inputs and their responses
  scrollBar: Phaser.GameObjects.Image; // Scroll bar on the right side of the scene that keeps track of where the user has scrolled to

  shaders: Map<string, Phaser.Renderer.WebGL.WebGLPipeline>;

  constructor() {
    super({
      key: "TerminalScene"
    });
  }

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
    const COMMAND_LINE_OFFSET = 10; // How much space between the terminal and the command line
    TerminalScene.TERMINAL_HEIGHT = this.cameras.main.height - (INPUT_HEIGHT + COMMAND_LINE_OFFSET);

    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    /******************************
     * Set up the terminal screen *
     ******************************/
    // Create a mask (so that the terminal screen does not reach the bottom of the screen which is reserved for user input)
    let graphics = this.make.graphics({});
    graphics.fillRect(0, 0, this.cameras.main.width, TerminalScene.TERMINAL_HEIGHT);
    let mask = new Phaser.Display.Masks.GeometryMask(this, graphics);

    this.terminalScreen = this.add.text(10, 10, MapHandler.getCurrRoomInfo(true), {
      font: "16px Monospace",
      align: "left",
      fill: "#77ff55",
      wordWrap: { width: this.cameras.main.width - 20, useAdvancedWrap: false }
    });
    this.terminalScreen.setMask(mask);

    /***********************************************
     * Set up the scroll bar and its functionality *
     ***********************************************/
    this.scrollBar = this.add.image(this.cameras.main.width - SCROLL_BAR_WIDTH, 0, "scrollBar").setInteractive();
    this.scrollBar.setOrigin(0, 0);
    this.scrollBar.setDisplaySize(SCROLL_BAR_WIDTH, TerminalScene.TERMINAL_HEIGHT); // Start out the full size of the terminal screen
    this.scrollBar.setTint(0x77ff55); // Should be the color of the text

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
    TerminalInputHandler.instantiateTerminalInput(this, TerminalScene.onEnter);

    if (this.initData != null) {
      this.updateTerminalScreen(this.initData.terminalData, true);
    }

    // this.shaders = new Map<string, Phaser.Renderer.WebGL.WebGLPipeline>();
    // this.shaders.set("Blur", (<Phaser.Renderer.WebGL.WebGLRenderer>this.game.renderer).addPipeline("Blur", new BlurPipeline(this.game)));
    // this.shaders.set("Grayscale", (<Phaser.Renderer.WebGL.WebGLRenderer>this.game.renderer).addPipeline("Grayscale", new GrayscalePipeline(this.game)));
    // this.shaders.set("Transparent", (<Phaser.Renderer.WebGL.WebGLRenderer>this.game.renderer).addPipeline("Transparent", new TransparentPipeline(this.game)));
    // this.shaders.set("Lines", (<Phaser.Renderer.WebGL.WebGLRenderer>this.game.renderer).addPipeline("Lines", new LinesPipeline(this.game)));
    // this.shaders.set("Bulge", (<Phaser.Renderer.WebGL.WebGLRenderer>this.game.renderer).addPipeline("Bulge", new BulgePipeline(this.game)));

    // this.shaders.forEach(shader => {
    //   shader.setFloat2("resolution", <number>this.game.config.width, <number>this.game.config.height);
    //   this.cameras.main.setRenderToTexture(shader);
    //   this.cameras.main.glTexture
    // });
  }

  // update(time: number) {
  //   this.shaders.get("Lines").setFloat1("time", time);
  // }

  /**
   * Writes data to the terminal screen and updates it accordingly
   * @param data The strings to be added at the end of the terminal screen
   * @param overwrite If true, overwrite the terminal screen text with the data text
   */
  updateTerminalScreen(data: string, overwrite=false) {
    if (overwrite) {
      this.terminalScreen.text = data;
    }
    else {
      this.terminalScreen.text += data;
    }
    this.scrollTerminalScreenTo(TerminalScene.TERMINAL_HEIGHT - this.terminalScreen.height); // Move the terminal screen to the bottom
    this.updateScrollBarSize(); // Update the scroll bar
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Moves the terminal screen to a specified location (used for scrolling)
   * @param newY The new Y-value the terminal screen should move to
   */
  private scrollTerminalScreenTo(newY: number) {
    if (this.terminalScreen.height > TerminalScene.TERMINAL_HEIGHT) {
      this.terminalScreen.y = newY;
      this.terminalScreen.y = Phaser.Math.Clamp(this.terminalScreen.y, TerminalScene.TERMINAL_HEIGHT - this.terminalScreen.height, 10);
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

  /**
   * Defines what happens when the user presses enter on the keyboard
   * @param inputStr The string that is currently in the input of the command line
   * @param scene The scene instance that contains the terminal input
   */
  private static onEnter(inputStr: string, scene: Phaser.Scene) {
    let terminalScene = <TerminalScene>scene;

    // Submit input
    let response = InputHandler.submitInput(inputStr);
    if (response.type === InputResponseType.STRING || response.type === InputResponseType.ERROR) {
      // Update the terminal screen
      terminalScene.updateTerminalScreen(`\n\n> ${ inputStr }\n${ response.stringData }`);

      // Reset all variables
      TerminalInputHandler.instance.currInput = "";
      TerminalInputHandler.instance.lastInput = "";
      TerminalInputHandler.instance.cursorPos = 0;
    }
    else if (response.type === InputResponseType.SCENE_CHANGE) {
      terminalScene.updateTerminalScreen(`\n\n> ${ inputStr }`);
      terminalScene.scene.start(response.sceneChangeData, {terminalData: terminalScene.terminalScreen.text});
    }

    // Check if terminal screen overflows allotted text amount
    let textArr = terminalScene.terminalScreen.text.split("\n");
    if (textArr.length > MAX_NUM_TERMINAL_LINES) { // If there are too many lines, trim it
      terminalScene.updateTerminalScreen(textArr.slice(textArr.length - MAX_NUM_TERMINAL_LINES).join("\n"), true);
    }
  }
}
