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

  static examineObj(objName: string): string {
    return this.instance.gameMap.examineObj(objName);
  }

  static movePlayer(direction: number): boolean {
    return this.instance.gameMap.movePlayer(direction);
  }

  // WARNING: DO NOT USE OUTSIDE DEBUGGING PURPOSES
  static getGameMap(): GameMap {
    return this.instance.gameMap;
  }

  /*
    Private methods
  */

  private constructor(mapPath: string) {
    this.gameMap = new GameMap(<GameMapJson> testingMap);
  }
}