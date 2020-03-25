import { MapHandler } from './mapHandler';
import { InventoryHandler } from './inventoryHandler';
import { GameObject } from '../gameobjects/gameObject';

class MultipleObjects extends Error {
  objectsFound: Array<GameObject>;

  constructor(objects: Array<GameObject>) {
    super();
    this.objectsFound = objects;
  }
}

class OverrideInputContext {
  command: string;
  data: any;

  constructor(command: string, data: any) {
    this.command = command;
    this.data = data;
  }
}

enum ObjectLocation {
  MAP,
  INVENTORY
}

export class InputHandler {
  static overrideInputFunc: (inputStr: string) => string = null;
  static overrideInputContext: OverrideInputContext;

  static submitInput(inputStr: string): string {
    if (this.overrideInputFunc === null) {
      let inputStrArr = inputStr.split(" ");
      let command = inputStrArr[0];
      let objs = inputStrArr.splice(1);
      return this.handleCommand(command, objs);
    }
    else {
      return this.overrideInputFunc(inputStr);
    }
  }

  private static validCommands = {
    "examine": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        if (objs.length === 0) {
          return MapHandler.getCurrRoomInfo(true);
        }
        let objName = objs.join(" ");
        try {
          let obj = InputHandler.getObject(objName);
          if (obj != null) {
            return obj.desc;
          }
          else {
            return `${ objName } cannot be found`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInputFunc = InputHandler.chooseObject;
          InputHandler.overrideInputContext = new OverrideInputContext("examine", (<MultipleObjects>multObj).objectsFound);
          let prompt = "Which one? (Choose number)";
          (<MultipleObjects>multObj).objectsFound.forEach((obj, i) => {
            prompt += `\n${ i + 1 }. ${ obj.name }`;
          });
          return prompt;
        }
      }
    },

    "go": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
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
    },

    "take": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        let objName = objs.join(" ");
        try {
          let obj = InputHandler.getObject(objName, [ObjectLocation.INVENTORY]);
          if (obj != null) {
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
          else {
            return `${ objName } cannot be found`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInputFunc = InputHandler.chooseObject;
          InputHandler.overrideInputContext = new OverrideInputContext("take", (<MultipleObjects>multObj).objectsFound);
          let prompt = "Which one? (Choose number)";
          (<MultipleObjects>multObj).objectsFound.forEach((obj, i) => {
            prompt += `\n${ i + 1 }. ${ obj.name }`;
          });
          return prompt;
        }
      }
    },

    "drop": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        let objName = objs.join(" ");
        try {
          let obj = InputHandler.getObject(objName, [ObjectLocation.MAP]);
          if (obj != null) {
            if (!InventoryHandler.getInstance().removeObject(obj)) {
              console.error(`Dropped an object that was not in the inventory: {${ obj.id }}`);
            }
            MapHandler.addObject(obj);
            return "Dropped";
          }
          else {
            return `${ objName } is not in your inventory`;
          }
        }
        catch (multObj) {
          InputHandler.overrideInputFunc = InputHandler.chooseObject;
          InputHandler.overrideInputContext = new OverrideInputContext("take", (<MultipleObjects>multObj).objectsFound);
          let prompt = "Which one? (Choose number)";
          (<MultipleObjects>multObj).objectsFound.forEach((obj, i) => {
            prompt += `\n${ i + 1 }. ${ obj.name }`;
          });
          return prompt;
        }
      }
    },

    "inventory": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
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
  };

  private static handleCommand(command: string, objs: Array<string>): string {
    if (command in this.validCommands) {
      const cmdObj = this.validCommands[command];
      if (cmdObj.validate(objs)) {
        return cmdObj.execute(objs);
      }
      return `Error, invalid use of the command ${ command }`;
    }
    return "Command not recognized"
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
    let objects = (<Array<GameObject>>InputHandler.overrideInputContext.data);
    let num = Number(inputStr);
    let result = `${ inputStr } was not a possible choice`
    if (num != NaN && num >= 1 && num <= objects.length) {
      switch (InputHandler.overrideInputContext.command) {
        // TODO Put these in seperate functions so that code does not have to be copied
        case "examine":
          result = objects[num - 1].desc;
          break;
        case "take":
          if (objects[num - 1].pickupable) {
            InventoryHandler.getInstance().addObject(objects[num - 1]);
            if (!MapHandler.removeObject(objects[num - 1])) {
              console.error(`Removed an object from the map that did not exist on the map: {${ objects[num - 1].id }}`);
            }
            result = "Taken";
          }
          else {
            result = `${ objects[num - 1].name } cannot be moved!`;
          }
          break;
        case "drop":
          if (!InventoryHandler.getInstance().removeObject(objects[num - 1])) {
            console.error(`Dropped an object that was not in the inventory: {${ objects[num - 1].id }}`);
          }
          MapHandler.addObject(objects[num - 1]);
          result = "Dropped";
          break;
      }
    }
    InputHandler.overrideInputFunc = null;
    InputHandler.overrideInputContext = null;
    return result
  }
}