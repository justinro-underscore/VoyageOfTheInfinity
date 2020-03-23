export class GameObject {
  id: string;
  name: string;
  desc: string;
  pickupable: boolean;

  constructor(objJson: GameObjectJson) {
    this.id = objJson.id;
    this.name = objJson.name;
    this.desc = objJson.desc;
    this.pickupable = objJson.pickupable;
  }
}

export interface GameObjectJson {
  id: string;
  name: string;
  desc: string;
  pickupable: boolean;
}
