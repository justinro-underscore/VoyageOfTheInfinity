import testingFile from "../gameinfo/textCutscenes/testing.json";
// import prologueFile from "../gameinfo/textCutscenes/prologue.json";

/**
 * Defines what instructions can be used in a cutscene
 */
export enum TextCutsceneInstructionType {
  TEXT, // The default
  PAUSE, // [p={num milliseconds}]
  COLOR, // [c=#{hex code for color}]
  BACKSPACE, // [b={num characters to backspace}]
  NEWLINE // Triggered at the end of a line
}

/**
 * Defines how an instruction is encoded
 */
export interface TextCutsceneInstruction {
  instructionType: TextCutsceneInstructionType;
  data?: number | string;
}

/**
 * Defines the optional parameters to tweak the configuration of this cutscene
 */
export interface TextCutsceneConfig {
  color?: string; // The default color of the cutscene
  textSpeed?: number; // The space in milliseconds between typed digits
}

/**
 * Defines how a text cutscene file should be set up
 */
interface TextCutsceneFileInterface {
  config?: TextCutsceneConfig;
  lines: string[];
}

/**
 * Defines how a processed cutscene's information is stored
 */
interface TextCutsceneProcessedInterface {
  config: TextCutsceneConfig;
  instructions: TextCutsceneInstruction[]; // List of instructions defining the steps in showing the cutscene
}

/**
 * Handles all the information of cutscenes
 */
export class TextCutsceneHandler {
  private static processedCutscenes: Map<string, TextCutsceneProcessedInterface>; // Holds all cutscenes that have been processed
  private static availableCutscenes: Map<string, TextCutsceneFileInterface> = new Map([ // Holds all cutscenes that have yet to be processed
    // ["prologue", prologueFile]
    ["testing", testingFile]
  ]);

  /**
   * Instantiates the TextCutsceneHandler by processing all available cutscene files
   */
  static processCutscenes() {
    TextCutsceneHandler.processedCutscenes = new Map<string, TextCutsceneProcessedInterface>();
    Array.from(TextCutsceneHandler.availableCutscenes.entries()).forEach(cutsceneFile => {
      let processedFile = TextCutsceneHandler.processCutscene(cutsceneFile[1]);
      TextCutsceneHandler.processedCutscenes.set(cutsceneFile[0], processedFile);
    });
  }

  /**
   * Returns all information concerning the provided cutscene key
   * @param cutsceneKey The key that accesses a given cutscene
   * @returns The cutscene information if the cutscene exists, null otherwise
   */
  static getCutscene(cutsceneKey: string): TextCutsceneProcessedInterface {
    if (TextCutsceneHandler.processedCutscenes.has(cutsceneKey)) {
      return TextCutsceneHandler.processedCutscenes.get(cutsceneKey);
    }
    return null;
  }

  /**
   * Gets the default cutscene configuration
   * Must be a function instead of a const because the object kept getting overwritten
   * @returns The default cutscene configuration
   */
  static getDefaultCutsceneConfig(): TextCutsceneConfig {
    return {
      color: "#ffffff",
      textSpeed: 50
    }
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Processes a given cutscene file
   * @param cutscene The cutscene file to process
   * @returns A processed version of the provided cutscene file
   */
  private static processCutscene(cutscene: TextCutsceneFileInterface): TextCutsceneProcessedInterface {
    // Get the list of instructions
    let instructions: Array<TextCutsceneInstruction> = cutscene.lines.flatMap(line => {
      /*
       * Wouldn't this be great to use? Unfortunately, Javascript doesn't support lookbehinds!
       */
      // let textArr = line.split(/(?<!\\)\[[cpb]=[#0-9a-z.]+\]/g).filter(text => text.length > 0);

      // Split the lines into the seperate instructions - the following could be simplified if JAVASCRIPT SUPPORTED LOOKBEHINDS
      let textRev = line.split("").reverse().join("");
      let textArr = textRev.split(/(\][#0-9a-z.]+=[cpb]\[)(?!\\)/g).filter(text => text.length > 0);
      textArr = textArr.map(text => text.split("").reverse().join("")).reverse();

      // Goes through all instructions on this line and return an array of the instructions
      return textArr.map<TextCutsceneInstruction>(text => {
        let instructionType = null;
        let data = null;
        if (text.charAt(0) === "[") { // This means it is not text, but an instruction
          let command = text.charAt(1);
          let commandData = text.substring(3, text.length - 1);
          switch (command) {
            case "p":
              instructionType = TextCutsceneInstructionType.PAUSE;
              data = parseInt(commandData);
              break;
            case "c":
              instructionType = TextCutsceneInstructionType.COLOR;
              data = commandData;
              break;
            case "b":
              instructionType = TextCutsceneInstructionType.BACKSPACE;
              data = parseInt(commandData);
              break;
            default:
              console.error(`Command {${ command }} not implemented in cutscene!`);
          }
        }
        else { // We have text
          instructionType = TextCutsceneInstructionType.TEXT;
          data = text;
        }

        // Return the object
        return {
          instructionType: instructionType,
          data: data
        }
      }).concat([{instructionType: TextCutsceneInstructionType.NEWLINE}]); // Finish by adding a newline
    });

    if (instructions.length > 0) { // If this file contained any data...
      let config = TextCutsceneHandler.getDefaultCutsceneConfig();
      if (cutscene.config != null) {
        if ("color" in cutscene.config) {
          config.color = cutscene.config.color;
        }
        if ("textSpeed" in config) {
          config.textSpeed = cutscene.config.textSpeed;
        }
      }
      return {
        config: config,
        instructions: instructions
      };
    }
    return null; // ... Else return nothing
  }
}
