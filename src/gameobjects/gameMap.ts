import { Room, RoomJson, RoomExitStatus } from './room';
import { GameObject } from './gameObject';

/**
 * Defines a game map object
 * Game maps define how a user can navigate the world, as well as keeping track of where the user is at any given time
 */
export class GameMap {
  mapName: string; // A name describing what this map represents
  rooms: Map<string, Room>; // A mapping of a room ID to a reference of the room
  playerPos: string; // Refers to the room ID that the user is in

  /**
   * Generates a new game map from a given JSON object
   * @param gameMapJson GameMap object in JSON form
   */
  constructor(gameMapJson: GameMapJson) {
    // Set the variables
    this.mapName = gameMapJson.name;
    this.playerPos = gameMapJson.starting_room;
    this.rooms = new Map<string, Room>();
    gameMapJson.rooms.forEach((val) => {
      let room = new Room(val);
      if (this.rooms.has(room.id)) { // Check for uniqueness in room IDs
        console.error("Room id repeated! " + room.id);
      }
      else {
        this.rooms.set(room.id, room);
      }
    });
    this.verifyExits();
  }

  /**
   * @see Room.getRoomInfo
   * @param fullRoomDesc @see Room.getRoomInfo
   * @param roomID The ID of the room requested, defaults to current room
   * @returns @see Room.getRoomInfo
   */
  getRoomInfo(fullRoomDesc: boolean, roomID=this.playerPos): string {
    if (this.rooms.has(roomID)) {
      return this.rooms.get(roomID).getRoomInfo(fullRoomDesc);
    }
    return "Room does not exist!";
  }

  /**
   * @see Room.visited
   * @throws Error if room does not exist
   * @param roomID The ID of the room requested, defaults to current room
   */
  getRoomVisitedStatus(roomID=this.playerPos): boolean {
    if (this.rooms.has(roomID)) {
      return this.rooms.get(roomID).visited;
    }
    throw Error("Room does not exist!");
  }

  /**
   * @see Room.setVisited
   * @param visited If true, set the room visited variable to true
   * @param roomID The ID of the room requested, defaults to current room
   * @returns If true, successful. Otherwise, room does not exist
   */
  setRoomVisitedStatus(visited: boolean, roomID=this.playerPos): boolean {
    if (this.rooms.has(roomID)) {
      this.rooms.get(roomID).setVisited(visited);
      return true;
    }
    return false;
  }

  /**
   * @see Room.getObjects
   * @param objName @see Room.getObjects
   * @returns @see Room.getObjects
   */
  getObjects(objName: string): Array<GameObject> {
    return this.rooms.get(this.playerPos).getObjects(objName);
  }

  /**
   * Attempts to get a given object from the map from ID
   * @param objID The ID of the object desired
   * @returns The game object if it exists, null otherwise
   */
  getObjectFromID(objID: string): GameObject {
    for (let room of Array.from(this.rooms.values())) {
      let res = room.getObjectFromID(objID);
      if (res != null) {
        return res;
      }
    }
    return null;
  }

  /**
   * @see Room.addObject
   * @param obj @see Room.addObject
   */
  addObject(obj: GameObject) {
    this.rooms.get(this.playerPos).addObject(obj);
  }

  /**
   * @see Room.removeObject
   * @param obj @see Room.removeObject
   * @returns @see Room.removeObject
   */
  removeObject(obj: GameObject): boolean {
    return this.rooms.get(this.playerPos).removeObject(obj);
  }

  /**
   * Moves the player in any given direction
   * @param direction Defines the direction the player should move in. Can be {0: North, 1: East, 2: South, 3: West}
   * @returns True if the user moved, false otherwise
   */
  movePlayer(direction: number): boolean {
    // Validate that direction is valid
    if (direction < 0 || direction > 3) {
      return false;
    }
    let newRoomID = this.rooms.get(this.playerPos).exits[direction];
    if (newRoomID[0] === "") { // If room doesn't exist, don't move the player
      return false;
    }
    if (newRoomID[1] != RoomExitStatus.UNLOCKED) { // If room is not unlocked, don't move the player
      return false;
    }
    this.playerPos = newRoomID[0];
    return true;
  }

  /**
   * Returns an instance of the room desired
   * @param id The ID of the room desired
   * @returns If ID is valid, return the room. Else, return null
   */
  getRoom(id: string): Room {
    if (this.rooms.has(id)) {
      return this.rooms.get(id);
    }
    return null;
  }

  /***********************
   *   PRIVATE METHODS   *
   ***********************/

   /**
    * Verifies all exits of all rooms
    * Checks if any room's exit ID refers to a room that does not exist
    * Multiple rooms' exits can lead to one room
    */
  private verifyExits() {
    this.rooms.forEach(room => {
      room.exits.forEach((exit, i) => {
        if (exit[0] != "" && !this.rooms.has(exit[0])) {
          console.error(`Room ${ room.id } has invalid exit: {${ i }} - ${ exit[0] }`);
        }
      })
    })
  }
}

/**
 * Defines how a game map object should be described in JSON
 */
export interface GameMapJson {
  name: string;
  starting_room: string;
  rooms: [RoomJson];
}
