export class GameObject {
  id: string;
  name: string;
  altNames: Array<string>;
  desc: string;
  pickupable: boolean;

  constructor(objJson: GameObjectJson) {
    this.id = objJson.id;
    this.name = objJson.name;
    if (this.name.toLocaleLowerCase().includes(" with ")) {
      console.error(`Object name cannot contain the word \"with\" ${ this.id }`);
    }
    this.altNames = new Array<string>();
    objJson.altNames.forEach(name => {
      this.altNames.push(name.toLocaleLowerCase());
      if (name.toLocaleLowerCase().includes(" with ")) {
        console.error(`Object name cannot contain the word \"with\" ${ this.id }`);
      }
    });
    this.desc = objJson.desc;
    this.pickupable = objJson.pickupable;
  }

  equals(objName: string): boolean {
    return this.name.toLocaleLowerCase() === objName || this.altNames.includes(objName);
  }
}

export interface GameObjectJson {
  id: string;
  name: string;
  altNames: [string];
  desc: string;
  pickupable: boolean;
}
