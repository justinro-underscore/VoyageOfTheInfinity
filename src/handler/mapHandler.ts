import { GameMap, GameMapJson } from '../gameobjects/gameMap';
import testingMap from '../gameinfo/maps/testingmap.json';

export class MapHandler {
  static instance: MapHandler;

  private gameMap: GameMap;

  static instantiateInstance(mapPath: string) {
    this.instance = new MapHandler(mapPath);
  }

  static getCurrRoomInfo(fullRoomDesc: boolean): string {
    return this.instance.gameMap.getRoomInfo(fullRoomDesc);
  }

  static movePlayer(direction: number): boolean {
    return this.instance.gameMap.movePlayer(direction);
  }

  /*
    Private methods
  */

  private constructor(mapPath: string) {
    this.gameMap = new GameMap(<GameMapJson> testingMap);
  }
}