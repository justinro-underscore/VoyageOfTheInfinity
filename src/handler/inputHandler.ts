export class InputHandler {
  static submitInput(inputStr: string): string {
    let inputStrArr = inputStr.split(" ");
    let command = inputStrArr[0];
    let objs = inputStrArr.splice(1);
    return this.handleCommand(command, objs);
  }

  private static handleCommand(command: string, objs: Array<string>): string {
    switch (command) {
      case "examine":
        if (objs.length === 0) {
          return "Looking around the room";
        }
        let obj = objs.join(" ");
        return `That is a ${ obj }`;
      case "go":
        let dir = objs[0];
        return `Moving player in the ${ dir } direction`;
      case "use":
        obj = objs.join(" ");
        return `Using the ${ obj }`;
      case "take":
        obj = objs.join(" ");
        return `Taking ${ obj }`;
      case "drop":
        obj = objs.join(" ");
        return `Dropping ${ obj }`;
      case "inventory":
        return "Looking at inventory";
      default:
        return "Sorry, I didn't get that";
    }
  }
}