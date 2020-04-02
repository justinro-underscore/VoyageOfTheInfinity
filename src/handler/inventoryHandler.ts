import { GameObject } from "../gameobjects/gameObject";

/**
 * Handles all interaction with the player's inventory, or how they store objects.
 * Inventory handler acts as a singleton
 */
export class InventoryHandler {
  static objectsInInventory = new Array<GameObject>(); // Describes what objects are kept in the inventory
  static size = 0; // Describes how many objects are in the inventory

  /**
   * Get all objects that respond to the name given
   * Will be an array of objects because object name is not unique
   * @param objName A string representing the object's name
   * @returns An array containing the game objects with the name (or alternate name) given
   */
  static getObjects(objName: string): Array<GameObject> {
    let objs = new Array<GameObject>();
    InventoryHandler.objectsInInventory.forEach(obj => {
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
  static addObject(obj: GameObject) {
    InventoryHandler.objectsInInventory.push(obj);
    InventoryHandler.size += 1;
  }

  /**
   * Removes an object from the inventory
   * @param obj The object to remove from the inventory
   * @returns True if the object was successfully removed, false otherwise
   */
  static removeObject(obj: GameObject): boolean {
    const index = this.objectsInInventory.indexOf(obj);
    if (index != -1) {
      this.objectsInInventory.splice(index, 1);
      this.size -= 1;
      return true;
    }
    return false;
  }

  /**
   * Resets the inventory handler by removing all objects and resetting size
   */
  static resetInventory() {
    InventoryHandler.objectsInInventory = new Array<GameObject>();
    InventoryHandler.size = 0;
  }
}