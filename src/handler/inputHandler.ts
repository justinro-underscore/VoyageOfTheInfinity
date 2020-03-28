import { MapHandler } from './mapHandler';
import { InventoryHandler } from './inventoryHandler';
import { EventHandler } from './eventHandler';
import { GameObject } from '../gameobjects/gameObject';

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

  static submitInput(inputStr: string): string {
    if (this.overrideInput === null) {
      let inputStrArr = inputStr.split(" ");
      let command = inputStrArr[0];
      let objs = inputStrArr.splice(1);
      return this.handleCommand(command, objs);
    }
    else {
      return this.overrideInput.func(inputStr);
    }
  }

  private static examineObject(obj: GameObject): string {
    return obj.desc;
  }

  private static takeObject(obj: GameObject): string {
    if (obj.pickupable) {
      InventoryHandler.getInstance().addObject(obj);
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
    if (!InventoryHandler.getInstance().removeObject(obj)) {
      console.error(`Dropped an object that was not in the inventory: {${ obj.id }}`);
    }
    MapHandler.addObject(obj);
    return "Dropped";
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
            if (InventoryHandler.getInstance().size === 0) {
              return "Inventory is empty!";
            }
            else {
              let result = "In your inventory you have:";
              InventoryHandler.getInstance().objectsInInventory.forEach(obj => {
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
            try {
              let obj = InputHandler.getObject(objName);
              if (obj != null) {
                InputHandler.overrideInput = new OverrideInput(InputHandler.useObject, obj);
                return "With what?";
              }
              else {
                // Try splitting it
                if (objName.includes(" with ")) {
                  let objNames = objName.split(" with ");
                  let useObj = InputHandler.getObject(objNames[0]);
                  if (useObj === null) {
                    return `${ useObj } cannot be found`;
                  }
                  InputHandler.overrideInput = new OverrideInput(InputHandler.useObject, useObj);
                  return InputHandler.useObject(objNames[1]);
                }
                return `${ objName } cannot be found`;
              }
            }
            catch (multObj) {
              InputHandler.overrideInput = new OverrideInput(InputHandler.chooseObject, (<MultipleObjects>multObj).objectsFound);
              return InputHandler.multipleObjectsDetectedPrompt(multObj);
            }
          }
        }
    }
    return null;
  }

  private static handleCommand(command: string, objs: Array<string>): string {
    const commandObj = this.getCommandObj(command);
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
      objs = objs.concat(InventoryHandler.getInstance().getObjects(objName));
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
    let context = (<{callback: (obj: GameObject) => string, objs: Array<GameObject>}>InputHandler.overrideInput.data);
    let num = Number(inputStr);
    let result = `${ inputStr } was not a possible choice`
    if (num != NaN && num >= 1 && num <= context.objs.length) {
      result = context.callback(context.objs[num - 1]);
    }
    InputHandler.overrideInput = null;
    return result;
  }

  private static useObject(inputStr: string): string {
    let useObject = (<GameObject>InputHandler.overrideInput.data);
    let withObject = InputHandler.getObject(inputStr); // TODO Handle multiple objects

    let result = `${ inputStr } cannot be found`;
    if (withObject != null) {
      result = EventHandler.runEvent(useObject, withObject);
    }
    InputHandler.overrideInput = null;
    return result;
  }
}