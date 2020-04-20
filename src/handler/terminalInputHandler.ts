import "phaser"
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";
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
  INVALID
}

// The amount of ticks between when the cursor blinks
const CURSOR_BLINK_TIME = 800;

// How long to wait between key inputs
const KEY_DEBOUNCE_WAIT_TIME = 1;

// Defines the starting text of the command line
const COMMAND_LINE_PROMPT = "[b]>[/b] ";

// Define show tall the command line input is
export const COMMAND_LINE_OFFSET = 10;

/**
 * Defines what configuration options are available for the terminal input
 */
export interface TerminalInputConfig {
  fontSize?: number; // Font size of the command line
  primaryFontColor?: string; // Color of the command line
  secondaryFontColor?: string; // Color of the suggestions
}

// Defines how suggestions are created (1st level word leads to 2nd level word leads to 3rd level word)
export type SuggestionObj = Map<string, Map<string, Array<string>>>;

/**
 * Handles all input to the terminal screen
 */
export class TerminalInputHandler {
  static instance: TerminalInputHandler // Can only have one instance going at a time
  static COMMAND_LINE_HEIGHT: number; // Defines how tall the command line is

  private scene: Phaser.Scene; // Reference to the scene that this is being used in

  private config: TerminalInputConfig; // Current configuration of the terminal input
  private commandLine: BBCodeText; // Text that keeps track of what is currently input
  private currInput: string; // The current input

  private freezeInput: boolean; // If true, user cannot enter in any more characters

  private cursor: Phaser.GameObjects.Text; // Text that shows where the cursor is currently positioned
  private cursorPos: number; // Current cursor position
  private blinkCursor: boolean; // If the cursor is visible or not
  private cursorBlinkEvent: Phaser.Time.TimerEvent; // The timer event that determines the next time the cursor blink is toggled

  private keyDebounceReject: boolean; // Keeps track of if we should accept or reject user input (to avoid double inputs)

  private lastInput: string; // Keeps track of the last input before a call to get the previous input was made

  onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void; // Defines what should happen when the input string is input
                                                                // Need the scene in order to access variables inside the scene
                                                                //  (in functions, cast this to subclass of Phaser.Scene)

  private suggestions: SuggestionObj; // Defines the suggestions for inputs
  private showSugg: boolean; // If true, show the suggestion

  /**
   * Instantiates the current instance of TerminalInputHandler
   * @param scene The scene that this is being used in
   * @param onEnterFunc Defines what happens when the input string is input
   * @param suggestions Defines the suggestions for input
   * @param config The configuration of the terminal
   */
  static instantiateTerminalInput(scene: Phaser.Scene, onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void, suggestions?: SuggestionObj, config?: TerminalInputConfig) {
    TerminalInputHandler.instance = new TerminalInputHandler(scene, onEnterFunc, suggestions, config);
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
      primaryFontColor: "#ffffff",
      secondaryFontColor: "#999999"
    }
  }

  /**
   * Resets all variables, setting current input and last input to "" and cursor position to 0
   */
  static resetInput() {
    if (TerminalInputHandler.instance != null) {
      TerminalInputHandler.instance.currInput = "";
      TerminalInputHandler.instance.lastInput = "";
      TerminalInputHandler.instance.cursorPos = 0;
      TerminalInputHandler.instance.showSugg = false;
    }
  }

  /**
   * Sets the suggestions of the command line
   * @param suggestions The suggestion object containing new suggestions
   */
  static setSuggestions(suggestions: SuggestionObj) {
    if (TerminalInputHandler.instance != null) {
      TerminalInputHandler.instance.suggestions = suggestions;
    }
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Creates a new instance of the TerminalInputHandler
   * @param scene The scene that this is being used in
   * @param onEnterFunc Defines what happens when the input string is input
   * @param suggestions Defines the suggestions for input
   * @param config The configuration of the terminal
   */
  private constructor(scene: Phaser.Scene, onEnterFunc: (inputStr: string, scene: Phaser.Scene) => void, suggestions?: SuggestionObj, config?: TerminalInputConfig) {
    this.scene = scene;
    this.suggestions = suggestions;
    this.showSugg = false;

    this.config = TerminalInputHandler.getDefaultTerminalConfig();
    if (config != null) {
      if ("fontSize" in config) {
        this.config.fontSize = config.fontSize;
      }
      if ("primaryFontColor" in config) {
        this.config.primaryFontColor = config.primaryFontColor;
      }
      if ("secondaryFontColor" in config) {
        this.config.secondaryFontColor = config.secondaryFontColor;
      }
    }

    // Create the input
    this.currInput = "";
    this.lastInput = "";
    this.commandLine = new BBCodeText(scene, 0, 0, COMMAND_LINE_PROMPT, { fontFamily: "Monospace", fontSize: `${ this.config.fontSize }px`, color: this.config.primaryFontColor });
    scene.add.existing(this.commandLine);
    TerminalInputHandler.COMMAND_LINE_HEIGHT = this.commandLine.height;
    this.commandLine.setPosition(COMMAND_LINE_OFFSET, scene.cameras.main.height - (COMMAND_LINE_OFFSET + TerminalInputHandler.COMMAND_LINE_HEIGHT));

    // Create the cursor
    this.blinkCursor = true;
    this.cursor = scene.add.text(0, 0, "  _", { font: `${ this.config.fontSize }px Monospace`, fill: this.config.primaryFontColor });
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

    this.commandLine.text = this.commandLine.text.replace("|", "").replace("_", ""); // Need to get rid of cursor in order to check length
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

    let showSugg = false; // Only show the suggestion if we type a character or have an invalid input
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
            if (this.cursorPos === this.currInput.length) {
              showSugg = true;
            }
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
        // Move cursor to the right or fill in suggestion
        case KeyCodeCateogry.KEY_RIGHT:
          // If the cursor is all the right, fill in the suggestion
          if (this.cursorPos === this.currInput.length) {
            this.fillSuggestion();
          }
          else if (this.cursorPos < this.currInput.length) { // Otherwise, move the cursor
            this.cursorPos++;
          }
          break;
        // Remove char behind cursor or remove suggestion
        case KeyCodeCateogry.BACKSPACE:
          // If we are at the end of input and a suggestion is shown, hide it (default). Otherwise, remove a character
          if (this.cursorPos < this.currInput.length || !(new RegExp(`\\[color=${ this.config.secondaryFontColor }\\].+\\[/color\\]`)).test(this.commandLine.text)) {
            this.currInput = this.currInput.substring(0, this.cursorPos - 1) + this.currInput.substring(this.cursorPos);

            // Move the cursor
            if (this.cursorPos > 0) {
              this.cursorPos--;
            }

            // Save this change
            InputHandler.resetPrevInputCounter();
            this.lastInput = this.currInput;
          }
          break;
        // Remove char in front of cursor
        case KeyCodeCateogry.DELETE:
          if (this.cursorPos < this.currInput.length) {
            this.currInput = this.currInput.substring(0, this.cursorPos) + this.currInput.substring(this.cursorPos + 1);

            // Save this change
            InputHandler.resetPrevInputCounter();
            this.lastInput = this.currInput;
          }
          break;
        // Accept current input
        case KeyCodeCateogry.ENTER:
          this.fillSuggestion();
          let inputStr = this.currInput.trim();
          if (inputStr != "") {
            this.onEnterFunc(inputStr, this.scene);
          }
          break;
        // If an invalid input, still show the suggestion
        default:
          showSugg = true;
          break;
      }
      this.showSugg = showSugg;
      this.updateCommandLine();
      this.setCursorVisible(); // After every key input, set the cursor to visible
      this.checkForFreezeInput(); // After every key input, check if we should freeze user input (or release user input freeze)
    }
  }

  /**
   * Updates the command line by filling it with the current input and potentially adding a suggestion
   */
  private updateCommandLine() {
    if (this.showSugg && this.suggestions != null) {
      let suggestionText = this.findSuggestion();
      this.commandLine.text = COMMAND_LINE_PROMPT + this.currInput + `[color=${ this.config.secondaryFontColor }]${ suggestionText }[/color]`; // Update the command line
    }
    else {
      this.commandLine.text = COMMAND_LINE_PROMPT + this.currInput; // Update the command line
    }
  }

  /**
   * Sets the current input to the current suggestion
   */
  private fillSuggestion() {
    this.currInput = this.commandLine.text.substr(COMMAND_LINE_PROMPT.length).replace(`[color=${ this.config.secondaryFontColor }]`, "").replace("[/color]", "");
    this.cursorPos = this.currInput.length;
  }

  /**
   * Determines what the suggestion on the current input should be
   * @returns The suggestion, trimmed so that the current input has overwritten the first part. If no suggestion, return empty string
   */
  private findSuggestion(): string {
    if (this.currInput.charAt(this.currInput.length - 1) != " ") {
      let currWords = this.currInput.trim();
      // Remove any articles
      // TODO Replace this with removing all articles
      if (currWords.indexOf("use ") === 0) {
        currWords = currWords.replace(" with ", " ");
      }
      let words = currWords.split(" ");
      return this.getSuggestionText(words, [], words[words.length - 1]);
    }
    return "";
  }

  /**
   * Recursively determines the suggestion text based on current input
   * @param words The current input, split into seperate words
   * @param suggs An array that contains the previous assumed suggestions
   * @param lastWord The word that is being tested
   * @returns The suggestion, trimmed so that the current input has overwritten the first part. If no suggestion, return empty string
   */
  private getSuggestionText(words: Array<string>, suggs: Array<string>, lastWord: string): string {
    // If we have no more input, we have found our suggestion
    if (words.length === 0) {
      // If there is a suggestion available, return the final one
      if (suggs.length > 0) {
        let sugg = suggs[suggs.length - 1];
        sugg = sugg.substr(lastWord.length); // Remove the first part so that it is not duplicating current input
        return sugg;
      }
      else { // Otherwise, return the empty string
        return "";
      }
    }

    // If we have reached the maximum level (3 deep), no more suggestions available
    let level = suggs.length;
    if (suggs.length >= 3) {
      return "";
    }

    // Find the current suggestions based on the remaining input
    let currSuggs = Array.from(this.suggestions.keys()); // Always start at top level suggestions
    if (level === 1) { // If can go to first level suggestions, do that
      if (this.suggestions.get(suggs[0]) != null) {
        currSuggs = Array.from(this.suggestions.get(suggs[0]).keys());
      }
      else {
        return "";
      }
    }
    else if (level === 2) { // If can go to second level suggestions, do that
      if (this.suggestions.get(suggs[0]).get(suggs[1]) != null) {
        currSuggs = this.suggestions.get(suggs[0]).get(suggs[1]);
      }
      else {
        return "";
      }
    }

    // Loop through different ways of combining inputs to find the best next suggestion
    // for (let i = 0; i < words.length; i++) { // TODO Potentially start at different positions?
    for (let i = 1; i <= words.length; i++) {
      let currWord = words.slice(0, i).join(" "); // Grab a word of the input
      if (currWord != "") { // If that word exists
        let potentialSuggs = currSuggs.filter(word => word.indexOf(currWord) === 0); // Filter all suggestions until only suggestions that start with the current word remain
        for (let sugg of potentialSuggs) { // Loop through all remaining suggestions until one works
          let res = this.getSuggestionText(words.slice(i), suggs.concat([sugg]), currWord);
          if (res != "") { // If we have a valid suggestion, return it!
            return res;
          }
          // Otherwise, continue looping through suggestions
        }
      }
    }
    return "";
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
