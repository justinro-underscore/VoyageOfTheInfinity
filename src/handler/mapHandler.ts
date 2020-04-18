import { GameMap, GameMapJson } from '../gameobjects/gameMap';
import testingMap from '../gameinfo/maps/testingmap.json';
import voyageMap from '../gameinfo/maps/voyagemap.json';
import { GameObject } from '../gameobjects/gameObject';
import { Room } from '../gameobjects/room';

export class MapHandler {
  static instance: MapHandler;
  static instanceName: string;
  static availableGameMaps: Map<string, GameMap> = new Map([
    ["testing", new GameMap(<GameMapJson> testingMap)],
    ["voyage", new GameMap(<GameMapJson> voyageMap)]
  ]);

  private gameMap: GameMap;

  static instantiateInstance(mapKey: string) {
    this.instance = new MapHandler(mapKey);
  }

  static getCurrRoomInfo(fullRoomDesc: boolean): string {
    return this.instance.gameMap.getRoomInfo(fullRoomDesc);
  }

  static getCurrRoomVisited(): boolean {
    return this.instance.gameMap.getRoomVisitedStatus();
  }

  static setCurrRoomVisitedStatus(visited: boolean): boolean {
    return this.instance.gameMap.setRoomVisitedStatus(visited);
  }

  static getObjects(objName: string): Array<GameObject> {
    return this.instance.gameMap.getObjects(objName);
  }

  static getObjectFromID(objID: string): GameObject {
    return this.instance.gameMap.getObjectFromID(objID);
  }

  static addObject(obj: GameObject) {
    this.instance.gameMap.addObject(obj);
  }

  static removeObject(obj: GameObject): boolean {
    return this.instance.gameMap.removeObject(obj);
  }

  static movePlayer(direction: number): boolean {
    return this.instance.gameMap.movePlayer(direction);
  }

  static getRoom(id: string): Room {
    return this.instance.gameMap.getRoom(id);
  }

  // WARNING: DO NOT USE OUTSIDE DEBUGGING PURPOSES
  static getGameMap(): GameMap {
    return this.instance.gameMap;
  }

  /*
    Private methods
  */

  private constructor(mapKey: string) {
    if (!MapHandler.availableGameMaps.has(mapKey)) {
      console.error(`Map {${ mapKey }} does not exist!`)
    }
    else {
      MapHandler.instanceName = mapKey;
      this.gameMap = MapHandler.availableGameMaps.get(mapKey);
      this.gameMap.setRoomVisitedStatus(true);
    }
  }
}
