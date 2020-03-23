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
      if (Room.objectIds.includes(obj.id)) {
        console.error("Object id repeated in room " + this.id + ": " + obj.id);
      }
      else {
        Room.objectIds.push(obj.id);
        this.objects.set(obj.id, obj);
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
  objects: [GameObject];
}
