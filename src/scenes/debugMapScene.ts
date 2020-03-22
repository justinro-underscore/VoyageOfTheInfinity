import "phaser";
import { GameMap } from '../gameobjects/gameMap';
import { MapHandler } from '../handler/mapHandler';

const NUM_EXITS = 4;

class DebugMapRoom {
  box: Phaser.GameObjects.Image;
  lines: Array<Phaser.GameObjects.Image>;
  roomExits: Array<Phaser.GameObjects.Text>;
  roomInfo: Phaser.GameObjects.Text;
  gameMap: GameMap;

  constructor(x: number, y: number, scene: DebugMapScene) {
    this.box = scene.add.image(x, y, 'box');
    this.lines = new Array<Phaser.GameObjects.Image>(NUM_EXITS);
    this.lines[0] = scene.add.image(x, y - 300, 'line').setAngle(90);
    this.lines[1] = scene.add.image(x + 400, y, 'line');
    this.lines[2] = scene.add.image(x, y + 300, 'line').setAngle(90);
    this.lines[3] = scene.add.image(x - 400, y, 'line');
    this.roomExits = new Array<Phaser.GameObjects.Text>(NUM_EXITS);
    this.roomExits[0] = scene.add.text(x + 10, y - 290, "",
    { font: '20px Arial', fill: '#000000' });
    this.roomExits[1] = scene.add.text(x + 390, y + 10, "",
    { font: '20px Arial', fill: '#000000' }).setAngle(90);
    this.roomExits[2] = scene.add.text(x + 10, y + 270, "",
    { font: '20px Arial', fill: '#000000' });
    this.roomExits[3] = scene.add.text(x - 390, y - 10, "",
    { font: '20px Arial', fill: '#000000' }).setAngle(270);

    this.roomInfo = scene.add.text(x - 290, y - 190, "", {
      fontSize: 20,
      fontFamily: 'Arial',
      align: "left",
      color: "#000000",
      wordWrap: { width: 580, useAdvancedWrap: true }
    });

    this.gameMap = scene.gameMap;
  }

  setRoom(roomID: string) {
    if (roomID != "") {
      let room = this.gameMap.rooms.get(roomID);
      let text = room.id + " - " + room.name + "\n\n" + room.desc;
      this.roomInfo.setText(text);
      room.exits.forEach((id, i) => {
        if (id != "") {
          this.lines[i].setAlpha(1);
          let exitRoom = this.gameMap.rooms.get(id);
          text = exitRoom.id + " - " + exitRoom.name;
          this.roomExits[i].setText(text);
        }
        else {
          this.lines[i].setAlpha(0);
          this.roomExits[i].setText("");
        }
      })
    }
    else {
      this.lines.forEach((line) => line.setAlpha(0));
      this.roomExits.forEach((exit) => exit.setText(""));
    }
  }
}

const NUM_ROOMS_SHOWN = 5;

export class DebugMapScene extends Phaser.Scene {
  gameMap: GameMap;
  rooms: Array<DebugMapRoom>;
  panning = false;

  constructor() {
    super({
      key: "DebugMapScene"
    });
  }

  preload() {
    this.load.image('line', 'assets/img/debug/debug-black-line.png');
    this.load.image('box', 'assets/img/debug/debug-room.png');
    this.gameMap = MapHandler.getGameMap();
  }

  create() {
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);
    this.cameras.main.setBackgroundColor("#eeeeee");

    this.rooms = new Array<DebugMapRoom>(NUM_ROOMS_SHOWN);
    this.rooms[0] = new DebugMapRoom(400, 300, this);
    this.rooms[1] = new DebugMapRoom(400, -300, this);
    this.rooms[2] = new DebugMapRoom(1200, 300, this);
    this.rooms[3] = new DebugMapRoom(400, 900, this);
    this.rooms[4] = new DebugMapRoom(-400, 300, this);

    this.setRooms();
  }

  /*
    PRIVATE METHODS
  */

  // Defines the functionality of keyboard events
  private onKeyInput(keyEvent: KeyboardEvent) {
    const panTime = 500;
    let dir = -1;
    switch (keyEvent.keyCode) {
      case 87: // w
      case 38: // arrow up
        dir = 0;
        break;
      case 68: // e
      case 39: // arrow right
        dir = 1;
        break;
      case 83: // s
      case 40: // arrow down
        dir = 2;
        break;
      case 65: // e
      case 37: // arrow left
        dir = 3;
        break;
    }
    if (dir != -1 && !this.panning && this.gameMap.rooms.get(this.gameMap.playerPos).exits[dir] != "") {
      switch(dir) {
        case 0:
          this.cameras.main.pan(400, -300, panTime);
          break;
        case 1:
          this.cameras.main.pan(1200, 300, panTime);
          break;
        case 2:
          this.cameras.main.pan(400, 900, panTime);
          break;
        case 3:
          this.cameras.main.pan(-400, 300, panTime);
          break;
      }
      this.panning = true;
      this.time.delayedCall(panTime, () => {
        MapHandler.movePlayer(dir);
        this.setRooms();
        this.cameras.main.centerOn(400, 300);
        this.panning = false;
      });
    }
  }

  private setRooms() {
    this.rooms[0].setRoom(this.gameMap.playerPos);
    this.gameMap.rooms.get(this.gameMap.playerPos).exits.forEach((id, i) => this.rooms[i + 1].setRoom(id));
  }
};
