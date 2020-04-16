import "phaser";
import { Room } from '../gameobjects/room';
import { MapHandler } from '../handler/mapHandler';

class MapUI {
  static CAMERA_OFFSET = 150;
  private static BOX_OFFSET = [10, 10];
  private static BOX_HEIGHT = 300;
  private static INFO_BOX_WIDTH = 400;
  private static OBJS_BOX_WIDTH = 300;

  private scene: MapTerminalScene;

  private activated: boolean;
  infoBox: Phaser.GameObjects.Rectangle;
  infoText: Phaser.GameObjects.Text;
  objsBox: Phaser.GameObjects.Rectangle;
  objsText: Phaser.GameObjects.Text;

  constructor(scene: MapTerminalScene) {
    this.scene = scene;
    let newCoords = scene.currRoom.getCenterCoords();
    scene.cameras.main.pan(newCoords[0], newCoords[1] - MapUI.CAMERA_OFFSET, 0, "", true);

    this.activated = true;
    this.infoBox = scene.add.rectangle(scene.cameras.main.x + MapUI.BOX_OFFSET[0],
      scene.cameras.main.y + MapUI.BOX_OFFSET[1], MapUI.INFO_BOX_WIDTH, MapUI.BOX_HEIGHT, 0x222222, 0.9);
    this.infoBox.setOrigin(0, 0);
    this.infoBox.setStrokeStyle(4, 0xffffff);
    this.infoBox.setScrollFactor(0);
    this.objsBox = scene.add.rectangle((scene.cameras.main.x + scene.cameras.main.width) - (MapUI.OBJS_BOX_WIDTH + MapUI.BOX_OFFSET[0]),
      scene.cameras.main.y + MapUI.BOX_OFFSET[1], MapUI.OBJS_BOX_WIDTH, MapUI.BOX_HEIGHT, 0x222222, 0.9);
    this.objsBox.setOrigin(0, 0);
    this.objsBox.setStrokeStyle(4, 0xffffff);
    this.objsBox.setScrollFactor(0);

    const textOffset = 10;
    this.infoText = scene.add.text(this.infoBox.x + textOffset, this.infoBox.y + textOffset, "", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff",
        wordWrap: { width: MapUI.INFO_BOX_WIDTH - (textOffset * 2), useAdvancedWrap: false }
      }
    );
    this.objsText = scene.add.text(this.objsBox.x + textOffset, this.objsBox.y + textOffset, "", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff",
        wordWrap: { width: MapUI.OBJS_BOX_WIDTH - (textOffset * 2), useAdvancedWrap: false }
      }
    );
    this.infoText.setScrollFactor(0);
    this.objsText.setScrollFactor(0);

    this.setRoom(scene.currRoom.room);
  }

  toggleActivated() {
    this.activated = !this.activated;
    let newCoords = this.scene.currRoom.getCenterCoords();
    this.scene.cameras.main.pan(newCoords[0], newCoords[1] - (this.activated ? MapUI.CAMERA_OFFSET : 0),
      200, "Quad.easeInOut", true);
    this.scene.tweens.add({
      targets: [this.infoBox, this.infoText, this.objsBox, this.objsText],
      alpha: (this.activated ? 1 : 0),
      duration: 150,
      ease: "Quad.easeOut"
    });
  }

  getActivated() {
    return this.activated;
  }

  setRoom(room: Room) {
    let infoStr = "???";
    let objsStr = "???";
    if (room.visited) {
      infoStr = room.getRoomInfo(true);
      if (room.objects.size > 0) {
        objsStr = "Items:\n- " + Array.from(room.objects.values()).map(obj => obj.name).join("\n- ");
      }
      else {
        objsStr = "Items:\nNone";
      }
    }
    this.infoText.text = infoStr;
    this.objsText.text = objsStr;
  }
}

class RoomBlock {
  static ROOM_SIZE = [150, 100];
  static roomLinks = new Set<string>();

  coords: [number, number];
  room: Room;

  constructor(scene: Phaser.Scene, id: string) {
    this.room = MapHandler.getRoom(id);
    this.coords = [this.room.mapCoords[0] * RoomBlock.ROOM_SIZE[0] * 2, this.room.mapCoords[1] * RoomBlock.ROOM_SIZE[1] * 2];

    let backgroundColor = 0xdddddd;
    let strokeColor = 0xffffff;
    let textColor = "#ffffff";
    let roomText = this.room.name;
    if (!this.room.visited) {
      backgroundColor = 0x222222;
      strokeColor = 0x888888;
      textColor = "#dddddd";
      roomText = "???";
    }

    let rect = scene.add.rectangle(this.coords[0] + (RoomBlock.ROOM_SIZE[0] / 2), this.coords[1] + (RoomBlock.ROOM_SIZE[1] / 2), RoomBlock.ROOM_SIZE[0], RoomBlock.ROOM_SIZE[1], backgroundColor, 0);
    rect.setStrokeStyle(4, strokeColor, 1);

    const textOffset = 5;
    let textName = scene.add.text(0, 0, roomText, {
      fontSize: 20,
      fontFamily: "Monospace",
      align: "center",
      color: textColor,
      alpha: 0.7,
      wordWrap: { width: RoomBlock.ROOM_SIZE[0] - (textOffset * 2), useAdvancedWrap: true }
    });
    textName.setPosition(this.coords[0] + (RoomBlock.ROOM_SIZE[0] / 2) - (textName.getBounds().width / 2), this.coords[1] + (RoomBlock.ROOM_SIZE[1] / 2) - (textName.getBounds().height / 2));
  }

  getCenterCoords(): [number, number] {
    return [this.coords[0] + (RoomBlock.ROOM_SIZE[0] / 2), this.coords[1] + (RoomBlock.ROOM_SIZE[1] / 2)];
  }

  linkRooms(nextRoom: RoomBlock, scene: Phaser.Scene) {
    let keyCheckArr = [this.room.id, nextRoom.room.id].sort();
    let keyCheck = `{${ keyCheckArr[0] }} {${ keyCheckArr[1] }}`;
    if (!RoomBlock.roomLinks.has(keyCheck)) {
      let startPos = this.room.mapCoords;
      let endPos = nextRoom.room.mapCoords;

      let toDir = this.room.getExitFromId(nextRoom.room.id);
      let fromDir = nextRoom.room.getExitFromId(this.room.id);

      let startCoord = RoomBlock.getExitPoint(toDir, this.coords[0], this.coords[1]);
      let endCoord = RoomBlock.getExitPoint(fromDir, nextRoom.coords[0], nextRoom.coords[1]);

      let graphics = scene.add.graphics();
      let lineColor = 0xffffff;
      if (!this.room.visited || !nextRoom.room.visited) {
        lineColor = 0x888888;
      }
      graphics.lineStyle(4, lineColor);
      graphics.beginPath();
      if (startPos[0] === endPos[0] || startPos[1] === endPos[1]) { // Straight line
        graphics.moveTo(startCoord[0], startCoord[1]);
        graphics.lineTo(endCoord[0], endCoord[1]);
      }
      else { // Curve
        // Step 1: Build curve in top left corner
        let deltaX = Math.abs(startCoord[0] - endCoord[0]);
        let deltaY = Math.abs(startCoord[1] - endCoord[1]);
        graphics.moveTo(0, deltaY);
        graphics.lineTo(0, RoomBlock.ROOM_SIZE[1]);
        graphics.arc(RoomBlock.ROOM_SIZE[1], RoomBlock.ROOM_SIZE[1], RoomBlock.ROOM_SIZE[1], Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270));
        graphics.lineTo(deltaX, 0);

        // Step 2: Prepare curve for moving by translating origin point to line up with start point
        if (toDir % 2 === 0) {
          graphics.translateCanvas(0, -deltaY);
        }
        else {
          graphics.translateCanvas(-deltaX, 0);
        }

        // Step 3: Rotate curve by scaling
        let scale = [1, 1];
        let dirSet = new Set().add(toDir).add(fromDir);
        if (dirSet.has(0) && dirSet.has(1)) {
          scale = [-1, 1];
        }
        else if (dirSet.has(1) && dirSet.has(2)) {
          scale = [-1, -1];
        }
        else if (dirSet.has(2) && dirSet.has(3)) {
          scale = [1, -1];
        }
        if (dirSet.has(3) && dirSet.has(0)) {
          scale = [1, 1];
        }
        graphics.setScale(scale[0], scale[1]);

        // Step 4: Translate canvas to line curve up with start point
        graphics.translateCanvas(startCoord[0] * scale[0], startCoord[1] * scale[1]);
      }
      graphics.strokePath();

      RoomBlock.roomLinks.add(keyCheck);
    }
  }

  static getExitPoint(exit: number, x: number, y: number): [number, number] {
    switch (exit) {
      case 0:
        return [x + (RoomBlock.ROOM_SIZE[0] / 2), y];
      case 1:
        return [x + RoomBlock.ROOM_SIZE[0], y + (RoomBlock.ROOM_SIZE[1] / 2)];
      case 2:
        return [x + (RoomBlock.ROOM_SIZE[0] / 2), y + RoomBlock.ROOM_SIZE[1]];
      case 3:
        return [x, y + (RoomBlock.ROOM_SIZE[1] / 2)];
    }
    return null;
  }
}

export class MapTerminalScene extends Phaser.Scene {
  currRoom: RoomBlock;
  roomMap: Map<string, RoomBlock>

  currRoomBox: Phaser.GameObjects.Rectangle;

  mapUI: MapUI;

  constructor() {
    super({
      key: "MapTerminalScene"
    });
  }

  /**
   * Loads the images
   */
  preload() {
    this.load.image("terminalScreen", 'assets/img/terminal-screen.png');
  }

  /**
   * Set up all game assets shown to user and adds functionality
   */
  create() {
    /*************************
     * Set up the background *
     *************************/
    let background = this.add.image(0, 0, "terminalScreen");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    background.setScrollFactor(0);

    this.debugVisitRooms();
    this.setupRooms();
    let currRoomCoords = this.currRoom.getCenterCoords();
    this.cameras.main.centerOn(currRoomCoords[0], currRoomCoords[1]);
    this.currRoomBox = this.add.rectangle(currRoomCoords[0], currRoomCoords[1],
      RoomBlock.ROOM_SIZE[0] + 20, RoomBlock.ROOM_SIZE[1] + 20, 0xdddddd, 0.3);
    this.currRoomBox.setStrokeStyle(4, 0xffffff);

    this.input.keyboard.on('keydown', this.onKeyDown, this);

    this.mapUI = new MapUI(this);
  }

  private debugVisitRooms() {
    if (MapHandler.instanceName === "voyage") {
      MapHandler.getRoom("room_drone").setVisited(true);
      MapHandler.getRoom("room_chambers").setVisited(true);
      MapHandler.getRoom("room_lodging").setVisited(true);
      MapHandler.getRoom("room_lodging").setVisited(true);
      MapHandler.getRoom("room_engine").setVisited(true);
      MapHandler.movePlayer(0);
    }
    else if (MapHandler.instanceName === "testing") {
      MapHandler.getRoom("rm_start").setVisited(true);
      MapHandler.getRoom("rm_use_test_1").setVisited(true);
      MapHandler.getRoom("rm_bottom_left").setVisited(true);
      MapHandler.movePlayer(3);
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 27: // Escape
        this.scene.remove("MapTerminalScene");
        break;
      case 32: // Space
        this.mapUI.toggleActivated();
        break;
      case 37: // Left
        this.moveCurrRoom(3);
        break;
      case 38: // Up
        this.moveCurrRoom(0);
        break;
      case 39: // Right
        this.moveCurrRoom(1);
        break;
      case 40: // Down
        this.moveCurrRoom(2);
        break;
      default:
    }
  }

  private moveCurrRoom(dir: number) {
    if (this.currRoom.room.exits[dir][0] != "") {
      this.currRoom = this.roomMap.get(this.currRoom.room.exits[dir][0]);
      let newCoords = this.currRoom.getCenterCoords();
      this.cameras.main.pan(newCoords[0], newCoords[1] - (this.mapUI.getActivated() ? MapUI.CAMERA_OFFSET : 0), 200, "Quad.easeInOut", true);
      this.tweens.add({
        targets: this.currRoomBox,
        duration: 150,
        x: newCoords[0],
        y: newCoords[1],
        ease: "Quad.easeOut"
      });
      this.mapUI.setRoom(this.currRoom.room);
    }
  }

  private setupRooms() {
    this.roomMap = new Map<string, RoomBlock>();
    let startingId = MapHandler.getGameMap().playerPos;
    this.createRoom(startingId);
    this.currRoom = this.roomMap.get(startingId);
  }

  createRoom(id: string): RoomBlock {
    if (!this.roomMap.has(id)) {
      const room = new RoomBlock(this, id);
      this.roomMap.set(id, room);

      room.room.exits.forEach((exit, i) => {
        if (exit[0] != "") {
          let nextRoom = this.createRoom(exit[0]);
          if (nextRoom != null) {
            room.linkRooms(nextRoom, this);
          }
        }
      });

      return room;
    }
    else {
      return this.roomMap.get(id);
    }
  }
};
