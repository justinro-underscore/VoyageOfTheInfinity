import { MapHandler } from './mapHandler';
import { MultipleObjects } from '../gameobjects/gameMap';
import { GameObject } from '../gameobjects/gameObject';

export class InputHandler {
  static overrideInputFunc: (inputStr: string) => string = null;
  static overrideInputContext: any;

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
        let obj = objs.join(" ");
        try {
          return MapHandler.examineObj(obj);
        }
        catch (objs) {
          InputHandler.overrideInputFunc = InputHandler.chooseObject;
          InputHandler.overrideInputContext = (<MultipleObjects>objs).objectsFound;
          let prompt = "Which one? (Choose number)";
          (<MultipleObjects>objs).objectsFound.forEach((obj, i) => {
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
        let obj = objs.join(" ");
        return `Taking ${ obj }`;
      }
    },

    "drop": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        let obj = objs.join(" ");
        return `Dropping ${ obj }`;
      }
    },

    "inventory": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        return "Looking at inventory";
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

  private static chooseObject(inputStr: string): string {
    let objects = (<Array<GameObject>>InputHandler.overrideInputContext)
    let num = Number(inputStr);
    let result = `${ inputStr } was not a possible choice`
    if (num != NaN && num >= 1 && num <= objects.length) {
      result = objects[num - 1].desc;
    }
    InputHandler.overrideInputFunc = null;
    InputHandler.overrideInputContext = null;
    return result
  }
}