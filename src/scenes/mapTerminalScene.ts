import "phaser";
import { Room, RoomExitStatus } from '../gameobjects/room';
import { MapHandler } from '../handler/mapHandler';

/**
 * Defines the user interface for the map
 */
class MapUI {
  static CAMERA_OFFSET = 150; // Defines how far up the camera should move when the UI is activated
  private static BOX_OFFSET = [10, 10]; // Defines how far from the sides of the screen the two main boxes should be [x, y]
  private static BOX_HEIGHT = 300; // Defines the height of the main boxes
  private static INFO_BOX_WIDTH = 400; // Defines the width of the info box
  private static OBJS_BOX_WIDTH = 300; // Defines the width of the objects box
  private static MAIN_BOX_OFFSET = 10; // Defines how far from the sides of the box the text should be in the main boxes
  private static INSTRUCT_OFFSET = 15; // Defines how far from the sides of the screen the instructions should be (x y are the same)
  private static INSTRUCT_BOX_OFFSET = 5; // Defines how far from the text the sides of the instruction box should be

  private scene: MapTerminalScene; // A reference to the scene we are building the UI in

  private activated: boolean; // Defines if the UI is showing or not
  // Shows the information of the room
  infoBox: Phaser.GameObjects.Rectangle;
  infoText: Phaser.GameObjects.Text;
  // Shows the objects that are in the room
  objsBox: Phaser.GameObjects.Rectangle;
  objsText: Phaser.GameObjects.Text;
  // Shows the instruction of how to return to the terminal
  escBox: Phaser.GameObjects.Rectangle;
  escText: Phaser.GameObjects.Text;
  // Shows the instruction of how to toggle the UI
  spaceBox: Phaser.GameObjects.Rectangle;
  spaceText: Phaser.GameObjects.Text;

  /**
   * Constructs the UI
   * @param scene The scene this block is being created in
   * @param activated Defines if the UI should start activated or not
   */
  constructor(scene: MapTerminalScene, activated: boolean=true) {
    this.scene = scene;
    // Move the camera to center on the current room
    let newCoords = scene.currRoom.getCenterCoords();
    scene.cameras.main.pan(newCoords[0], newCoords[1] - MapUI.CAMERA_OFFSET, 0, "", true);

    // Start activated (cannot instantiate the objects as invisible)
    this.activated = true;

    /*****************************************
     *               INFO BOX                *
     * Tells user information about the room *
     *****************************************/
    this.infoBox = scene.add.rectangle(scene.cameras.main.x + MapUI.BOX_OFFSET[0],
      scene.cameras.main.y + MapUI.BOX_OFFSET[1], MapUI.INFO_BOX_WIDTH, MapUI.BOX_HEIGHT, 0x222222, 0.9);
    this.infoBox.setOrigin(0, 0);
    this.infoBox.setStrokeStyle(4, 0xffffff);
    this.infoText = scene.add.text(this.infoBox.x + MapUI.MAIN_BOX_OFFSET, this.infoBox.y + MapUI.MAIN_BOX_OFFSET, "", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff",
        wordWrap: { width: MapUI.INFO_BOX_WIDTH - (MapUI.MAIN_BOX_OFFSET * 2), useAdvancedWrap: false }
      }
    );
    this.infoBox.setScrollFactor(0);
    this.infoBox.setDepth(20);
    this.infoText.setScrollFactor(0);
    this.infoText.setDepth(21);

    /****************************************************
     *                    OBJECTS BOX                   *
     * Tells user information about objects in the room *
     ****************************************************/
    this.objsBox = scene.add.rectangle((scene.cameras.main.x + scene.cameras.main.width) - (MapUI.OBJS_BOX_WIDTH + MapUI.BOX_OFFSET[0]),
      scene.cameras.main.y + MapUI.BOX_OFFSET[1], MapUI.OBJS_BOX_WIDTH, MapUI.BOX_HEIGHT, 0x222222, 0.9);
    this.objsBox.setOrigin(0, 0);
    this.objsBox.setStrokeStyle(4, 0xffffff);
    this.objsText = scene.add.text(this.objsBox.x + MapUI.MAIN_BOX_OFFSET, this.objsBox.y + MapUI.MAIN_BOX_OFFSET, "", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff",
        wordWrap: { width: MapUI.OBJS_BOX_WIDTH - (MapUI.MAIN_BOX_OFFSET * 2), useAdvancedWrap: false }
      }
    );
    this.objsBox.setScrollFactor(0);
    this.objsBox.setDepth(20);
    this.objsText.setScrollFactor(0);
    this.objsText.setDepth(21);

    /**************************************
     *         SPACE INSTRUCTION          *
     * Tells user how to hide/show the UI *
     **************************************/
    // Start with only "space" to surround that word in the box
    this.spaceText = scene.add.text(0, 0, "Space", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff"
      }
    );
    this.spaceText.setPosition(scene.cameras.main.x + MapUI.INSTRUCT_OFFSET,
      scene.cameras.main.y + scene.cameras.main.height - (this.spaceText.height + MapUI.INSTRUCT_OFFSET));
    this.spaceBox = scene.add.rectangle(this.spaceText.x - MapUI.INSTRUCT_BOX_OFFSET, this.spaceText.y - MapUI.INSTRUCT_BOX_OFFSET,
      this.spaceText.width + (2 * MapUI.INSTRUCT_BOX_OFFSET), this.spaceText.height + (2 * MapUI.INSTRUCT_BOX_OFFSET), 0x444444, 0.5);
    this.spaceBox.setOrigin(0, 0);
    this.spaceBox.setStrokeStyle(3, 0xffffff);
    this.spaceText.text = "Space to hide UI"; // Once box has been made, then set text to full statement
    this.spaceBox.setScrollFactor(0);
    this.spaceBox.setDepth(20);
    this.spaceText.setScrollFactor(0);
    this.spaceText.setDepth(21);

    /****************************************
     *           ESCAPE INSTRUCTION         *
     * Tells user how to return to terminal *
     ****************************************/
    // Start with full statement to position element at bottom right corner of screen
    this.escText = scene.add.text(0, 0, "Esc to return to terminal", {
        fontSize: 20,
        fontFamily: "Monospace",
        align: "left",
        color: "#ffffff"
      }
    );
    this.escText.setPosition(scene.cameras.main.x + scene.cameras.main.width - (this.escText.width + MapUI.INSTRUCT_OFFSET),
      scene.cameras.main.y + scene.cameras.main.height - (this.escText.height + MapUI.INSTRUCT_OFFSET));
    this.escText.text = "Esc"; // Once position has been set, set text to "Esc" so box only surrounds that text
    this.escBox = scene.add.rectangle(this.escText.x - MapUI.INSTRUCT_BOX_OFFSET, this.escText.y - MapUI.INSTRUCT_BOX_OFFSET,
      this.escText.width + (2 * MapUI.INSTRUCT_BOX_OFFSET), this.escText.height + (2 * MapUI.INSTRUCT_BOX_OFFSET), 0x444444, 0.5);
    this.escBox.setOrigin(0, 0);
    this.escBox.setStrokeStyle(3, 0xffffff);
    this.escText.text = "Esc to return to terminal"; // Once box has been made, then set text to full statement
    this.escBox.setScrollFactor(0);
    this.escBox.setDepth(20);
    this.escText.setScrollFactor(0);
    this.escText.setDepth(21);

    // Set the UI to the current room's info
    this.setRoom(scene.currRoom.room);

    // If we want to start deactivated, immediately toggle the UI
    if (!activated) {
      this.toggleActivated(true);
    }
  }

  /**
   * Shows / hides the UI depending on what state it is currently in
   * @param immediate If true, skip animations
   */
  toggleActivated(immediate: boolean=false) {
    this.activated = !this.activated;

    // Move the camera
    let newCoords = this.scene.currRoom.getCenterCoords();
    this.scene.cameras.main.pan(newCoords[0], newCoords[1] - (this.activated ? MapUI.CAMERA_OFFSET : 0),
      (immediate ? 0 : 200), "Quad.easeInOut", true);
    // Either hide or show all elements (except for space instruction)
    this.scene.tweens.add({
      targets: [this.infoBox, this.infoText, this.objsBox, this.objsText, this.escBox, this.escText],
      alpha: (this.activated ? 1 : 0),
      duration: (immediate ? 0 : 150),
      ease: "Quad.easeOut"
    });

    // Change space instruction's text to reflect how to reverse toggle
    if (this.activated) {
      this.spaceText.text = this.spaceText.text.replace("show", "hide");
    }
    else {
      this.spaceText.text = this.spaceText.text.replace("hide", "show");
    }
  }

  /**
   * Returns the activated state of the UI
   * @returns If true, the UI is activated and visible
   */
  getActivated() {
    return this.activated;
  }

  /**
   * Sets the UI's information to a specific room
   * @param room The room object to set the UI information to
   */
  setRoom(room: Room) {
    // If room is not visited, we will not show any details
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

/**
 * Defines a single room instance on the map
 */
class RoomBlock {
  static ROOM_SIZE = [150, 100]; // Defines how large a room box should be [width, hieght]
  static roomLinks: Set<string>; // Set of all the room links that have been made (so we have no repeats)
                                 // Room links stored as "{room 1 id} {room 2 id}", where 1 & 2 are in alphabetical order

  coords: [number, number]; // The top left coordinates of the room [x, y]
  room: Room; // The reference to which Room object this represents

  /**
   * Creates a new room block given a room ID
   * @param scene The scene this block is being created in
   * @param id The ID of the room this block is referencing
   */
  constructor(scene: Phaser.Scene, id: string) {
    // Sets the room reference
    this.room = MapHandler.getRoom(id);
    // Sets the room's coordinates based on the map coordinates of the room
    this.coords = [this.room.mapCoords[0] * RoomBlock.ROOM_SIZE[0] * 2, this.room.mapCoords[1] * RoomBlock.ROOM_SIZE[1] * 2];

    // Define room colors and text
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

    // Create the room block
    let rect = scene.add.rectangle(this.coords[0] + (RoomBlock.ROOM_SIZE[0] / 2), this.coords[1] + (RoomBlock.ROOM_SIZE[1] / 2), RoomBlock.ROOM_SIZE[0], RoomBlock.ROOM_SIZE[1], backgroundColor, 0);
    rect.setStrokeStyle(4, strokeColor, 1);
    rect.setDepth(5); // Put the rectangle over the link lines

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
    textName.setDepth(6); // Put the text over the rectangle

    // Check if we need to add exit icons
    if (this.room.visited) {
      this.setExitIcons(scene);
    }
  }

  /**
   * Sets exit icons for this room
   * Exit icons show information about the exit status to the player (locked, unlocked, jammed, etc.)
   * @param scene The scene this block is being created in
   */
  private setExitIcons(scene: Phaser.Scene) {
    this.room.exits.forEach((exit, i) => {
      let obj = null;
      if (exit[1] === RoomExitStatus.LOCKED) { // If the room is locked, show a lock
        let exitCoords = RoomBlock.getExitPoint(i, this.coords[0], this.coords[1]);
        obj = scene.add.image(exitCoords[0], exitCoords[1], "lock");
        obj.setTint(0x44ff44);
      }
      else if (exit[1] === RoomExitStatus.JAMMED) { // If the room is jammed, show an X
        let exitCoords = RoomBlock.getExitPoint(i, this.coords[0], this.coords[1]);
        obj = scene.add.image(exitCoords[0], exitCoords[1], "x");
      }

      // Move the object to the exterior of the room block
      if (obj != null) {
        obj.setScale(0.1);
        switch (i) {
          case 0:
            obj.y -= obj.displayHeight;
            break;
          case 1:
            obj.x += obj.displayWidth;
            break;
          case 2:
            obj.y += obj.displayHeight;
            break;
          case 3:
            obj.x -= obj.displayWidth;
            break;
        }
        obj.setDepth(10); // Put the icon over the block
      }
    });
  }

  /**
   * Gets the center coordinates of this room
   * @returns The coordinates of the center of this room [x, y]
   */
  getCenterCoords(): [number, number] {
    return [this.coords[0] + (RoomBlock.ROOM_SIZE[0] / 2), this.coords[1] + (RoomBlock.ROOM_SIZE[1] / 2)];
  }

  /**
   *
   * @param nextRoom The adjacent room to link
   * @param scene The scene this link is being created in
   */
  linkRooms(nextRoom: RoomBlock, scene: Phaser.Scene) {
    // Check if the link has already been created
    let keyCheckArr = [this.room.id, nextRoom.room.id].sort(); // Key is in alphabetical order
    let keyCheck = `{${ keyCheckArr[0] }} {${ keyCheckArr[1] }}`;
    if (!RoomBlock.roomLinks.has(keyCheck)) {
      // The map coordinates (not actual coordinates) of the start room (current room) and the end room (next room)
      let startPos = this.room.mapCoords;
      let endPos = nextRoom.room.mapCoords;

      // The directions (in cardinal directions) to and from the rooms, with relation to nextRoom (to nextRoom, from nextRoom)
      let toDir = this.room.getExitFromId(nextRoom.room.id);
      let fromDir = nextRoom.room.getExitFromId(this.room.id);

      // Actual coordinates of the starting position and the ending position of the line
      let startCoord = RoomBlock.getExitPoint(toDir, this.coords[0], this.coords[1]);
      let endCoord = RoomBlock.getExitPoint(fromDir, nextRoom.coords[0], nextRoom.coords[1]);

      // Create the line
      let graphics = scene.add.graphics();
      let lineColor = 0xffffff;
      if (!this.room.visited || !nextRoom.room.visited) { // If the player hasn't traveled here yet, gray out the line
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
      graphics.setDepth(!this.room.visited || !nextRoom.room.visited ? 1 : 2); // Put the white lines over the gray ones

      RoomBlock.roomLinks.add(keyCheck);
    }
  }

  /**
   * Calculates where the points on the room block are that correspond to the exits of the room
   * @param exit The direction of the exit {0: North, 1: East, 2: South, 3: West}
   * @param x The x coordinate of the top left corner of the room block
   * @param y The y coordinate of the top left corner of the room block
   * @returns The coordinate of the exit [x, y], or null if exit direction is invalid
   */
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

/**
 * Defines the scene where the user can examine the map
 */
export class MapTerminalScene extends Phaser.Scene {
  terminalSceneData: {terminalData: string}; // Data coming from the terminal scene before this, will be injected back into the terminal scene

  currRoom: RoomBlock; // Defines the current room that the user is looking at
  roomMap: Map<string, RoomBlock> // Contains a list of all the rooms onscreen, can be accessed through their ID

  currRoomBox: Phaser.GameObjects.Rectangle; // The UI element that displays what box is currently being looked at

  mapUI: MapUI; // The map UI instance

  constructor() {
    super({
      key: "MapTerminalScene"
    });
  }

  /**
   * Sets the data coming from the terminal scene
   * @param data The data coming from the terminal scene to be put back into the terminal scene after exit
   */
  init(data: any) {
    this.terminalSceneData = <{terminalData: string}>data;
  }

  /**
   * Loads the images
   */
  preload() {
    this.load.image("terminalScreen", 'assets/img/terminal-screen.png');
    this.load.image("lock", 'assets/img/lock.png');
    this.load.image("x", 'assets/img/red-x.png');
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

    /******************
     * Set up the map *
     ******************/
    // this.debugVisitRooms(); // Uncomment if you wish to debug this scene
    this.setupRooms(); // Create the map and all its rooms

    /*****************************
     * Set up the user interface *
     *****************************/
    let currRoomCoords = this.currRoom.getCenterCoords();
    this.cameras.main.centerOn(currRoomCoords[0], currRoomCoords[1]);
    this.currRoomBox = this.add.rectangle(currRoomCoords[0], currRoomCoords[1],
      RoomBlock.ROOM_SIZE[0] + 20, RoomBlock.ROOM_SIZE[1] + 20, 0xdddddd, 0.3);
    this.currRoomBox.setStrokeStyle(4, 0xffffff);
    this.mapUI = new MapUI(this);

    this.input.keyboard.on('keydown', this.onKeyDown, this);
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

  /**
   * Sets a few rooms' visited statuses to true to examine if the visibility system works
   */
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

  /**
   * Defines what happens when a key is input
   * @param keyEvent The keyboard event that calls this function
   */
  private onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      // Go back to the terminal
      case 27: // Escape
        this.scene.start("TerminalScene", this.terminalSceneData);
        break;
      // Toggle the UI
      case 32: // Space
        this.mapUI.toggleActivated();
        break;
      // Move the player
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

  /**
   * Moves the player in a given direction on the map
   * @param dir The direction to move in {0: North, 1: East, 2: South, 3: West}
   */
  private moveCurrRoom(dir: number) {
    if (this.currRoom.room.exits[dir][0] != "") { // Make sure the player can move in this direction
      this.currRoom = this.roomMap.get(this.currRoom.room.exits[dir][0]); // Set the new room
      // Set the UI to reflect this move
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

  /**
   * Creates the map by generating all of the rooms and their links
   */
  private setupRooms() {
    // Reset the map
    this.roomMap = new Map<string, RoomBlock>();
    RoomBlock.roomLinks = new Set<string>();
    let startingId = MapHandler.getGameMap().playerPos;
    this.createRoom(startingId); // Start building the rooms
    this.currRoom = this.roomMap.get(startingId);
  }

  /**
   * Recursively creates rooms and their adjacent rooms, as well as links them together
   * @param id The ID of the room to attempt to create
   * @returns The RoomBlock with the given ID
   */
  private createRoom(id: string): RoomBlock {
    if (!this.roomMap.has(id)) { // Check if we haven't made the room before
      const room = new RoomBlock(this, id);
      this.roomMap.set(id, room);

      // Recursively call this function for all adjacent rooms
      room.room.exits.forEach((exit, i) => {
        if (exit[0] != "") {
          let nextRoom = this.createRoom(exit[0]); // Create the room
          room.linkRooms(nextRoom, this); // Link the room
        }
      });

      return room;
    }
    else { // If the room has been made, simply return it so it can be linked
      return this.roomMap.get(id);
    }
  }
};
