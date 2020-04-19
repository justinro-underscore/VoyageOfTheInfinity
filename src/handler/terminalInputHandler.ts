import "phaser"
import { InputHandler } from "./inputHandler";

// Defines what category each key input goes into
export enum KeyCodeCateogry {
  LETTER,
  DIGIT,
  SPACE,
  ENTER,
  BACKSPACE,
  KEY_UP,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_DOWN,
  DELETE,
  TAB,
  INVALID
}

// The amount of ticks between when the cursor blinks
const CURSOR_BLINK_TIME = 800;

// How long to wait between key inputs
const KEY_DEBOUNCE_WAIT_TIME = 1;

// Define show tall the command line input is
export const COMMAND_LINE_OFFSET = 10;

export interface TerminalInputConfig {
  fontSize?: number;
  fontColor?: string;
}

/**
 * Handles all input to the terminal screen
 */
export class TerminalInputHandler {
  static instance: TerminalInputHandler // Can only have one instance going at a time
  static COMMAND_LINE_HEIGHT: number; // Defines how tall the command line is

  private scene: Phaser.Scene; // Reference to the scene that this is being used in

  commandLine: Phaser.GameObjects.Text; // Text that keeps track of what is currently input
  currInput: string; // The current input

  freezeInput: boolean; // If true, user cannot enter in any more characters

  cursor: Phaser.GameObjects.Text; // Text that shows where the cursor is currently positioned
  cursorPos: number; // Current cursor position
  blinkCursor: boolean; // If the cursor is visible or not
  cursorBlinkEvent: Phaser.Time.TimerEvent; // The timer event that determines the next time the cursor blink is toggled

  keyDebounceReject: boolean; // Keeps track of if we should accept or reject user input (to avoid double inputs)

  lastInput: string; // Keeps track of the last input before a call to get the previous input was made

  onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void; // Defines what should happen when the input string is input
                                                                // Need the scene in order to access variables inside the scene
                                                                //  (in functions, cast this to subclass of Phaser.Scene)

  /**
   * Instantiates the current instance of TerminalInputHandler
   * @param scene The scene that this is being used in
   * @param onEnterFunc Defines what happens when the input string is input
   * @param config The configuration of the terminal
   */
  static instantiateTerminalInput(scene: Phaser.Scene, onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void, config?: TerminalInputConfig) {
    TerminalInputHandler.instance = new TerminalInputHandler(scene, onEnterFunc, config);
  }

  /**
   * Gets the category of the keyboard input (@see KeyCodeCateogry)
   * @param key The keycode of the keyboard input
   * @returns The category of the keyboard input
   */
  static getKeyCategory(key: number): KeyCodeCateogry {
    if (key >= 65 && key <= 90) {
      return KeyCodeCateogry.LETTER
    }
    if (key >= 48 && key <= 57) {
      return KeyCodeCateogry.DIGIT;
    }
    switch (key) {
      case 8:
        return KeyCodeCateogry.BACKSPACE;
      case 9:
        return KeyCodeCateogry.TAB;
      case 10:
      case 13:
        return KeyCodeCateogry.ENTER;
      case 32:
        return KeyCodeCateogry.SPACE;
      case 37:
        return KeyCodeCateogry.KEY_LEFT;
      case 38:
        return KeyCodeCateogry.KEY_UP;
      case 39:
        return KeyCodeCateogry.KEY_RIGHT;
      case 40:
        return KeyCodeCateogry.KEY_DOWN;
      case 46:
        return KeyCodeCateogry.DELETE;
      default:
        return KeyCodeCateogry.INVALID;
    }
  }

  /**
   * Gets the default terminal configuration
   * @returns The default terminal configuration
   */
  static getDefaultTerminalConfig(): TerminalInputConfig {
    return {
      fontSize: 16,
      fontColor: "#ffffff"
    }
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Creates a new instance of the TerminalInputHandler
   * @param scene The scene that this is being used in
   * @param onEnterFunc Defines what happens when the input string is input
   * @param config The configuration of the terminal
   */
  private constructor(scene: Phaser.Scene, onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void, config?: TerminalInputConfig) {
    this.scene = scene;

    let terminalConfig = TerminalInputHandler.getDefaultTerminalConfig();
    if (config != null) {
      if ("fontSize" in config) {
        terminalConfig.fontSize = config.fontSize;
      }
      if ("fontColor" in config) {
        terminalConfig.fontColor = config.fontColor;
      }
    }

    // Create the input
    this.currInput = "";
    this.lastInput = "";
    this.commandLine = scene.add.text(0, 0, "> ", { font: `${ terminalConfig.fontSize }px Monospace`, fill: terminalConfig.fontColor });
    TerminalInputHandler.COMMAND_LINE_HEIGHT = this.commandLine.height;
    this.commandLine.setPosition(COMMAND_LINE_OFFSET, scene.cameras.main.height - (COMMAND_LINE_OFFSET + TerminalInputHandler.COMMAND_LINE_HEIGHT));

    // Create the cursor
    this.blinkCursor = true;
    this.cursor = scene.add.text(0, 0, "  _", { font: `${ terminalConfig.fontSize }px Monospace`, fill: terminalConfig.fontColor });
    this.cursor.setPosition(COMMAND_LINE_OFFSET, scene.cameras.main.height - (COMMAND_LINE_OFFSET + TerminalInputHandler.COMMAND_LINE_HEIGHT));
    this.cursorPos = 0;

    // Set variables
    this.keyDebounceReject = false;
    this.freezeInput = false;

    // Set what happens on key input
    this.onEnterFunc = onEnterFunc;
    scene.input.keyboard.on("keydown", (event: KeyboardEvent) => this.onKeyInput(event), this);

    // Start the blink
    this.cursorBlinkEvent = scene.time.addEvent({
      delay: CURSOR_BLINK_TIME,
      callback: this.blinkCursorCallback,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Blinks the cursor if it can
   */
  private blinkCursorCallback() {
    if (!this.freezeInput) {
      this.blinkCursor = !this.blinkCursor;
    }
    else {
      this.blinkCursor = (this.cursorPos != this.currInput.length);
    }

    let cursorPadding = "  ";
    for (let i = 0; i < this.cursorPos; i++) { cursorPadding += " "; }
    this.cursor.x = (this.cursorPos === this.currInput.length ? 10 : 5); // If cursor is in the middle of the word, move it slightly so that the pipe isn't on top of a character
    this.cursor.text = cursorPadding + (this.blinkCursor ? (this.cursorPos === this.currInput.length ? "_" : "|") : "");
  }

  /**
   * Checks if we should freeze user input
   * This should happen if the user's input has reached the end of the screen
   */
  private checkForFreezeInput() {
    const width = this.scene.cameras.main.width;
    const offset = 40; // Determines how far from the side of the screen should be counted until the user input has reached the end of the screen

    this.commandLine.text = "> " + this.currInput; // Need to get rid of cursor in order to check length
    this.freezeInput = this.commandLine.width >= (width - offset);
  }

  /**
   * Defines what happens when a key is input
   * @param keyEvent The keyboard event that calls this function
   */
  private onKeyInput(keyEvent: KeyboardEvent) {
    if (this.keyDebounceReject) {
      return; // Reject any input that while we are in debounce cooldown
    }
    else {
      this.keyDebounceReject = true;
      this.scene.time.addEvent({
        delay: KEY_DEBOUNCE_WAIT_TIME,
        callback: () => {
          this.keyDebounceReject = false;
        },
        callbackScope: this
      });
    }

    const keyCat = TerminalInputHandler.getKeyCategory(keyEvent.keyCode);
    if (keyCat != KeyCodeCateogry.INVALID) {
      switch (keyCat) {
        // If letter, digit, or space, append to the input string
        case KeyCodeCateogry.LETTER:
        case KeyCodeCateogry.DIGIT:
        case KeyCodeCateogry.SPACE:
          if (!this.freezeInput) {
            let key = keyEvent.key.toLocaleLowerCase();
            // Check if user is typing in digit while holding down shift
            if (keyCat === KeyCodeCateogry.DIGIT && ("" + (keyEvent.keyCode - 48)) != key) {
              key = "" + (keyEvent.keyCode - 48);
            }
            this.currInput = this.currInput.substring(0, this.cursorPos) + key + this.currInput.substring(this.cursorPos);

            // Save this change
            InputHandler.resetPrevInputCounter();
            this.lastInput = this.currInput;

            // Manipulate cursor
            this.cursorPos++;
          }
          break;
        // Replace input with next previous input
        case KeyCodeCateogry.KEY_UP:
          let newNextInput = InputHandler.getNextPrevInput();
          if (newNextInput != "") {
            this.currInput = newNextInput;
          }
          this.cursorPos = this.currInput.length; // Move cursor to the end
          break;
        // Replace input with previous previous input (or last edited command)
        case KeyCodeCateogry.KEY_DOWN:
          let newPrevInput = InputHandler.getPreviousPrevInput();
          if (!newPrevInput.bottom && newPrevInput.prevInput != "") {
            this.currInput = newPrevInput.prevInput;
          }
          else { // If we reach the bottom, set the input as the last edited input
            this.currInput = this.lastInput;
          }
          this.cursorPos = this.currInput.length; // Move cursor to the end
          break;
        // Move cursor to the left
        case KeyCodeCateogry.KEY_LEFT:
          if (this.cursorPos > 0) {
            this.cursorPos--;
          }
          break;
        // Move cursor to the right
        case KeyCodeCateogry.KEY_RIGHT:
          if (this.cursorPos < this.currInput.length) {
            this.cursorPos++;
          }
          break;
        // If backspace, remove char behind cursor
        case KeyCodeCateogry.BACKSPACE:
          this.currInput = this.currInput.substring(0, this.cursorPos - 1) + this.currInput.substring(this.cursorPos);

          // Move the cursor
          if (this.cursorPos > 0) {
            this.cursorPos--;
          }

          // Save this change
          InputHandler.resetPrevInputCounter();
          this.lastInput = this.currInput;
          break;
        // If delete, remove char in front of cursor
        case KeyCodeCateogry.DELETE:
          if (this.cursorPos < this.currInput.length) {
            this.currInput = this.currInput.substring(0, this.cursorPos) + this.currInput.substring(this.cursorPos + 1);

            // Save this change
            InputHandler.resetPrevInputCounter();
            this.lastInput = this.currInput;
          }
          break;
        // If enter, accept current input
        case KeyCodeCateogry.ENTER:
          let inputStr = this.currInput.trim();
          if (inputStr != "") {
            this.onEnterFunc(inputStr, this.scene);
          }
          break;
      }
      this.commandLine.text = "> " + this.currInput; // Update the command line
      this.setCursorVisible(); // After every key input, set the cursor to visible
      this.checkForFreezeInput(); // After every key input, check if we should freeze user input (or release user input freeze)
    }
  }

  /**
   * Sets the cursor status to visible
   * Also resets blinkEvent so cursor continues to blink normally
   */
  private setCursorVisible() {
    this.blinkCursor = false;
    this.blinkCursorCallback();
    this.cursorBlinkEvent.reset({
      delay: CURSOR_BLINK_TIME,
      callback: this.blinkCursorCallback,
      callbackScope: this,
      loop: true
    });
  }
}
