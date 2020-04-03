import { MapHandler } from './mapHandler';
import { InventoryHandler } from './inventoryHandler';
import { EventHandler } from './eventHandler';
import { GameObject } from '../gameobjects/gameObject';
import { Input } from 'phaser';

class MultipleObjects extends Error {
  objectsFound: Array<GameObject>;

  constructor(objects: Array<GameObject>) {
    super();
    this.objectsFound = objects;
  }
}

class OverrideInput {
  func: (inputStr: string) => string;
  data: any;

  constructor(func: (inputStr: string) => string, data: any) {
    this.func = func;
    this.data = data;
  }
}

enum ObjectLocation {
  MAP,
  INVENTORY
}

export class InputHandler {
  static overrideInput: OverrideInput = null;
  static previousInputs = new Array<string>();
  static currPrevInputPointer = -1;

  static submitInput(inputStr: string): string {
    InputHandler.currPrevInputPointer = -1;
    if (InputHandler.overrideInput === null) {
      InputHandler.previousInputs.unshift(inputStr);
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

  static getPreviousPrevInput(): {bottom: boolean, prevInput: string} {
    if (InputHandler.currPrevInputPointer < 0) {
      return {bottom: true, prevInput: ""};
    }
    return {bottom: false, prevInput: InputHandler.getPrevInput(false)};
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
    return obj.desc;
  }

  private static takeObject(obj: GameObject): string {
    InputHandler.overrideInput = null;
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
    if (!InventoryHandler.removeObject(obj)) {
      console.error(`Dropped an object that was not in the inventory: {${ obj.id }}`);
    }
    MapHandler.addObject(obj);
    return "Dropped";
  }

  private static getObjectToUseWith(useObj: GameObject): string {
    InputHandler.overrideInput = new OverrideInput(InputHandler.getObjectToUseWithCallback, {useObj: useObj, setNull: false});
    return "With what?";
  }

  private static getObjectToUseWithHasWith(useObj: GameObject): string {
    let withObjStr = <string>InputHandler.overrideInput.data.withObjStr;
    InputHandler.overrideInput = new OverrideInput(null, {useObj: useObj, setNull: false});
    return InputHandler.getObjectToUseWithCallback(withObjStr);
  }

  private static getObjectToUseWithCallback(inputStr: string): string {
    try {
      let withObj = InputHandler.getObject(inputStr);
      let result = `${ inputStr } cannot be found`;
      if (withObj != null) {
        result = InputHandler.useObjects(withObj);
      }
      InputHandler.overrideInput = null;
      return result;
    }
    catch (multObj) {
      InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {
        callback: InputHandler.useObjects,
        objs: (<MultipleObjects>multObj).objectsFound,
        useObj: InputHandler.overrideInput.data.useObj
      });
      return InputHandler.multipleObjectsDetectedPrompt(multObj);
    }
  }

  private static useObjects(withObj: GameObject): string {
    let useObj = <GameObject>InputHandler.overrideInput.data.useObj;
    InputHandler.overrideInput = null;
    return EventHandler.runEvent(useObj, withObj);
  }

  private static getCommandObj(command: string): {validate: (objs: Array<string>) => boolean, execute: (objs: Array<string>) => string} {
    switch (command) {
      case "examine":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
            if (objs.length === 0) {
              return MapHandler.getCurrRoomInfo(true);
            }
            let objName = objs.join(" ");
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
              InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {callback: InputHandler.examineObject, objs: (<MultipleObjects>multObj).objectsFound});
              return InputHandler.multipleObjectsDetectedPrompt(multObj);
            }
          }
        }

      case "go":
      case "walk":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
            let dir = -1;
            switch (objs[0]) {
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
              return MapHandler.getCurrRoomInfo(true);
            }
            return "Cannot go that direction!";
          }
        }

      case "take":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
            let objName = objs.join(" ");
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
              InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {callback: InputHandler.takeObject, objs: (<MultipleObjects>multObj).objectsFound});
              return InputHandler.multipleObjectsDetectedPrompt(multObj);
            }
          }
        }

      case "drop":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
            let objName = objs.join(" ");
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
              InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {callback: InputHandler.dropObject, objs: (<MultipleObjects>multObj).objectsFound});
              return InputHandler.multipleObjectsDetectedPrompt(multObj);
            }
          }
        }

      case "inventory":
      case "inv":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
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
        }

      case "use":
        return {
          validate: (objs: Array<string>): boolean => {
            return true;
          },
          execute: (objs: Array<string>): string => {
            let objName = objs.join(" ");
            if (objName.includes(" with ")) {
              let objNames = objName.split(" with ");
              try {
                let useObj = InputHandler.getObject(objNames[0]);
                if (useObj != null) {
                  InputHandler.overrideInput = new OverrideInput(null, {withObjStr: objNames[1]});
                  return InputHandler.getObjectToUseWithHasWith(useObj);
                }
                else {
                  return `${ objNames[0] } cannot be found`;
                }
              }
              catch (multObj) {
                InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {callback: InputHandler.getObjectToUseWithHasWith, objs: (<MultipleObjects>multObj).objectsFound, withObjStr: objNames[1], setNull: false});
                return InputHandler.multipleObjectsDetectedPrompt(multObj);
              }
            }
            else {
              try {
                let obj = InputHandler.getObject(objName);
                if (obj != null) {
                  return InputHandler.getObjectToUseWith(obj);
                }
                else {
                  return `${ objName } cannot be found`;
                }
              }
              catch (multObj) {
                InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, {callback: InputHandler.getObjectToUseWith, objs: (<MultipleObjects>multObj).objectsFound, setNull: false});
                return InputHandler.multipleObjectsDetectedPrompt(multObj);
              }
            }
          }
        }
    }
    return null;
  }

  private static handleCommand(command: string, objs: Array<string>): string {
    const commandObj = InputHandler.getCommandObj(command);
    if (commandObj != null) {
      if (commandObj.validate(objs)) {
        return commandObj.execute(objs);
      }
      return `Error, invalid use of the command ${ command }`;
    }
    return "Command not recognized"
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
      objs = objs.concat(InventoryHandler.getObjects(objName));
    }
    if (!ignoreObjFrom.includes(ObjectLocation.MAP)) {
      objs = objs.concat(MapHandler.getObjects(objName));
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

  private static chooseObject(inputStr: string): string {
    let objs = InputHandler.overrideInput.data.objs;
    let num = Number(inputStr);
    let result = `${ inputStr } was not a possible choice`
    if (num != NaN && num >= 1 && num <= objs.length) {
      result = InputHandler.overrideInput.data.callback(objs[num - 1]);
    }
    else {
      InputHandler.overrideInput = null;
    }
    return result;
  }
}
