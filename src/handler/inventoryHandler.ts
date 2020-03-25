import { GameObject } from "../gameobjects/gameObject";

export class InventoryHandler {
  private static instance: InventoryHandler;

  objectsInInventory: Array<GameObject>;
  size: number;

  // This class's instance must be procured before running commands because
  //  we don't know if / when this class will be instantiated
  static getInstance(): InventoryHandler {
    if (InventoryHandler.instance === undefined) {
      InventoryHandler.instance = new InventoryHandler();
    }
    return InventoryHandler.instance;
  }

  getObjects(objName: string): Array<GameObject> {
    let objs = new Array<GameObject>();
    this.objectsInInventory.forEach(obj => {
      if (obj.equals(objName)) {
        objs.push(obj);
      }
    });
    return objs;
  }

  addObject(obj: GameObject) {
    this.objectsInInventory.push(obj);
    this.size += 1;
  }

  removeObject(obj: GameObject): boolean {
    const index = this.objectsInInventory.indexOf(obj);
    if (index != -1) {
      this.objectsInInventory.splice(index, 1);
      this.size -= 1;
      return true;
    }
    return false;
  }

  private constructor() {
    this.objectsInInventory = new Array<GameObject>();
    this.size = 0;
  }
}