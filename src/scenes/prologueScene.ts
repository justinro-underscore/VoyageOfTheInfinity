import "phaser";

// The amount of ticks between when the cursor blinks
const textTimeDelta = 30;

export class PrologueScene extends Phaser.Scene {
  linesDisplayHTML: Element;

  prologueData: any;
  currDataPointer = 0;
  currHtmlLinePointer = 0;
  currLineCharPointer = 0;

  currTextTimeDelta = textTimeDelta;
  lastTextTime = 0;

  readyToContinue = false;

  constructor() {
    super({
      key: "PrologueScene"
    });
  }

  preload() {
    this.load.html('terminal', 'assets/html/terminal.html');
    this.load.json('prologueData', 'assets/story/prologue.json');
  }

  create() {
    let terminal = this.add.dom(400, 280).createFromCache('terminal');
    this.linesDisplayHTML = terminal.getChildByID("lines-display");
    terminal.getChildByID("first-line").innerHTML = "Terminal 1";

    this.prologueData = this.cache.json.get('prologueData');

    this.input.keyboard.on('keydown', function (event: KeyboardEvent) {
      if (event.keyCode === 32) {
        this.scene.start("TerminalScene");
      }
    }, this);
  }

  update(time: number) {
    let diff = time - this.lastTextTime;
    if (!this.readyToContinue && diff > this.currTextTimeDelta) {
      this.updateLine();
      this.lastTextTime = time;
    }
  }

  /*
    PRIVATE METHODS
  */

  private updateLine() {
    this.currTextTimeDelta = textTimeDelta;
    let line: Element = document.getElementById("line-" + this.currHtmlLinePointer);
    if (line != undefined) {
      if (line.children.length > 0) {
        line = line.children[line.children.length - 1];
      }

      let currLineObj = this.prologueData.lines[this.currDataPointer];
      if (this.currLineCharPointer != currLineObj.text.length) {
        let nextChar = currLineObj.text.charAt(this.currLineCharPointer);
        if (nextChar === ' ') {
          this.currLineCharPointer += 1;
          nextChar += currLineObj.text.charAt(this.currLineCharPointer);
        }
        line.innerHTML += nextChar;
        this.currLineCharPointer += 1;
      }
      else {
        this.currDataPointer += 1;
        if (this.currDataPointer === this.prologueData.lines.length) {
          this.readyToContinue = true;
        }
        else {
          this.currTextTimeDelta = (currLineObj.wait * 1000);
          this.currLineCharPointer = 0;
          if (currLineObj.newline) {
            this.currHtmlLinePointer += 1;
          }
          else {
            let newColor = document.createElement("span");
            newColor.setAttribute("name", "new-color");
            newColor.setAttribute("style", "color: " + this.prologueData.colors[this.prologueData.lines[this.currDataPointer].color]);
            (line.getAttribute("id") != undefined ? line : line.parentElement).appendChild(newColor);
          }
        }
      }
    }
    else {
      let newLine = document.createElement("p");
      newLine.setAttribute("id", "line-" + this.currHtmlLinePointer);
      newLine.setAttribute("style", "color: " + this.prologueData.colors[this.prologueData.lines[this.currDataPointer].color]);
      this.linesDisplayHTML.appendChild(newLine);
      this.updateLine();
    }
  }
};
