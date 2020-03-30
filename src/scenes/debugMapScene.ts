import "phaser";
import { GameMap } from '../gameobjects/gameMap';
import { MapHandler } from '../handler/mapHandler';

// Defines the number of exits each room has
const NUM_EXITS = 4;

/**
 * Defines the look of the room in the scene
 */
class DebugMapRoom {
  box: Phaser.GameObjects.Image; // The box containing all room info
  lines: Array<Phaser.GameObjects.Image>; // Lines representing the exits
  roomExits: Array<Phaser.GameObjects.Text>; // Text containing the names for the exits [North, East, South, West]
  roomInfo: Phaser.GameObjects.Text; // Text containing the info for the room
  gameMap: GameMap; // Reference to the game map

  /**
   * Creates a blank new room object to showcase debug information
   * @param x X value of the top left corner of the room box
   * @param y Y value of the top left corner of the room box
   * @param scene A reference to the scene this resides in
   */
  constructor(x: number, y: number, scene: DebugMapScene) {
    this.box = scene.add.image(x, y, 'box');

    // Create the exits
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

    // Set the room info
    this.roomInfo = scene.add.text(x - 290, y - 190, "", {
      fontSize: 20,
      fontFamily: 'Arial',
      align: "left",
      color: "#000000",
      wordWrap: { width: 580, useAdvancedWrap: false }
    });

    // Set the game map reference
    this.gameMap = scene.gameMap;
  }

  /**
   * Sets all of the information on this room object to the room with ID roomID
   * @param roomID ID of the room that this object represents, empty string if representing no room
   */
  setRoom(roomID: string) {
    if (roomID != "") { // If this room actually exists...
      let room = this.gameMap.rooms.get(roomID); // Reference to the current room

      // Defines what text is shown inside the box
      let text = room.id + " - " + room.name + "\n\n" + room.desc + "\n\n" + "Objects: ";
      room.objects.forEach(obj => {
        text += "\n" + (obj.pickupable ? "+" : "-") + " {" + obj.id + "} " + obj.name + " => " + obj.desc;
      })
      this.roomInfo.setText(text);

      // Populates the room exits
      room.exits.forEach((id, i) => {
        if (id != "") { // If the exit exists...
          this.lines[i].setAlpha(1); // Make sure the exit line is visible
          let exitRoom = this.gameMap.rooms.get(id);
          text = exitRoom.id + " - " + exitRoom.name;
          this.roomExits[i].setText(text);
        }
        else { // If the exit doesn't exist, hide the room exit line
          this.lines[i].setAlpha(0);
          this.roomExits[i].setText("");
        }
      })
    }
    else { // If the room doesn't exist, hide the room exit lines
      this.lines.forEach((line) => line.setAlpha(0));
      this.roomExits.forEach((exit) => exit.setText(""));
    }
  }
}

/**
 * Defines how many rooms should be shown onscreen at one time
 * We only show 5 rooms: Current room, and the rooms to the north, east, south, and west of the current room
 * After we move rooms, reset the currently shown rooms to reflect the information
 */
const NUM_ROOMS_SHOWN = 5;

// Defines how long the panning takes to move between rooms
const PAN_TIME = 500;

/**
 * Defines the debug map scene, a scene that the developers can use to debug the rooms of the game
 * The Debug Map Scene can showcase any information about the rooms, including name, ID, exits, objects, description, etc.
 */
export class DebugMapScene extends Phaser.Scene {
  gameMap: GameMap; // Reference to the current game map
  rooms: Array<DebugMapRoom>; // References to all of the rooms onscreen (should be of length NUM_ROOMS_SHOWN)
  panning = false; // Defines if we are currently moving the camera (reject all input)

  constructor() {
    super({
      key: "DebugMapScene"
    });
  }

  /**
   * Load the images and set the gameMap reference
   */
  preload() {
    this.load.image('line', 'assets/img/debug/debug-black-line.png');
    this.load.image('box', 'assets/img/debug/debug-room.png');
    this.gameMap = MapHandler.getGameMap();
  }

  /**
   * Set up all game assets shown to user and add functionality
   */
  create() {
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => this.onKeyInput(event), this);
    this.cameras.main.setBackgroundColor("#eeeeee");

    // Create the rooms
    this.rooms = new Array<DebugMapRoom>(NUM_ROOMS_SHOWN);
    this.rooms[0] = new DebugMapRoom(400, 300, this);
    this.rooms[1] = new DebugMapRoom(400, -300, this);
    this.rooms[2] = new DebugMapRoom(1200, 300, this);
    this.rooms[3] = new DebugMapRoom(400, 900, this);
    this.rooms[4] = new DebugMapRoom(-400, 300, this);

    // Set all rooms' information
    this.setRooms();
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Defines what happens when a key is input
   * Only function is moving between rooms. W moves up, D moves right, S moves down, A moves left (same goes for arrow keys)
   * @param keyEvent The keyboard event that calls this function
   */
  private onKeyInput(keyEvent: KeyboardEvent) {
    let dir = -1; // Defines what direction to go {0: N, 1: E, 2: S, 3: W}
    switch (keyEvent.keyCode) {
      case 87: // w
      case 38: // arrow up
        dir = 0;
        break;
      case 68: // d
      case 39: // arrow right
        dir = 1;
        break;
      case 83: // s
      case 40: // arrow down
        dir = 2;
        break;
      case 65: // a
      case 37: // arrow left
        dir = 3;
        break;
    }

    // If we can move in this direction... (If direction is valid, we are not panning, and there is an exit in the desired direction)
    if (dir != -1 && !this.panning && this.gameMap.rooms.get(this.gameMap.playerPos).exits[dir] != "") {
      // Pan the camera to the direction
      switch(dir) {
        case 0:
          this.cameras.main.pan(400, -300, PAN_TIME);
          break;
        case 1:
          this.cameras.main.pan(1200, 300, PAN_TIME);
          break;
        case 2:
          this.cameras.main.pan(400, 900, PAN_TIME);
          break;
        case 3:
          this.cameras.main.pan(-400, 300, PAN_TIME);
          break;
      }
      this.panning = true;
      this.time.delayedCall(PAN_TIME, () => { // Define what to do after the pan is complete
        MapHandler.movePlayer(dir); // Move the "player" (define the new current room)
        this.setRooms(); // Reset the 5 rooms shown to reflect the current room
        this.cameras.main.centerOn(400, 300); // Move the camera back to the center room
        this.panning = false; // Stop panning
      });
    }
  }

  /**
   * Sets the 5 rooms that are shown at one time
   */
  private setRooms() {
    this.rooms[0].setRoom(this.gameMap.playerPos);
    this.gameMap.rooms.get(this.gameMap.playerPos).exits.forEach((id, i) => this.rooms[i + 1].setRoom(id));
  }
};
