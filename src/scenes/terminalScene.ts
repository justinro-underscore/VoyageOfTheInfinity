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
  TAB,
  INVALID
};

// The amount of ticks between when the cursor blinks
const blinkTimeDelta = 800;

export class TerminalScene extends Phaser.Scene {
  previousLinesHTML: Element;
  commandLine: Phaser.GameObjects.Text;
  currInput = "";

  freezeInput = false;

  blinkCursor = false; // If the cursor is visible or not
  lastBlinkTime = 0; // Keeps track of how long its been since we toggled the cursor

  constructor() {
    super({
      key: "TerminalScene"
    });
  }

  preload() {
    this.load.html('terminal', 'assets/html/terminal.html');
  }

  create() {
    let terminal = this.add.dom(400, 280).createFromCache('terminal');
    this.previousLinesHTML = terminal.getChildByID("lines-display");
    terminal.getChildByID("first-line").innerHTML = MapHandler.getCurrRoomInfo(false);

    this.currInput = "";
    this.commandLine = this.add.text(10, 570, "> ",
      { font: '16px Monospace', fill: '#fbfbac' });

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);
  }

  update(time: number) {
    // Blink the cursor
    if (!this.freezeInput) {
      let diff = time - this.lastBlinkTime;
      if (diff > blinkTimeDelta) {
        this.blinkCursor = !this.blinkCursor;
        this.lastBlinkTime = time;
      }
    }

    this.commandLine.text = "> " + this.currInput + (this.blinkCursor ? "_" : "");
  }

  /*
    PRIVATE METHODS
  */

  private checkForFreezeInput() {
    const width = this.cameras.main.width;
    const offset = 40;

    // Need to get rid of cursor in order to check length
    this.commandLine.text = "> " + this.currInput;
    this.freezeInput = this.commandLine.width >= (width - offset);
    if (this.freezeInput) {
      this.blinkCursor = false;
    }
  }

  // Defines the functionality of keyboard events
  private onKeyInput(keyEvent: KeyboardEvent) {
    // Get key event category
    const keyCat = this.getKeyCategory(keyEvent.keyCode);
    if (keyCat != KeyCodeCateogry.INVALID) {
      switch (keyCat) {
        // If letter, digit, or space, append to the input string
        case KeyCodeCateogry.LETTER:
        case KeyCodeCateogry.DIGIT:
        case KeyCodeCateogry.SPACE:
          if (!this.freezeInput) {
            let key = keyEvent.key.toLocaleLowerCase();
            // Check if user is holding down shift
            if (keyCat === KeyCodeCateogry.DIGIT && ("" + (keyEvent.keyCode - 48)) != key) {
              key = "" + (keyEvent.keyCode - 48);
            }
            this.currInput += key;

            // Reset cursor to visible
            this.blinkCursor = false;
            this.lastBlinkTime = -blinkTimeDelta;
          }
          break;
        // If backspace, remove last char from keyboard input
        case KeyCodeCateogry.BACKSPACE:
          this.currInput = this.currInput.substring(0, this.currInput.length - 1);
          break;
        // If enter, accept current input
        case KeyCodeCateogry.ENTER:
          if (this.currInput != "") {
            let response = InputHandler.submitInput(this.currInput);

            let text = document.createElement("p");
            text.innerText = `> ${ this.currInput }\n${ response }`;
            this.previousLinesHTML.appendChild(text);

            this.previousLinesHTML.scrollTop = this.previousLinesHTML.scrollHeight;
            // TODO Parse data
            this.currInput = "";
          }
          break;
      }
      this.checkForFreezeInput();
    }
  }

  // Returns the key code category of the input character
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
      default:
        return KeyCodeCateogry.INVALID;
    }
  }
};
