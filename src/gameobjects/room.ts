const NUM_EXITS = 4;

export class Room {
  id: number;
  name: string;
  desc: string;
  exits: Array<number>; // [North, East, South, West]

  constructor(roomJson: RoomJson) {
    this.id = roomJson.id;
    this.name = roomJson.name;
    this.desc = roomJson.desc;
    this.exits = new Array<number>(NUM_EXITS);
    this.exits[0] = roomJson.exits.north;
    this.exits[1] = roomJson.exits.east;
    this.exits[2] = roomJson.exits.south;
    this.exits[3] = roomJson.exits.west;
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
  id: number;
  name: string;
  desc: string;
  exits: {
    north: number, // This is the id of the room to the north, -1 if nothing
    east: number,
    south: number,
    west: number
  };
}
