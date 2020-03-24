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

// How long to wait between key inputs
const keyDebounceVal = 1;

// Coefficient that determines how fast a scroll moves
const scrollCoef = 10;

// How many pixels wide the scroll bar is
const scrollBarWidth = 5;

export class TerminalScene extends Phaser.Scene {
  terminalScreen: Phaser.GameObjects.Text;
  commandLine: Phaser.GameObjects.Text;
  currInput = "";
  scrollBar: Phaser.GameObjects.Image;

  freezeInput = false;

  blinkCursor = false; // If the cursor is visible or not
  lastBlinkTime = 0; // Keeps track of how long its been since we toggled the cursor

  keyDebounceTime = 0;

  constructor() {
    super({
      key: "TerminalScene"
    });
  }

  preload() {
    this.load.image("scrollBar", 'assets/img/white-pixel.png');
    this.load.image("terminalScreen", 'assets/img/terminal-screen.png');
  }

  create() {
    let background = this.add.image(0, 0, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

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

    this.currInput = "";
    this.commandLine = this.add.text(10, this.cameras.main.height - 30, "> ",
      { font: '16px Monospace', fill: '#77ff55' });

    this.scrollBar = this.add.image(this.cameras.main.width - scrollBarWidth, 0, "scrollBar").setInteractive();
    this.scrollBar.setOrigin(0, 0);
    this.scrollBar.setDisplaySize(scrollBarWidth, this.cameras.main.height - 40);
    this.scrollBar.setTint(0x77ff55);
    this.scrollBar.on('pointerover', () => this.scrollBar.setTint(0xfdfdcd));
    this.scrollBar.on('pointerout', () => this.scrollBar.setTint(0x77ff55));
    this.input.setDraggable(this.scrollBar);
    this.input.on('drag', (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _x: number, y: number) => {
      this.moveScrollBar(y);
    });
    this.scrollBar.setVisible(false);

    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);
    this.input.on('wheel', (_pointer: Phaser.Input.Mouse.MouseManager, _gameObjects: Array<Phaser.GameObjects.GameObject>, _deltaX: number, deltaY: number) => {
      const scrollDelta = deltaY * scrollCoef;
      this.scrollTerminalScreenTo(this.terminalScreen.y - scrollDelta);
      this.updateScrollBarPosition();
    });
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
    if (this.keyDebounceTime > 0) {
      this.keyDebounceTime -= 1;
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

  private scrollTerminalScreenTo(newY: number) {
    if (this.terminalScreen.height > this.cameras.main.height - 40) {
      this.terminalScreen.y = newY;
      this.terminalScreen.y = Phaser.Math.Clamp(this.terminalScreen.y, this.cameras.main.height - 40 - this.terminalScreen.height, 10);
    }
  }

  private moveScrollBar(newY: number) {
    this.scrollBar.y = newY;
    this.scrollBar.y = Phaser.Math.Clamp(this.scrollBar.y, 0, this.cameras.main.height - 40 - this.scrollBar.displayHeight);

    const [m, b] = this.getMB();
    const newTerminalScreenY = (this.scrollBar.y - b) / m;
    this.scrollTerminalScreenTo(newTerminalScreenY);
  }

  private updateScrollBarSize() {
    const screenHeight = this.cameras.main.height - 40;
    if (this.terminalScreen.height > this.cameras.main.height - 40) {
      this.scrollBar.setVisible(true);
      let scrollBarHeight = (screenHeight * screenHeight) / this.terminalScreen.height;
      scrollBarHeight = Phaser.Math.Clamp(scrollBarHeight, 3, screenHeight);
      this.scrollBar.setDisplaySize(scrollBarWidth, scrollBarHeight);
      this.scrollBar.y = screenHeight - scrollBarHeight;
    }
    else {
      this.scrollBar.setVisible(false);
    }
  }

  private updateScrollBarPosition() {
    const [m, b] = this.getMB();
    const scrollBarPos = m * (this.terminalScreen.y) + b;
    this.scrollBar.y = scrollBarPos;
  }

  private getMB(): [number, number] {
    const screenHeight = this.cameras.main.height - 40;
    const m = (screenHeight - this.scrollBar.displayHeight) / (screenHeight - this.terminalScreen.height - 10);
    const b = -10 * m;
    return [m, b];
  }

  // Defines the functionality of keyboard events
  private onKeyInput(keyEvent: KeyboardEvent) {
    if (this.keyDebounceTime > 0) {
      return;
    }
    else {
      this.keyDebounceTime = keyDebounceVal;
    }
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
            this.terminalScreen.text += `\n\n> ${ this.currInput }\n${ response }`;
            this.scrollTerminalScreenTo(this.cameras.main.height - 40 - this.terminalScreen.height);
            this.updateScrollBarSize();
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
