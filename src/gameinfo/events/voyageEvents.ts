import { EventObject } from "../../gameobjects/eventObject";
import { MapHandler } from "../../handler/mapHandler";
import { RoomExitStatus } from "../../gameobjects/room";
import { GameObject } from "../../gameobjects/gameObject";
import { InventoryHandler } from "../../handler/inventoryHandler";

/**
 * Used to define any data that should be kept track of
 */
const eventData = {
  counter: 0
}

export const VoyageEventMap: EventObject = {
  useEvents: [
  ],
  commandEvents: [
  ]
};
