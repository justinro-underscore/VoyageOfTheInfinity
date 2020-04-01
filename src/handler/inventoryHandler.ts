import { GameObject } from "../gameobjects/gameObject";

/**
 * Handles all interaction with the player's inventory, or how they store objects.
 * Inventory handler acts as a singleton
 */
export class InventoryHandler {
  private static instance: InventoryHandler; // The singleton instance of the handler

  objectsInInventory: Array<GameObject>; // Describes what objects are kept in the inventory
  size: number; // Describes how many objects are in the inventory

  /**
   * Returns the instance of InventoryHandler
   * This class's instance must be procured before running commands because we don't know if / when the class instance will be instantiated
   */
  static getInstance(): InventoryHandler {
    if (InventoryHandler.instance === undefined) {
      InventoryHandler.instance = new InventoryHandler();
    }
    return InventoryHandler.instance;
  }

  /**
   * Get all objects that respond to the name given
   * Will be an array of objects because object name is not unique
   * @param objName A string representing the object's name
   * @returns An array containing the game objects with the name (or alternate name) given
   */
  getObjects(objName: string): Array<GameObject> {
    let objs = new Array<GameObject>();
    this.objectsInInventory.forEach(obj => {
      if (obj.equals(objName)) {
        objs.push(obj);
      }
    });
    return objs;
  }

  /**
   * Adds an object to the inventory
   * @param obj The game object to add to the inventory
   */
  addObject(obj: GameObject) {
    this.objectsInInventory.push(obj);
    this.size += 1;
  }

  /**
   * Removes an object from the inventory
   * @param obj The object to remove from the inventory
   * @returns True if the object was successfully removed, false otherwise
   */
  removeObject(obj: GameObject): boolean {
    const index = this.objectsInInventory.indexOf(obj);
    if (index != -1) {
      this.objectsInInventory.splice(index, 1);
      this.size -= 1;
      return true;
    }
    return false;
  }

  /**
   * Creates a new instance of the InventoryHandler by instantiating the 
   */
  private constructor() {
    this.objectsInInventory = new Array<GameObject>();
    this.size = 0;
  }
}