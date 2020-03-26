import { GameObject, GameObjectJson } from './gameObject';

const NUM_EXITS = 4;

export class Room {
  id: string;
  name: string;
  desc: string;
  exits: Array<string>; // [North, East, South, West]
  objects: Map<string, GameObject>;
  static objectIds: Array<string> = new Array<string>();

  constructor(roomJson: RoomJson) {
    this.id = roomJson.id;
    this.name = roomJson.name;
    this.desc = roomJson.desc;
    this.exits = new Array<string>(NUM_EXITS);
    this.exits[0] = roomJson.exits.north;
    this.exits[1] = roomJson.exits.east;
    this.exits[2] = roomJson.exits.south;
    this.exits[3] = roomJson.exits.west;
    this.objects = new Map<string, GameObject>();
    roomJson.objects.forEach(obj => {
      let object = new GameObject(<GameObjectJson>obj);
      if (Room.objectIds.includes(object.id)) {
        console.error("Object id repeated in room " + this.id + ": " + object.id);
      }
      else {
        Room.objectIds.push(object.id);
        this.objects.set(object.id, object);
      }
    })
  }

  getRoomInfo(fullRoomDesc=false) {
    let infoString = this.name;
    if (fullRoomDesc) {
      infoString += "\n" + this.desc;
    }
    return infoString;
  }

  getObjects(objName: string): Array<GameObject> {
    let objs = new Array<GameObject>();
    this.objects.forEach(obj => {
      if (obj.equals(objName)) {
        objs.push(obj);
      }
    })
    return objs;
  }

  addObject(obj: GameObject) {
    if (!this.objects.has(obj.id)) {
      this.objects.set(obj.id, obj);
    }
  }

  removeObject(obj: GameObject): boolean {
    if (this.objects.has(obj.id)) {
      this.objects.delete(obj.id);
      return true;
    }
    return false;
  }

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
