import { EventObject, MoveEventResultObject } from "../../gameobjects/eventObject";
import { MapHandler } from "../../handler/mapHandler";
import { RoomExitStatus } from "../../gameobjects/room";
import { GameObject } from "../../gameobjects/gameObject";
import { InventoryHandler } from "../../handler/inventoryHandler";

/**
 * Used to define any data that should be kept track of
 */
const eventData = {
  destroyedRubbleToA: false,
  unlockedPowerRoom: false,
  spawnedFitnessOpenLocker: false,
  spawnedEngineerKeycard: false
}

// "desc": "This room is used to keep crew members in peak physical condition during long expeditions.\nThere is a shower in the corner, a row of lockers, and various fitness equipment scattered around the area",

const tooDark: MoveEventResultObject = {
  overrideResult: true,
  result: "It's too dark to move around the room"
}

export const VoyageEventMap: EventObject = {
  useEvents: [
    {
      useObj: "obj_power_room_keycard",
      withObj: "obj_lodging_locked_door",
      event: () => {
        if (!eventData.unlockedPowerRoom) {
          let room = MapHandler.getRoom("rm_lodging");
          room.desc = "This room is where crew members can relax, catch up on rest, or enjoy leisure time.\nThere are exits to the north and west, and doors leading east and south";
          room.setExitStatus("south", RoomExitStatus.UNLOCKED);

          let door = MapHandler.getObjectFromID("obj_lodging_locked_door");
          door.name = "South Door";
          door.altNames = door.altNames.filter(name => name != "South Door");
          door.desc = "The door leading to the south sits slightly ajar. A sign on the door reads \"Power Room - Engineers Only\""

          eventData.unlockedPowerRoom = true;
          return "With a beep, the door unlocks!";
        }
        else {
          return "The door is already unlocked";
        }
      }
    }
  ],
  commandEvents: [
    {
      command: "examine",
      events: [
        {
          useObj: "obj_fitness_lockers",
          event: () => {
            if (!eventData.spawnedFitnessOpenLocker) {
              MapHandler.addObject(new GameObject({
                id: "obj_fitness_open_locker",
                name: "Open Locker",
                desc: "There is a keycard on the top shelf",
                pickupable: false
              }));
              eventData.spawnedFitnessOpenLocker = true;
            }
            return null;
          }
        },
        {
          useObj: "obj_fitness_open_locker",
          event: () => {
            if (!eventData.spawnedEngineerKeycard) {
              MapHandler.addObject(new GameObject({
                id: "obj_power_room_keycard",
                name: "Keycard",
                altNames: ["Engineer Keycard"],
                desc: "An engineering keycard. This little rectangle can get owners into all of the engineering rooms on the ship",
                pickupable: true
              }));
              eventData.spawnedEngineerKeycard = true;
            }
            return null;
          }
        }
      ]
    },
    {
      command: "take",
      events: [
        {
          useObj: "obj_power_room_keycard",
          event: () => {
            MapHandler.getObjectFromID("obj_fitness_open_locker").desc = "The open locker is empty";
            return null;
          }
        }
      ]
    }
  ],
  moveEvents: [
    {
      room: "rm_chambers",
      dir: 3,
      event: () => {
        if (!eventData.destroyedRubbleToA) {
          return {
            overrideResult: true,
            result: "A pile of rubble stands in your way"
          }
        }
        else {
          return null;
        }
      }
    },
    {
      room: "rm_cafe_dark",
      dir: 0,
      event: () => tooDark
    },
    {
      room: "rm_cafe_dark",
      dir: 1,
      event: () => tooDark
    },
    {
      room: "rm_cafe_dark",
      dir: 3,
      event: () => tooDark
    },
    {
      room: "rm_laundry_dark",
      dir: 0,
      event: () => tooDark
    },
    {
      room: "rm_laundry_dark",
      dir: 1,
      event: () => tooDark
    },
    {
      room: "rm_laundry_dark",
      dir: 2,
      event: () => tooDark
    },
    {
      room: "rm_lodging",
      dir: 2,
      event: () => {
        if (!eventData.unlockedPowerRoom) {
          return {
            overrideResult: true,
            result: "The door is locked. There is a keycard lock next to the door"
          }
        }
        else {
          return null;
        }
      }
    },
  ]
};
