import { MapHandler } from './mapHandler';

export class InputHandler {
  static submitInput(inputStr: string): string {
    let inputStrArr = inputStr.split(" ");
    let command = inputStrArr[0];
    let objs = inputStrArr.splice(1);
    return this.handleCommand(command, objs);
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
        return `That is a ${ obj }`;
      }
    },

    "go": {
      "validate": (objs: Array<string>): boolean => {
        return true;
      },
      "execute": (objs: Array<string>): string => {
        let dir = objs[0];
        return `Moving player in the ${ dir } direction`;
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
}