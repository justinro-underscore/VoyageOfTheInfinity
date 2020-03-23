import { Room, RoomJson } from './room';
import { GameObject, GameObjectJson } from './gameObject';

export class GameMap {
  mapName: string;
  rooms: Map<string, Room>;
  playerPos: string; // Refers to the room ID that the user is in

  constructor(gameMapJson: GameMapJson) {
    this.mapName = gameMapJson.name;
    this.playerPos = gameMapJson.starting_room;
    this.rooms = new Map<string, Room>();
    gameMapJson.rooms.forEach((val) => {
      let room = new Room(val);
      if (this.rooms.has(room.id)) {
        console.error("Room id repeated! " + room.id);
      }
      else {
        this.rooms.set(room.id, room);
      }
    });
    let roomExitError = this.verifyExits();
    if (roomExitError != null) {
      console.error("Room " + roomExitError[0].id + " has invalid exit: {" + roomExitError[1] + "} - " + roomExitError[0].exits[roomExitError[1]]);
    }
  }

  getRoomInfo(fullRoomDesc: boolean, roomID=this.playerPos): string {
    if (this.rooms.has(roomID)) {
      return this.rooms.get(roomID).getRoomInfo(fullRoomDesc);
    }
    return "Room does not exist!";
  }

  examineObj(objName: string): string {
    let objects = this.rooms.get(this.playerPos).getObjects(objName);
    if (objects.length > 0) {
      if (objects.length === 1) {
        return objects[0].desc;
      }
      throw new MultipleObjects(objects);
    }
    return `${ objName } cannot be found`;
  }

  movePlayer(direction: number): boolean {
    let newRoomID = this.rooms.get(this.playerPos).exits[direction];
    if (newRoomID === "") {
      return false;
    }
    this.playerPos = newRoomID;
    return true;
  }

  // Returns true if exits are valid, false otherwise
  private verifyExits(): [Room, number] {
    let res = null;
    this.rooms.forEach(room => {
      room.exits.forEach((exit, i) => {
        if (exit != "" && !this.rooms.has(exit)) {
          res = [room, i];
        }
      })
    })
    return res;
  }
}

export interface GameMapJson {
  name: string;
  starting_room: string;
  rooms: [RoomJson];
}

export class MultipleObjects extends Error {
  objectsFound: Array<GameObject>;

  constructor(objects: Array<GameObject>) {
    super();
    this.objectsFound = objects;
  }
}