import "phaser";

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
  previousInputs: Phaser.GameObjects.Text;
  commandLine: Phaser.GameObjects.Text;
  currInput = "";

  blinkCursor = false; // If the cursor is visible or not
  lastBlinkTime = 0; // Keeps track of how long its been since we toggled the cursor

  constructor() {
    super({
      key: "TerminalScene"
    });
  }

  create() {
    this.currInput = "";
    this.commandLine = this.add.text(10, 570, "> ",
      { font: '16px Monospace', fill: '#fbfbac' });
    this.previousInputs = this.add.text(10, 10, "",
      { font: '16px Monospace', fill: '#fbfbac' });

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);
  }

  update(time: number) {
    // Blink the cursor
    let diff = time - this.lastBlinkTime;
    if (diff > blinkTimeDelta) {
      this.blinkCursor = !this.blinkCursor;
      this.lastBlinkTime = time;
    }

    this.commandLine.text = "> " + this.currInput + (this.blinkCursor ? "_" : "");
  }

  /*
    PRIVATE METHODS
  */

  // Defines the functionality of keyboard events
  private onKeyInput(keyEvent: KeyboardEvent) {
    // Reset cursor to visible
    this.blinkCursor = false;
    this.lastBlinkTime = -blinkTimeDelta;

    // Get key event category
    const keyCat = this.getKeyCategory(keyEvent.keyCode);
    if (keyCat != KeyCodeCateogry.INVALID) {
      switch (keyCat) {
        // If letter or space, append to the input string
        case KeyCodeCateogry.LETTER:
        case KeyCodeCateogry.SPACE:
          this.currInput += keyEvent.key.toLocaleLowerCase();
          break;
        // If digit, append to the input string the actual number
        case KeyCodeCateogry.DIGIT:
          this.currInput += keyEvent.keyCode - 48;
          break;
        // If backspace, remove last char from keyboard input
        case KeyCodeCateogry.BACKSPACE:
          this.currInput = this.currInput.substring(0, this.currInput.length - 1);
          break;
        // If enter, accept current input
        case KeyCodeCateogry.ENTER:
          this.previousInputs.text += this.currInput + "\n";
          // TODO Parse data
          this.currInput = "";
          break;
      }
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
