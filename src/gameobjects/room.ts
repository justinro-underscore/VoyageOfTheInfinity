const NUM_EXITS = 4;

export class Room {
  id: string;
  name: string;
  desc: string;
  exits: Array<string>; // [North, East, South, West]

  constructor(roomJson: RoomJson) {
    this.id = roomJson.id;
    this.name = roomJson.name;
    this.desc = roomJson.desc;
    this.exits = new Array<string>(NUM_EXITS);
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
  id: string;
  name: string;
  desc: string;
  exits: {
    north: string, // This is the id of the room to the north, "" if cannot go this direction
    east: string,
    south: string,
    west: string
  };
}
