import { GameObject, GameObjectJson } from './gameObject';

// Defines how many exits a room has
const EXIT_CODES = {
  "north": 0,
  "east": 1,
  "south": 2,
  "west": 3
};

export enum RoomExitStatus {
  UNLOCKED,
  LOCKED,
  JAMMED
}

/**
 * Defines a room object
 * A room contains information pertaining to how to navigate the room and objects that the player can interact with
 */
export class Room {
  id: string; // Unique ID of the room (uniqueness is verified in Room object)
  name: string; // Name of the room (does not have to be unique)
  desc: string; // Description of the room
  mapCoords: [number, number]; // Arbitrary coordinates on a plane that describes where this room should lie on the map [x, y]
  exits: Array<[string, RoomExitStatus]>; // Array of room IDs defining the exits to this room [North, East, South, West]. An empty string represents no exit in that direction
  objects: Map<string, GameObject>; // Defines a mapping of game object IDs to game object references
  static objectIds: Array<string> = new Array<string>(); // A static array of object IDs (to ensure uniqueness)
  visited: boolean; // If true, the player has already visited this room

  /**
   * Generates a new room object from a given JSON object
   * @param roomJson Room object in JSON form
   */
  constructor(roomJson: RoomJson) {
    // Set member variables
    this.id = roomJson.id;
    this.name = roomJson.name;
    this.desc = roomJson.desc;
    this.mapCoords = [roomJson.mapCoords.x, roomJson.mapCoords.y];

    // Set exits
    this.exits = new Array<[string, RoomExitStatus]>(Object.keys(EXIT_CODES).length);
    this.exits[0] = [roomJson.exits.north, RoomExitStatus.UNLOCKED];
    this.exits[1] = [roomJson.exits.east, RoomExitStatus.UNLOCKED];
    this.exits[2] = [roomJson.exits.south, RoomExitStatus.UNLOCKED];
    this.exits[3] = [roomJson.exits.west, RoomExitStatus.UNLOCKED];
    if (roomJson.exits.locked != null) {
      roomJson.exits.locked.forEach(exit => {
        let index = EXIT_CODES[exit];
        if (index === undefined) {
          console.error(`Room {${ this.id }} has locked room that is not valid ${ exit }`);
        }
        else {
          this.exits[index][1] = RoomExitStatus.LOCKED;
        }
      });
    }
    if (roomJson.exits.jammed != null) {
      roomJson.exits.jammed.forEach(exit => {
        let index = EXIT_CODES[exit];
        if (index === undefined) {
          console.error(`Room {${ this.id }} has locked room that is not valid ${ exit }`);
        }
        else if (this.exits[index][1] != RoomExitStatus.UNLOCKED) {
          console.error(`Room {${ this.id }} has exit {${ exit }} that is locked and jammed`);
        }
        else {
          this.exits[index][1] = RoomExitStatus.JAMMED;
        }
      });
    }

    // Create and set the objects
    this.objects = new Map<string, GameObject>();
    roomJson.objects.forEach(obj => {
      let object = new GameObject(<GameObjectJson>obj);
      if (Room.objectIds.includes(object.id)) { // Ensure object ID uniqueness
        console.error("Object id repeated in room " + this.id + ": " + object.id);
      }
      else {
        Room.objectIds.push(object.id);
        this.objects.set(object.id, object);
      }
    });

    this.visited = false; // Player could not have visited this yet
  }

  /**
   * Returns the information pertaining to a room
   * @param fullRoomDesc If false, simply return the room name. If true, return room description as well
   * @returns The room description
   */
  getRoomInfo(fullRoomDesc=false): string {
    let infoString = this.name;
    if (fullRoomDesc) {
      infoString += "\n" + this.desc;
    }
    return infoString;
  }

  /**
   * Get all objects that respond to the name given
   * Will be an array of objects because object name is not unique
   * @param objName A string representing the object's name
   * @returns An array containing the game objects with the name (or alternate name) given
   */
  getObjects(objName: string): Array<GameObject> {
    let objs = new Array<GameObject>();
    this.objects.forEach(obj => {
      if (obj.equals(objName)) {
        objs.push(obj);
      }
    });
    return objs;
  }

  /**
   * Get object from its ID
   * @param objID The ID of the object desired
   * @returns The object if it exists, otherwise null
   */
  getObjectFromID(objID: string): GameObject {
    if (this.objects.has(objID)) {
      return this.objects.get(objID);
    }
    return null;
  }

  /**
   * Adds an object to the room
   * NOTE: will not add an object that is already in the room (this should be avoided elsewhere in the code)
   * @param obj The game object to add to the room
   */
  addObject(obj: GameObject) {
    if (!this.objects.has(obj.id)) {
      this.objects.set(obj.id, obj);
    }
  }

  /**
   * Removes an object from the room
   * @param obj The object to remove from the room
   * @returns True if the object was successfully removed, false otherwise
   */
  removeObject(obj: GameObject): boolean {
    if (this.objects.has(obj.id)) {
      this.objects.delete(obj.id);
      return true;
    }
    return false;
  }

  /**
   * Sets the visited variable, which tells if a user has visited this room yet
   * @param visited The boolean to set visited to
   */
  setVisited(visited: boolean) {
    this.visited = visited;
  }

  /**
   * Sets the given exit for this room
   * @param direction A string describing which direction to overwrite. Must be one of the following: ["north", "east", "south", "west"]
   * @param newRoomId The new room ID to set
   * @param exitStatus The status of the exit (locked, jammed, etc.). Defaults to unlocked
   * @returns True if direction is valid
   */
  setExitID(direction: string, newRoomId: string, exitStatus: RoomExitStatus=RoomExitStatus.UNLOCKED): boolean {
    let index = EXIT_CODES[direction];
    if (index === undefined) {
      return false;
    }
    this.exits[index] = [newRoomId, exitStatus];
    return true;
  }

  /**
   * Sets the given exit status for this room
   * @param direction A string describing which direction to overwrite. Must be one of the following: ["north", "east", "south", "west"]
   * @param exitStatus The status of the exit (locked, jammed, etc.)
   * @returns True if direction is valid
   */
  setExitStatus(direction: string, exitStatus: RoomExitStatus): boolean {
    let index = EXIT_CODES[direction];
    if (index === undefined) {
      return false;
    }
    this.exits[index][1] = exitStatus;
    return true;
  }

  /**
   * Get the direction of the exit to a given room
   * @param id The ID of the room searching for
   * @returns The direction of the exit that leads into the given room, or null if it doesn't exist
   */
  getExitFromId(id: string): number {
    for (let i = 0; i < this.exits.length; i++) {
      if (this.exits[i][0] === id) {
        return i;
      }
    }
    return null;
  }
}

/**
 * Defines how a room object should be described in JSON
 */
export interface RoomJson {
  id: string;
  name: string;
  desc: string;
  mapCoords: {
    x: number;
    y: number;
  }
  exits: {
    north: string, // This is the id of the room to the north, "" if cannot go this direction
    east: string,
    south: string,
    west: string,
    locked?: string[],
    jammed?: string[]
  };
  objects: [GameObjectJson];
}
