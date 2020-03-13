import { GameMap, GameMapJson } from '../gameobjects/gameMap';
import testingMap from '../gameinfo/maps/testingmap.json';

export class MapHandler {
  static instance: MapHandler;

  gameMap: GameMap;

  static instantiateInstance(mapPath: string) {
    this.instance = new MapHandler(mapPath);
  }

  /*
    Private methods
  */

  private constructor(mapPath: string) {
    this.gameMap = new GameMap(<GameMapJson> testingMap);
    console.log(this.gameMap);
  }
}