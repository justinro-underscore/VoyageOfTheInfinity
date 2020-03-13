import { Room, RoomJson } from './room';

export class GameMap {
  mapName: string;
  rooms: Map<number, Room>;
  playerPos: number; // Refers to the room ID that the user is in

  constructor(gameMapJson: GameMapJson) {
    this.mapName = gameMapJson.name;
    this.playerPos = gameMapJson.starting_room;
    this.rooms = new Map<number, Room>();
    gameMapJson.rooms.forEach((val) => {
      let room = new Room(val);
      this.rooms.set(room.id, room);
    });
  }
}

export interface GameMapJson {
  name: string;
  starting_room: number;
  rooms: [RoomJson];
}