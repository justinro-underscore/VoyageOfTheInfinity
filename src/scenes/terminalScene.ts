import "phaser";
import { InputHandler } from '../handler/inputHandler';
import { MapHandler } from '../handler/mapHandler';

// Defines what category each key input goes into
enum KeyCodeCateogry {
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
};

// The amount of ticks between when the cursor blinks
const CURSOR_BLINK_TIME = 800;

// How long to wait between key inputs
const KEY_DEBOUNCE_WAIT_TIME = 1;

// Coefficient that determines how fast a scroll moves
const SCROLL_COEF = 10;

// How many pixels wide the scroll bar is
const SCROLL_BAR_WIDTH = 5;

/**
 * Defines the scene where user can input commands through a terminal interface
 */
export class TerminalScene extends Phaser.Scene {
  terminalScreen: Phaser.GameObjects.Text; // Text that is shown to the user, holds all previous inputs and their responses
  commandLine: Phaser.GameObjects.Text; // Text that keeps track of what is currently input
  currInput = ""; // The current input
  scrollBar: Phaser.GameObjects.Image; // Scroll bar on the right side of the scene that keeps track of where the user has scrolled to

  freezeInput = false; // If true, user cannot enter in any more characters

  cursor: Phaser.GameObjects.Text; // Text that shows where the cursor is currently positioned
  cursorPos = 0; // Current cursor position
  blinkCursor = false; // If the cursor is visible or not
  cursorBlinkEvent: Phaser.Time.TimerEvent; // The timer event that determines the next time the cursor blink is toggled

  keyDebounceReject = false; // Keeps track of if we should accept or reject user input (to avoid double inputs)

  lastInput = ""; // Keeps track of the last input before a call to get the previous input was made

  constructor() {
    super({
      key: "TerminalScene"
    });
  }

  /**
   * Load images
   */
  preload() {
    this.load.image("scrollBar", 'assets/img/white-pixel.png');
    this.load.image("terminalScreen", 'assets/img/terminal-screen.png');
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
    // Create a mask (so that the terminal screen does not reach the bottom of the screen which is reserved for user input)
    let graphics = this.make.graphics({});
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height - 40);
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
    this.scrollBar.setDisplaySize(SCROLL_BAR_WIDTH, this.cameras.main.height - 40); // Start out the full size of the terminal screen
    this.scrollBar.setTint(0x77ff55); // Should be the color of the text

    // Set up draggable functionality
    this.scrollBar.on('pointerover', () => this.scrollBar.setTint(0xfdfdcd));
    this.scrollBar.on('pointerout', () => this.scrollBar.setTint(0x77ff55));
    this.input.setDraggable(this.scrollBar);
    this.input.on('drag', (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _x: number, y: number) => {
      this.moveScrollBar(y);
    });
    // When the user scrolls their scrollwheel, move the screen & scroll bar
    this.input.on('wheel', (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _deltaX: number, deltaY: number) => {
      const scrollDelta = deltaY * SCROLL_COEF;
      this.scrollTerminalScreenTo(this.terminalScreen.y - scrollDelta);
      this.updateScrollBarPosition();
    });
    this.scrollBar.setVisible(false); // Start out invisible

    /*********************************
     * Set up the command line input *
     *********************************/
    this.currInput = "";
    this.commandLine = this.add.text(10, this.cameras.main.height - 30, "> ",
      { font: '16px Monospace', fill: '#77ff55' });
    this.blinkCursor = true;
    this.cursor = this.add.text(10, this.cameras.main.height - 30, "  _",
      { font: '16px Monospace', fill: '#77ff55' });
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);

    // Start the blink
    this.cursorBlinkEvent = this.time.addEvent({
      delay: CURSOR_BLINK_TIME,
      callback: this.blinkCursorCallback,
      callbackScope: this,
      loop: true
    });
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

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
    const width = this.cameras.main.width;
    const offset = 40; // Determines how far from the side of the screen should be counted until the user input has reached the end of the screen

    this.commandLine.text = "> " + this.currInput; // Need to get rid of cursor in order to check length
    this.freezeInput = this.commandLine.width >= (width - offset);
  }

  /**
   * Moves the terminal screen to a specified location (used for scrolling)
   * @param newY The new Y-value the terminal screen should move to
   */
  private scrollTerminalScreenTo(newY: number) {
    if (this.terminalScreen.height > this.cameras.main.height - 40) {
      this.terminalScreen.y = newY;
      this.terminalScreen.y = Phaser.Math.Clamp(this.terminalScreen.y, this.cameras.main.height - 40 - this.terminalScreen.height, 10);
    }
  }

  /**
   * Moves the scroll bar to a new position
   * NOTE: will also scroll the terminal screen to a new location
   * @param newY The new Y-value the scroll bar should move to
   */
  private moveScrollBar(newY: number) {
    this.scrollBar.y = newY;
    this.scrollBar.y = Phaser.Math.Clamp(this.scrollBar.y, 0, this.cameras.main.height - 40 - this.scrollBar.displayHeight);

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
    const screenHeight = this.cameras.main.height - 40; // TODO Abstract this out so it doesn't need to be recalculated every time
    // Only change the size if the terminal screen height has surpassed its masking
    if (this.terminalScreen.height > screenHeight) {
      this.scrollBar.setVisible(true);
      // Set the height with HELLA maths (see notebook for description of how I got this)
      let scrollBarHeight = (screenHeight * screenHeight) / this.terminalScreen.height;
      scrollBarHeight = Phaser.Math.Clamp(scrollBarHeight, 3, screenHeight); // Height should never be less than 3 pixels (but we shouldn't really ever get there)
      this.scrollBar.setDisplaySize(SCROLL_BAR_WIDTH, scrollBarHeight);
      this.scrollBar.y = screenHeight - scrollBarHeight; // Set scroll bar location to bottom of screen
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
    const screenHeight = this.cameras.main.height - 40;
    const m = (screenHeight - this.scrollBar.displayHeight) / (screenHeight - this.terminalScreen.height - 10);
    const b = -10 * m;
    return [m, b];
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
      this.time.addEvent({
        delay: KEY_DEBOUNCE_WAIT_TIME,
        callback: () => {
          this.keyDebounceReject = false;
        },
        callbackScope: this
      });
    }

    const keyCat = this.getKeyCategory(keyEvent.keyCode);
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
          if (this.currInput != "") {
            let response = InputHandler.submitInput(this.currInput);

            // Update the terminal screen
            this.terminalScreen.text += `\n\n> ${ this.currInput }\n${ response }`;
            this.scrollTerminalScreenTo(this.cameras.main.height - 40 - this.terminalScreen.height); // Move the terminal screen to the bottom
            this.updateScrollBarSize(); // Update the scroll bar

            // Reset all variables
            this.currInput = "";
            this.lastInput = "";
            this.cursorPos = 0;
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

  /**
   * Gets the category of the keyboard input (@see KeyCodeCateogry)
   * @param key The keycode of the keyboard input
   * @returns The category of the keyboard input
   */
  private getKeyCategory(key: number): KeyCodeCateogry {
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
};
