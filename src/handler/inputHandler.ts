import { MapHandler } from "./mapHandler";
import { InventoryHandler } from "./inventoryHandler";
import { EventHandler } from "./eventHandler";
import { SuggestionObj } from "../scenes/abstractscenes/terminalInputScene";
import { GameObject } from "../gameobjects/gameObject";

// Defines what category each key input goes into
export enum KeyCodeCateogry {
  LETTER,
  DIGIT,
  SPACE,
  ESCAPE,
  ENTER,
  BACKSPACE,
  KEY_UP,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_DOWN,
  DELETE,
  INVALID
}

class MultipleObjects extends Error {
  objectsFound: Array<GameObject>;

  constructor(objects: Array<GameObject>) {
    super();
    this.objectsFound = objects;
  }
}

class OverrideInput {
  command: string;
  func: (inputStr: string) => InputResponse;
  data: any;

  constructor(command: string, func: (inputStr: string) => InputResponse, data: any) {
    this.command = command;
    this.func = func;
    this.data = data;
  }
}

interface CommandObjectHelp {
  syntax?: string;
  args?: {
    argName: string;
    argOpts: string;
    argExample: string;
  }[];
  desc: string;
}

interface CommandInfoObject {
  hidden: boolean;
  synonyms?: string[];
}

interface CommandObject {
  getPotentialArguments: () => Map<string, Array<string>>;
  responseType: InputResponseType;
  execute: (args: Array<string>) => string;
  help: CommandObjectHelp[];
}

enum ObjectLocation {
  MAP,
  INVENTORY
}

export enum InputResponseType {
  ERROR,
  STRING,
  SCENE_CHANGE
}

const dirOptions = ["north", "n", "east", "e", "south", "s", "west", "w"];

export class InputResponse {
  command: string;
  type: InputResponseType;
  stringData: string = null;
  sceneChangeData: string = null; // The scene key to change to

  constructor(command: string, type: InputResponseType, data?: any) {
    this.command = command;
    this.type = type;
    switch (type) {
      case InputResponseType.STRING:
      case InputResponseType.ERROR:
        this.stringData = <string>data;
        break;
      case InputResponseType.SCENE_CHANGE:
        this.sceneChangeData = <string>data;
        break;
      default:
        console.error(`Input Response did not account for type {${ type }}`);
    }
  }
}

const MAX_PREV_INPUTS = 50; // Defines how many previous inputs we keep track of

export class InputHandler {
  static overrideInput: OverrideInput = null;
  static previousInputs = new Array<string>();
  static currPrevInputPointer = -1;
  private static inputSuggestions: SuggestionObj = null;

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
      case 27:
        return KeyCodeCateogry.ESCAPE;
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

  static submitInput(inputStr: string): InputResponse {
    InputHandler.currPrevInputPointer = -1;
    if (InputHandler.overrideInput === null) {
      InputHandler.previousInputs.unshift(inputStr);
      if (InputHandler.previousInputs.length > MAX_PREV_INPUTS) {
        InputHandler.previousInputs.pop();
      }

      let inputStrArr = inputStr.split(" ");
      let command = inputStrArr[0];
      let objs = inputStrArr.splice(1);
      return InputHandler.handleCommand(command, objs);
    }
    else {
      return InputHandler.overrideInput.func(inputStr);
    }
  }

  static resetPrevInputCounter() {
    InputHandler.currPrevInputPointer = -1;
  }

  static getNextPrevInput(): string {
    return InputHandler.getPrevInput(true);
  }

  static getPreviousPrevInput(): {bottom: boolean; prevInput: string} {
    if (InputHandler.currPrevInputPointer < 0) {
      return {bottom: true, prevInput: ""};
    }
    return {bottom: false, prevInput: InputHandler.getPrevInput(false)};
  }

  static getSuggestions(): SuggestionObj {
    if (InputHandler.inputSuggestions === null) {
      InputHandler.setSuggestions();
    }
    return InputHandler.inputSuggestions;
  }

  private static getPrevInput(next: boolean) {
    if (InputHandler.previousInputs.length === 0) {
      return "";
    }
    if (next && (InputHandler.currPrevInputPointer < (InputHandler.previousInputs.length - 1))) {
      InputHandler.currPrevInputPointer++;
    }
    if (!next && InputHandler.currPrevInputPointer >= 0) {
      InputHandler.currPrevInputPointer--;
    }

    if (InputHandler.currPrevInputPointer < 0) {
      return "";
    }
    return InputHandler.previousInputs[InputHandler.currPrevInputPointer];
  }

  private static examineObject(obj: GameObject): string {
    InputHandler.overrideInput = null;
    let commandEventOutcome = EventHandler.runCommandEvent("examine", obj);
    InputHandler.setSuggestions(); // Update the suggestions because an event may or may not have occured
    if (commandEventOutcome != null) {
      return commandEventOutcome;
    }
    return obj.desc;
  }

  private static takeObject(obj: GameObject): string {
    InputHandler.overrideInput = null;
    let commandEventOutcome = EventHandler.runCommandEvent("take", obj);
    if (commandEventOutcome != null) {
      InputHandler.setSuggestions(); // Update the suggestions because an event has occured
      return commandEventOutcome;
    }
    if (obj.pickupable) {
      InventoryHandler.addObject(obj);
      if (!MapHandler.removeObject(obj)) {
        console.error(`Removed an object from the map that did not exist on the map: {${ obj.id }}`);
      }
      InputHandler.setSuggestions(); // Update the suggestions because the player has taken the object
      return "Taken";
    }
    else {
      return `${ obj.name } cannot be moved!`;
    }
  }

  private static dropObject(obj: GameObject): string {
    InputHandler.overrideInput = null;
    let commandEventOutcome = EventHandler.runCommandEvent("drop", obj);
    if (commandEventOutcome != null) {
      InputHandler.setSuggestions(); // Update the suggestions because an event has occured
      return commandEventOutcome;
    }
    if (!InventoryHandler.removeObject(obj)) {
      console.error(`Dropped an object that was not in the inventory: {${ obj.id }}`);
    }
    MapHandler.addObject(obj);
    InputHandler.setSuggestions(); // Update the suggestions because the player has dropped an object
    return "Dropped";
  }

  private static getObjectToUseWith(useObj: GameObject): string {
    let withObjStr = <string>InputHandler.overrideInput.data.withObjStr;
    InputHandler.overrideInput = new OverrideInput("use", null, {useObj: useObj, setNull: false});
    return InputHandler.getObjectToUseWithCallback(withObjStr);
  }

  private static getObjectToUseWithCallback(inputStr: string): string {
    try {
      let withObj = InputHandler.getObject(inputStr);
      let result = `${ inputStr } cannot be found`;
      if (withObj != null) {
        result = InputHandler.useMultipleObjects(withObj);
      }
      InputHandler.overrideInput = null;
      return result;
    }
    catch (multObj) {
      InputHandler.overrideInput = new OverrideInput("use", InputHandler.chooseObject, {
        callback: InputHandler.useMultipleObjects,
        objs: (<MultipleObjects>multObj).objectsFound,
        useObj: InputHandler.overrideInput.data.useObj
      });
      return InputHandler.multipleObjectsDetectedPrompt(multObj);
    }
  }

  private static useMultipleObjects(withObj: GameObject): string {
    let useObj = <GameObject>InputHandler.overrideInput.data.useObj;
    InputHandler.overrideInput = null;
    if (useObj.id != withObj.id) {
      let res = EventHandler.runUseEvent(useObj, withObj);
      InputHandler.setSuggestions(); // Update the suggestions because an event has occured
      return res;
    }
    else {
      return "Cannot use an object with itself!";
    }
  }

  private static useSingleObject(useObj: GameObject): string {
    InputHandler.overrideInput = null;
    let res = EventHandler.runUseEvent(useObj);
    InputHandler.setSuggestions(); // Update the suggestions because an event has occured
    return res;
  }

  private static VALID_COMMANDS = new Map<string, CommandInfoObject>(Object.entries({
    "examine": {
      hidden: false,
    },
    "go": {
      hidden: false,
      synonyms: ["walk"]
    },
    "take": {
      hidden: false,
    },
    "drop": {
      hidden: false,
    },
    "inventory": {
      hidden: false,
      synonyms: ["inv"]
    },
    "use": {
      hidden: false,
    },
    "map": {
      hidden: false,
    },
    "help": {
      hidden: false,
    },
    "swag": {
      hidden: true,
    },
    "debug": {
      hidden: true,
    },
    "settings": {
      hidden: false,
    }
  }));

  private static COMMAND_OBJS = new Map<string, CommandObject>(Object.entries({
    "examine": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let objNames = MapHandler.getCurrRoomObjects().flatMap(obj => obj.getNames());
        objNames = objNames.concat(InventoryHandler.objectsInInventory.flatMap(obj => obj.getNames()));
        let args = new Map<string, Array<string>>();
        objNames.forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let objName = args.join(" ");
        if (args.length === 0 || objName === "room") {
          return MapHandler.getCurrRoomInfo(true);
        }
        try {
          let obj = InputHandler.getObject(objName);
          if (obj != null) {
            return InputHandler.examineObject(obj);
          }
          else {
            return `${ objName } cannot be found`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInput = new OverrideInput("examine", InputHandler.chooseObject, {callback: InputHandler.examineObject, objs: (<MultipleObjects>multObj).objectsFound});
          return InputHandler.multipleObjectsDetectedPrompt(multObj);
        }
      },
      help: [
        {
          desc: "get a full description of the current room"
        },
        {
          args: [{
            argName: "obj",
            argOpts: "an object in the room or in one's inventory",
            argExample: "triceratops dung"
          }],
          desc: "get a description of an object"
        }
      ]
    },

    "go": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let dirs = dirOptions;
        let args = new Map<string, Array<string>>();
        dirs.forEach(dir => {
          args.set(dir, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let dir = -1;
        switch (args[0]) {
          case "north":
          case "n":
            dir = 0;
            break;
          case "east":
          case "e":
            dir = 1;
            break;
          case "south":
          case "s":
            dir = 2;
            break;
          case "west":
          case "w":
            dir = 3;
            break;
          default:
            return "Invalid direction"
        }
        let moveEventRes = EventHandler.runMoveEvent(MapHandler.getCurrRoomId(), dir); // Check if there is a move event
        let res = ""; // Defines what is returned to the screen

        // First, add move event result to the returned result
        if (moveEventRes != null && moveEventRes.result != "") {
          res += moveEventRes.result;
          if (!moveEventRes.overrideResult) { // If there will be more, add spacing
            res += "\n\n";
          }
        }

        // Second, move the player
        if (MapHandler.movePlayer(dir)) {
          let visited = MapHandler.getCurrRoomVisited()
          if (!visited) {
            MapHandler.setCurrRoomVisitedStatus(true);
          }
          InputHandler.setSuggestions(); // Update the suggestions because the player has moved

          // Third, if the input is not to be overidden by the move event, add current room info
          if (moveEventRes === null || !moveEventRes.overrideResult) {
            res += MapHandler.getCurrRoomInfo(!visited);
          }
        }
        // Third, if input is not to be overidden by the move event, tell the user they cannot move
        else if (moveEventRes === null || !moveEventRes.overrideResult) {
          res += "Cannot go in that direction!";
        }
        return res;
      },
      help: [{
        args: [{
          argName: "dir",
          argOpts: `one of the following: [${ dirOptions.reduce((dir, str) => dir + ", " + str) }]`,
          argExample: "north"
        }],
        desc: "attempts to move the player in the given direction"
      }]
    },

    "take": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let args = new Map<string, Array<string>>();
        MapHandler.getCurrRoomObjects().filter(obj => obj.pickupable).flatMap(obj => obj.getNames()).forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let objName = args.join(" ");
        try {
          let obj = InputHandler.getObject(objName, [ObjectLocation.INVENTORY]);
          if (obj != null) {
            return InputHandler.takeObject(obj);
          }
          else {
            return `${ objName } cannot be found`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInput = new OverrideInput("take", InputHandler.chooseObject, {callback: InputHandler.takeObject, objs: (<MultipleObjects>multObj).objectsFound});
          return InputHandler.multipleObjectsDetectedPrompt(multObj);
        }
      },
      help: [{
        args: [{
          argName: "obj",
          argOpts: "an object in the room",
          argExample: "golden idol"
        }],
        desc: "places an object in one's inventory (if possible)"
      }]
    },

    "drop": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let args = new Map<string, Array<string>>();
        InventoryHandler.objectsInInventory.flatMap(obj => obj.getNames()).forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let objName = args.join(" ");
        try {
          let obj = InputHandler.getObject(objName, [ObjectLocation.MAP]);
          if (obj != null) {
            return InputHandler.dropObject(obj);
          }
          else {
            return `${ objName } is not in your inventory`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInput = new OverrideInput("drop", InputHandler.chooseObject, {callback: InputHandler.dropObject, objs: (<MultipleObjects>multObj).objectsFound});
          return InputHandler.multipleObjectsDetectedPrompt(multObj);
        }
      },
      help: [{
        args: [{
          argName: "obj",
          argOpts: "an object in one's inventory",
          argExample: "crystal"
        }],
        desc: "takes an object out of one's inventory and puts it in the room"
      }]
    },

    "inventory": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        if (InventoryHandler.size === 0) {
          return "Inventory is empty!";
        }
        else {
          let result = "In your inventory you have:";
          InventoryHandler.objectsInInventory.forEach(obj => {
            result += `\n- ${ obj.name }`;
          });
          return result;
        }
      },
      help: [{
        desc: "shows what one has in their inventory"
      }]
    },

    "use": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        // TODO Check to see if objects can be used
        let objNames = MapHandler.getCurrRoomObjects().flatMap(obj => obj.getNames());
        objNames = objNames.concat(InventoryHandler.objectsInInventory.flatMap(obj => obj.getNames()));
        let args = new Map<string, Array<string>>();
        objNames.forEach(name => {
          args.set(name, objNames);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let objName = args.join(" ");
        if (objName.includes(" with ")) { // Use multiple objects
          let objNames = objName.split(" with ");
          try {
            let useObj = InputHandler.getObject(objNames[0]);
            if (useObj != null) {
              InputHandler.overrideInput = new OverrideInput("use", null, {withObjStr: objNames[1]});
              return InputHandler.getObjectToUseWith(useObj);
            }
            else {
              return `${ objNames[0] } cannot be found`;
            }
          }
          catch (multObj) {
            InputHandler.overrideInput = new OverrideInput("use", InputHandler.chooseObject, {callback: InputHandler.getObjectToUseWith, objs: (<MultipleObjects>multObj).objectsFound, withObjStr: objNames[1], setNull: false});
            return InputHandler.multipleObjectsDetectedPrompt(multObj);
          }
        }
        else { // Using single objects
          try {
            let obj = InputHandler.getObject(objName);
            if (obj != null) {
              return InputHandler.useSingleObject(obj);
            }
            else {
              return `${ objName } cannot be found`;
            }
          }
          catch (multObj) {
            InputHandler.overrideInput = new OverrideInput("use", InputHandler.chooseObject, {callback: InputHandler.useSingleObject, objs: (<MultipleObjects>multObj).objectsFound, setNull: false});
            return InputHandler.multipleObjectsDetectedPrompt(multObj);
          }
        }
      },
      help: [{
        args: [{
          argName: "obj",
          argOpts: "an object in the room or in one's inventory",
          argExample: "keypad"
        }],
        desc: "attempts to use the given object"
      },
      {
        syntax: "$1 $2 with $3",
        args: [{
          argName: "useObj",
          argOpts: "an object in the room or in one's inventory",
          argExample: "plasma gun"
        },
        {
          argName: "withObj",
          argOpts: "an object in the room or in one's inventory, different from obj1",
          argExample: "door"
        }],
        desc: "attempts to use the first object on the second object"
      }]
    },

    "map": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.SCENE_CHANGE,
      execute: (args: Array<string>): string => {
        return "MapTerminalScene";
      },
      help: [{
        desc: "opens the game map"
      }]
    },

    "help": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let cmdNames = Array.from(InputHandler.VALID_COMMANDS.entries()).filter(cmd => !cmd[1].hidden).flatMap(cmd => ((cmd[1].synonyms != null) ? cmd[1].synonyms : []).concat([cmd[0]]));
        let args = new Map<string, Array<string>>();
        cmdNames.forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let cmd = (args.length > 0 ? InputHandler.getMasterCommand(args[0]) : "help");
        if (cmd != null) {
          let helpObj = InputHandler.COMMAND_OBJS.get(cmd).help;
          let res = "";
          helpObj.forEach(obj => {
            res += "\n";
            let syntax = obj.syntax;
            if (!("syntax" in obj)) {
              syntax = "$1";
              if ("args" in obj) {
                obj.args.forEach((_, i) => {
                  syntax += ` $${ i + 2 }`;
                });
              }
            }
            let example = syntax; // Do not replace $1 with cmd (yet)
            syntax = syntax.replace("$1", cmd);
            let args = ("args" in obj ? obj.args : []);
            args.forEach((arg, i) => {
              syntax = syntax.replace(`$${ i + 2 }`, `<${ arg.argName }>`);
              example = example.replace(`$${ i + 2 }`, arg.argExample);
            });
            res += `Usage: ${ syntax }\n`;
            args.forEach(arg => {
              res += `\twhere <${ arg.argName }> is:\n`;
              res += `\t\t${ arg.argOpts }\n`;
            });
            res += `Description: ${ obj.desc }\n`;
            let cmds = InputHandler.VALID_COMMANDS.get(cmd).synonyms;
            if (cmds != null) {
              res += `\tAlso responds to: [${ cmds.reduce((cmd, str) => cmd + ", " + str) }]\n`;
            }
            res += `Example: \`${ example.replace("$1", cmd) }\``;
            if (cmds != null) {
              res += ` OR \`${ example.replace("$1", cmds[0]) }\``;
            }
            res += "\n";
          });
          res = res.substr(0, res.length - 1);
          return res;
        }
        return `${ args[0] } is not a valid command`;
      },
      help: [{
        desc: "shows how to use the `help` command"
      },
      {
        args: [{
          argName: "command",
          argOpts: `one of the following: [${ Array.from(InputHandler.VALID_COMMANDS.entries()).filter(cmd => !cmd[1].hidden).map(cmd => cmd[0]).reduce((cmd, str) => cmd + ", " + str) }]`,
          argExample: "examine"
        }],
        desc: "shows how to use the given command"
      }]
    },

    "swag": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        return "Ha ha, swag bro";
      },
      help: [{
        desc: "swag",
        example: "swag"
      }]
    },

    "debug": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.STRING,
      execute: (args: Array<string>): string => {
        let res = "Debug not set up";
        let commands = [
          "go north",
          "go north",
          "examine lockers",
          "examine open locker",
          "take keycard",
          "go south",
          "go east",
          "use keycard with door",
          "go south",
          "take wrench",
          "use wrench with pipe b",
          "use wrench with pipe c",
          "go north"
        ];
        res = "Turned on power and moved player to lodging\n\n";
        commands.forEach(cmd => {
          InputHandler.submitInput(cmd).stringData;
        });
        return res + MapHandler.getCurrRoomInfo(true);
      },
      help: [{
        desc: "runs a string of commands to update a player's state"
      }]
    },

    "settings": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.SCENE_CHANGE,
      execute: (args: Array<string>): string => {
        return "SettingsScene";
      },
      help: [{
        desc: "opens the settings menu to adjust settings"
      }]
    },
  }));

  private static getMasterCommand(command: string): string {
    let masterKey = null;
    if (!InputHandler.VALID_COMMANDS.has(command)) {
      Array.from(InputHandler.VALID_COMMANDS.entries()).forEach(cmd => {
        if (cmd[1].synonyms != null && cmd[1].synonyms.includes(command)) {
          masterKey = cmd[0];
          return;
        }
      });
    }
    else {
      masterKey = command;
    }
    return masterKey;
  }

  private static getCommandObj(command: string): CommandObject {
    let masterKey = InputHandler.getMasterCommand(command);

    if (masterKey != null) {
      if (!InputHandler.COMMAND_OBJS.has(masterKey)) {
        console.error(`Command ${ masterKey } is not defined`);
      }
      else {
        return InputHandler.COMMAND_OBJS.get(masterKey);
      }
    }
    return null;
  }

  private static handleCommand(command: string, args: Array<string>): InputResponse {
    const commandObj = InputHandler.getCommandObj(command);
    if (commandObj != null) {
      return new InputResponse(InputHandler.getMasterCommand(command), commandObj.responseType, commandObj.execute(args));
    }
    return new InputResponse(InputHandler.getMasterCommand(command), InputResponseType.ERROR, "Command not recognized!");
  }

  private static multipleObjectsDetectedPrompt(multObj: MultipleObjects): string {
    let prompt = "Which one? (Choose number)";
    (<MultipleObjects>multObj).objectsFound.forEach((obj, i) => {
      prompt += `\n${ i + 1 }. ${ obj.name }`;
    });
    return prompt;
  }

  private static getObject(objName: string, ignoreObjFrom: Array<ObjectLocation>=[]): GameObject {
    let objs = new Array<GameObject>();
    if (!ignoreObjFrom.includes(ObjectLocation.INVENTORY)) {
      objs = objs.concat(InventoryHandler.getObjectsFromName(objName));
    }
    if (!ignoreObjFrom.includes(ObjectLocation.MAP)) {
      objs = objs.concat(MapHandler.getObjectsFromName(objName));
    }

    if (objs.length === 0) {
      return null;
    }
    else if (objs.length === 1) {
      return objs[0];
    }
    else {
      throw new MultipleObjects(objs);
    }
  }

  private static chooseObject(inputStr: string): InputResponse {
    let command = InputHandler.overrideInput.command;
    let objs = InputHandler.overrideInput.data.objs;
    let num = Number(inputStr);
    let result = `${ inputStr } was not a possible choice`
    if (!isNaN(num) && num >= 1 && num <= objs.length) {
      result = InputHandler.overrideInput.data.callback(objs[num - 1]);
    }
    else {
      InputHandler.overrideInput = null;
    }
    return new InputResponse(command, InputResponseType.STRING, result);
  }

  private static setSuggestions() {
    InputHandler.inputSuggestions = new Map<string, Map<string, Array<string>>>();
    Array.from(InputHandler.VALID_COMMANDS.entries()).forEach(keyCommand => {
      if (!keyCommand[1].hidden) {
        let suggObj = InputHandler.COMMAND_OBJS.get(keyCommand[0]).getPotentialArguments();
        if (keyCommand[1].synonyms != null) {
          keyCommand[1].synonyms.forEach(command => {
            InputHandler.inputSuggestions.set(command, suggObj);
          });
        }
        InputHandler.inputSuggestions.set(keyCommand[0], suggObj);
      }
    });
  }
}
