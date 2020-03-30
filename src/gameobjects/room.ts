import { GameObject, GameObjectJson } from './gameObject';

// Defines how many exits a room has
const NUM_EXITS = 4;

/**
 * Defines a room object
 * A room contains information pertaining to how to navigate the room and objects that the player can interact with
 */
export class Room {
  id: string; // Unique ID of the room
  name: string; // Name of the room (does not have to be unique)
  desc: string; // Description of the room
  exits: Array<string>; // Array of room IDs defining the exits to this room [North, East, South, West]. An empty string represents no exit in that direction
  objects: Map<string, GameObject>; // Defines a mapping of game object IDs to game object references
  static objectIds: Array<string> = new Array<string>(); // A static array of object IDs (to ensure uniqueness)

  /**
   * Generates a new room object from a given JSON object
   * @param roomJson Room object in JSON form
   */
  constructor(roomJson: RoomJson) {
    // Set member variables
    this.id = roomJson.id;
    this.name = roomJson.name;
    this.desc = roomJson.desc;
    this.exits = new Array<string>(NUM_EXITS);
    this.exits[0] = roomJson.exits.north;
    this.exits[1] = roomJson.exits.east;
    this.exits[2] = roomJson.exits.south;
    this.exits[3] = roomJson.exits.west;

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
    })
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
    })
    return objs;
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
   * Sets the given exit for this room
   * TODO add check if newRoomId exists
   * @param direction A string describing which direction to overwrite. Must be one of the following: ["north", "east", "south", "west"]
   * @param newRoomId The new room ID to set
   * @returns True if direction is valid
   */
  setExit(direction: string, newRoomId: string): boolean {
    switch (direction) {
      case "north":
        this.exits[0] = newRoomId;
        break;
      case "east":
        this.exits[1] = newRoomId;
        break;
      case "south":
        this.exits[2] = newRoomId;
        break;
      case "west":
        this.exits[3] = newRoomId;
        break;
      default:
        return false;
    }
    return true;
  }
}

/**
 * Defines how a room object should be described in JSON
 */
export interface RoomJson {
  id: string;
  name: string;
  desc: string;
  exits: {
    north: string, // This is the id of the room to the north, "" if cannot go this direction
    east: string,
    south: string,
    west: string
  };
  objects: [GameObjectJson];
}
