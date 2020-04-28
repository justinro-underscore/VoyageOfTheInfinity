import "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";
import { TextCutsceneHandler, TextCutsceneInstruction, TextCutsceneInstructionType, TextCutsceneConfig } from "../handler/textCutsceneHandler";
import { ShaderHandler } from "../handler/shaderHandler";

/**
 * Defines the data that is passed in for the initialization
 */
interface CutsceneSceneInitData {
  cutsceneKey: string; // String that acts as a key to access the cutscene information
  toScene: string; // Defines what scene to go to after the cutscene is finished
}

/**
 * Defines the scene that generates a text cutscene
 */
export class CutsceneScene extends Phaser.Scene {
  terminalScreen: BBCodeText; // The text object that holds all text information

  cutsceneConfig: TextCutsceneConfig; // The initial configuration of this cutscene
  cutsceneInstructions: Array<TextCutsceneInstruction>; // The list of cutscene instructions
  dataInstructionPointer: number; // Keeps track of what instruction we are currently on
  currCutsceneData: number; // Keeps track of any data that must persist over instruction calls

  currTextTimeDelta: number; // The current time between instruction calls
  lastInstructionTime: number; // Defines the last time we made an instruction call

  readyToContinue: boolean; // True if cutscene has finished, false otherwise
  sceneToContinueTo: string; // Defines what scene to go to after the player has selected to continue

  constructor() {
    super({
      key: "CutsceneScene"
    });
  }

  /**
   * Initializes the scene by setting its cutscene data
   * @param data The initial cutscene data
   */
  init(data: CutsceneSceneInitData) {
    let cutsceneInfo = TextCutsceneHandler.getCutscene(data.cutsceneKey);
    this.cutsceneConfig = cutsceneInfo.config;
    this.cutsceneInstructions = cutsceneInfo.instructions;
    this.sceneToContinueTo = data.toScene;
  }

  /**
   * Loads the background
   */
  preload() {
    this.load.image("terminalScreen", "assets/img/terminal-screen.png");
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(10, 10, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    /******************************
     * Set up the terminal screen *
     ******************************/
    this.terminalScreen = new BBCodeText(this, 0, 0, `[color=${ this.cutsceneConfig.color }]`, {
      fontFamily: "Monospace",
      fontSize: "16px",
      fill: this.cutsceneConfig.color,
      wordWrap: { width: this.cameras.main.width - 20, useAdvancedWrap: true }
    }).setPosition(10, 10);
    this.add.existing(this.terminalScreen);

    /**************************
     * Add user functionality *
     **************************/
    this.input.keyboard.on("keydown", function (event: KeyboardEvent) {
      if (event.keyCode === 32) {
        this.scene.start(this.sceneToContinueTo);
      }
    }, this);

    /************************
     * Set up the variables *
     ************************/
    this.dataInstructionPointer = 0;
    this.currCutsceneData = 0;

    this.currTextTimeDelta = this.cutsceneConfig.textSpeed;
    this.lastInstructionTime = 0;

    this.readyToContinue = false;

    /******************
     * Set up shaders *
     ******************/
    ShaderHandler.setRenderToShaders(this, "terminal");
  }

  /**
   * Updates the shaders and, if time, runs an instruction call
   * @param time The amount of time that has elapsed since instantiation
   */
  update(time: number) {
    ShaderHandler.updateShaders(time);
    let diff = time - this.lastInstructionTime;
    if (!this.readyToContinue && diff > this.currTextTimeDelta) {
      this.runInstruction();
      this.lastInstructionTime = time;
    }
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Backspaces one character
   */
  private backspaceTerminalText() {
    let terminalText = <string>this.terminalScreen.text;
    if (terminalText.match(/\[color=#[0-9a-fA-F]{6}\]$/gm)) { // If we are about to backspace into a color tag
      if (terminalText.match(/\[\/color\]\[color=#[0-9a-fA-F]{6}\]$/gm)) { // If we have not reached the beginning of the text
        this.terminalScreen.text = terminalText.substring(0, terminalText.lastIndexOf("[/color]") - 1); // Remove the color tag
      }
      else { // If we have reached the beginning of the text
        this.currCutsceneData = 0; // Stop backspacing
        return;
      }
    }
    else { // If we are just removing text
      this.terminalScreen.text = terminalText.substring(0, terminalText.length - 1);
    }
    this.currCutsceneData--;
  }

  /**
   * Runs the current instruction, either by starting a new instruction or continuing the current instruction
   */
  private runInstruction() {
    if (this.cutsceneInstructions[this.dataInstructionPointer].instructionType === TextCutsceneInstructionType.PAUSE) { // Reset the text speed back to the default (after pauses)
      this.currTextTimeDelta = this.cutsceneConfig.textSpeed;
    }

    // Execute the instruction
    let data = this.cutsceneInstructions[this.dataInstructionPointer].data;
    let moveInstructionPointer = true; // Defines if we should continue to the next instruction after this execution
    switch (this.cutsceneInstructions[this.dataInstructionPointer].instructionType) {
      case TextCutsceneInstructionType.TEXT: // currCutsceneData keeps track of the index of the next character
        let text = <string>data;
        if (this.currCutsceneData < text.length) { // Add the text
          this.terminalScreen.text += text.charAt(this.currCutsceneData);
          this.currCutsceneData++;
        }
        if (this.currCutsceneData === text.length) { // If we have added the final character...
          this.currCutsceneData = 0; // Reset the index and move the instruction pointer to next instruction
        }
        else { // If we still have more character to add...
          moveInstructionPointer = false; // Don't move on to the next instruction
        }
        break;
      case TextCutsceneInstructionType.COLOR:
        this.terminalScreen.text += `[/color][color=${ data }]`; // Adds a color tag
        break;
      case TextCutsceneInstructionType.PAUSE:
        this.currTextTimeDelta = <number>data;
        break;
      case TextCutsceneInstructionType.BACKSPACE: // currCutsceneData keeps track of how many backspaces we have left
        if (this.currCutsceneData === 0) { // First time we go into this
          this.currCutsceneData = <number>data;
        }
        this.backspaceTerminalText();
        if (this.currCutsceneData > 0) { // If we still have backspaces left to do, do not move on to next instruction
          moveInstructionPointer = false;
        }
        break;
      case TextCutsceneInstructionType.NEWLINE:
        this.terminalScreen.text += "\n";
        break;
      default:
        console.error(`Instruction ${ this.cutsceneInstructions[this.dataInstructionPointer].instructionType } not implemented in CutsceneScene!`);
    }

    // Move on to the next instruction
    if (moveInstructionPointer) {
      if (this.dataInstructionPointer < (this.cutsceneInstructions.length - 1)) {
        this.dataInstructionPointer++;
      }
      else { // If we have reached the end of the instructions, signal we are ready to continue
        this.readyToContinue = true;
      }
    }
  }
}
