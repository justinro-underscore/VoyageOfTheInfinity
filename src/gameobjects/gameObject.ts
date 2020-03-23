export class GameObject {
  id: string;
  name: string;
  altNames: Array<string>;
  desc: string;
  pickupable: boolean;

  constructor(objJson: GameObjectJson) {
    this.id = objJson.id;
    this.name = objJson.name;
    this.altNames = new Array<string>();
    objJson.altNames.forEach(name => {
      this.altNames.push(name.toLocaleLowerCase());
    });
    this.desc = objJson.desc;
    this.pickupable = objJson.pickupable;
  }
}

export interface GameObjectJson {
  id: string;
  name: string;
  altNames: [string];
  desc: string;
  pickupable: boolean;
}
