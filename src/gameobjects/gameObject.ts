/**
 * Defines a game object
 * Game objects can be examined, or can sometimes be picked up and/or used
 */
export class GameObject {
  id: string; // Unique ID of the object (uniqueness is verified in Room object)
  name: string; // Name of the object (does not have to be unique)
  altNames: Array<string>; // List of alternative names this object responds to
  desc: string; // Description of object
  pickupable: boolean; // If true, the player can add this object to their inventory

  /**
   * Generates a new game object from a given JSON object
   * @param objJson GameObject object in JSON form
   */
  constructor(objJson: GameObjectJson) {
    // Set variables
    this.id = objJson.id;
    this.name = objJson.name;
    if (this.name.toLocaleLowerCase().includes(" with ")) { // Objects cannot include the word "with" in their name as it conflicts with the use command
      // TODO Make it so that names can include "with" in their name
      console.error(`Object name cannot contain the word \"with\" ${ this.id }`);
    }
    this.altNames = new Array<string>();
    if (objJson.altNames != null) {
      objJson.altNames.forEach(name => {
        this.altNames.push(name.toLocaleLowerCase());
        if (name.toLocaleLowerCase().includes(" with ")) {
          console.error(`Object name cannot contain the word \"with\" ${ this.id }`);
        }
      });
    }
    this.desc = objJson.desc;
    this.pickupable = (objJson.pickupable != null ? objJson.pickupable : false);
  }

  /**
   * Checks to see if this object responds to a given name
   * @param objName The name to check against
   * @returns True if this object's name is equal to the one given, or the given name is in this object's list of alternative names
   */
  equals(objName: string): boolean {
    return this.name.toLocaleLowerCase() === objName || this.altNames.includes(objName);
  }
}

/**
 * Defines how a game object should be described in JSON
 */
export interface GameObjectJson {
  id: string;
  name: string;
  altNames?: string[]; // List of alternative names this object will respond to (e.g. "Door Key" may also respond to the keyword "key")
  desc: string;
  pickupable?: boolean; // If true, this object can be placed in the user's inventory. Defaults to false
}
