import { MapHandler } from "./mapHandler";
import { InventoryHandler } from "./inventoryHandler";
import { EventHandler } from "./eventHandler";
import { SuggestionObj } from "./terminalInputHandler";
import { GameObject } from "../gameobjects/gameObject";

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

interface CommandObject {
  getPotentialArguments: () => Map<string, Array<string>>;
  responseType: InputResponseType;
  validate: (args: Array<string>) => boolean;
  execute: (args: Array<string>) => string;
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
    if (commandEventOutcome != null) {
      return commandEventOutcome;
    }
    return obj.desc;
  }

  private static takeObject(obj: GameObject): string {
    InputHandler.overrideInput = null;
    let commandEventOutcome = EventHandler.runCommandEvent("take", obj);
    if (commandEventOutcome != null) {
      return commandEventOutcome;
    }
    if (obj.pickupable) {
      InventoryHandler.addObject(obj);
      if (!MapHandler.removeObject(obj)) {
        console.error(`Removed an object from the map that did not exist on the map: {${ obj.id }}`);
      }
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
      return commandEventOutcome;
    }
    if (!InventoryHandler.removeObject(obj)) {
      console.error(`Dropped an object that was not in the inventory: {${ obj.id }}`);
    }
    MapHandler.addObject(obj);
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
      return EventHandler.runUseEvent(useObj, withObj);
    }
    else {
      return "Cannot use an object with itself!";
    }
  }

  private static useSingleObject(useObj: GameObject): string {
    InputHandler.overrideInput = null;
    return EventHandler.runUseEvent(useObj);
  }

  private static VALID_COMMANDS = new Map<string, Array<string>>(Object.entries({
    "examine": null,
    "go": [
      "walk"
    ],
    "take": null,
    "drop": null,
    "inventory": [
      "inv"
    ],
    "use": null,
    "map": null
  }));

  private static COMMAND_OBJS = new Map<string, CommandObject>(Object.entries({
    "examine": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let objNames = MapHandler.getCurrRoomObjects().map(obj => obj.name.toLocaleLowerCase());
        objNames = objNames.concat(InventoryHandler.objectsInInventory.map(obj => obj.name.toLocaleLowerCase()));
        let args = new Map<string, Array<string>>();
        objNames.forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
      execute: (args: Array<string>): string => {
        if (args.length === 0) {
          return MapHandler.getCurrRoomInfo(true);
        }
        let objName = args.join(" ");
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
      }
    },

    "go": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let dirs = ["north", "n", "east", "e", "south", "s", "west", "w"];
        let args = new Map<string, Array<string>>();
        dirs.forEach(dir => {
          args.set(dir, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
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
        }
        if (MapHandler.movePlayer(dir)) {
          let visited = MapHandler.getCurrRoomVisited()
          if (!visited) {
            MapHandler.setCurrRoomVisitedStatus(true);
          }
          InputHandler.setSuggestions();

          return MapHandler.getCurrRoomInfo(!visited);
        }
        return "Cannot go that direction!";
      }
    },

    "take": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let args = new Map<string, Array<string>>();
        MapHandler.getCurrRoomObjects().filter(obj => obj.pickupable).map(obj => obj.name.toLocaleLowerCase()).forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
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
      }
    },

    "drop": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        let args = new Map<string, Array<string>>();
        InventoryHandler.objectsInInventory.map(obj => obj.name.toLocaleLowerCase()).forEach(name => {
          args.set(name, null);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
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
      }
    },

    "inventory": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
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
      }
    },

    "use": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        // TODO Check to see if objects can be used
        let objNames = MapHandler.getCurrRoomObjects().map(obj => obj.name.toLocaleLowerCase());
        objNames = objNames.concat(InventoryHandler.objectsInInventory.map(obj => obj.name.toLocaleLowerCase()));
        let args = new Map<string, Array<string>>();
        objNames.forEach(name => {
          args.set(name, objNames);
        });
        return args;
      },
      responseType: InputResponseType.STRING,
      validate: (args: Array<string>): boolean => {
        return true;
      },
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
      }
    },

    "map": {
      getPotentialArguments: (): Map<string, Array<string>> => {
        return null;
      },
      responseType: InputResponseType.SCENE_CHANGE,
      validate: (args: Array<string>): boolean => {
        return true;
      },
      execute: (args: Array<string>): string => {
        return "MapTerminalScene";
      }
    }
  }));

  private static getMasterCommand(command: string): string {
    let masterKey = null;
    if (!InputHandler.VALID_COMMANDS.has(command)) {
      Array.from(InputHandler.VALID_COMMANDS.entries()).forEach(cmd => {
        console.log(cmd, cmd[1] != null && command in cmd[1]);
        if (cmd[1] != null && cmd[1].includes(command)) {
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
    let response = new InputResponse(InputHandler.getMasterCommand(command), InputResponseType.ERROR, "Command not recognized!");
    if (commandObj != null) {
      if (commandObj.validate(args)) {
        response = new InputResponse(InputHandler.getMasterCommand(command), commandObj.responseType, commandObj.execute(args));
      }
      else {
        response = new InputResponse(InputHandler.getMasterCommand(command), InputResponseType.ERROR, `Error, invalid use of the command ${ command }`);
      }
    }
    return response;
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
      let suggObj = InputHandler.COMMAND_OBJS.get(keyCommand[0]).getPotentialArguments();
      if (keyCommand[1] != null) {
        keyCommand[1].forEach(command => {
          InputHandler.inputSuggestions.set(command, suggObj);
        });
      }
      InputHandler.inputSuggestions.set(keyCommand[0], suggObj);
    });
  }
}
