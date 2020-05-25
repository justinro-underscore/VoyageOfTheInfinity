import { EventObject, MoveEventResultObject } from "../../gameobjects/eventObject";
import { MapHandler } from "../../handler/mapHandler";
import { RoomExitStatus } from "../../gameobjects/room";
import { GameObject } from "../../gameobjects/gameObject";

/**
 * Used to define any data that should be kept track of
 */
const eventData = {
  destroyedRubbleToA: false,
  unlockedPowerRoom: false,
  spawnedFitnessOpenLocker: false,
  spawnedEngineerKeycard: false,
  turnedPowerPipe: false,
  powerPipeStatus: [false, false, false, false],
  waterFilledRoomBio: true
}

// "desc": "This room is used to keep crew members in peak physical condition during long expeditions.\nThere is a shower in the corner, a row of lockers, and various fitness equipment scattered around the area",

const tooDark: MoveEventResultObject = {
  overrideResult: true,
  result: "It's too dark to move around the room"
}

/**
 * Check if the power pipes are activated
 */
const checkPowerPipeStatus = () => {
  let powerActivate = [false, true, true, false];
  for (let i = 0; i < 4; i++) {
    if (eventData.powerPipeStatus[i] != powerActivate[i]) {
      return false;
    }
  }
  return true;
}

const powerPipeUse = (powerPipeIndex: number) => {
  if (!checkPowerPipeStatus()) {
    let pipeIndexChar = "";
    switch (powerPipeIndex) {
      case 0:
        pipeIndexChar = "a";
        break;
      case 1:
        pipeIndexChar = "b";
        break;
      case 2:
        pipeIndexChar = "c";
        break;
      case 3:
        pipeIndexChar = "d";
        break;
      default:
        console.error(`PowerPipeUse function invoked with invalid pipe index {${ powerPipeIndex }}`);
        return;
    }
    let pipe = MapHandler.getObjectFromID(`obj_power_pipe_${ pipeIndexChar }`);

    let res = "";
    if (!eventData.turnedPowerPipe) {
      res += "The wrench fits perfectly on the square knob of the pipe!\n";
      eventData.turnedPowerPipe = true;
    }
    eventData.powerPipeStatus[powerPipeIndex] = !eventData.powerPipeStatus[powerPipeIndex];

    res += "With some effort, the knob creaks to the side, ";
    if (eventData.powerPipeStatus[powerPipeIndex]) {
      res += "releasing the flow of the pipe"
      pipe.desc += ". The sound of flowing material can be heard in the pipe";
    }
    else {
      res += "stopping the flow of the pipe"
      pipe.desc = pipe.desc.replace(". The sound of flowing material can be heard in the pipe", "");
    }

    if (checkPowerPipeStatus()) {
      res += "\n\nWith a clunk, there's a loud noise and the ambient light in the room seems to brighten";

      let room = MapHandler.getRoom("rm_lodging");
      room.desc = "This room is where crew members can relax, catch up on rest, or enjoy leisure time. Light shines around the room, lighting up exits to the north and west, and doors leading east and south";

      room.exits[0][0] = "rm_cafe";
      room.exits[1][0] = "rm_laundry";

      MapHandler.getRoom("rm_chambers").desc = "This room holds passengers during cryosleep. The room is brightly lit, and features eight pods situated in a circle around a central pillar.\nA large doorway leads to the west, but it is blocked by a pile of rubble. There are exits to the north, east, and south";

      MapHandler.getRoom("rm_fitness").desc = "This room is used to keep crew members in peak physical condition during long expeditions. In the room are a variety of exercise equipment, along with a row of lockers on the opposite wall and a shower in the corner. A door leads to the south";
    }
    return res;
  }
  else {
    return "The power is already on"
  }
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
    },
    {
      useObj: "obj_wrench",
      withObj: "obj_power_pipe_a",
      event: () => powerPipeUse(0)
    },
    {
      useObj: "obj_wrench",
      withObj: "obj_power_pipe_b",
      event: () => powerPipeUse(1)
    },
    {
      useObj: "obj_wrench",
      withObj: "obj_power_pipe_c",
      event: () => powerPipeUse(2)
    },
    {
      useObj: "obj_wrench",
      withObj: "obj_power_pipe_d",
      event: () => powerPipeUse(3)
    },
    {
      useObj: "obj_water_valve",
      event: () => {
        let bioFilled = eventData.waterFilledRoomBio;
        MapHandler.getRoom("rm_water").setExitStatus("east", bioFilled ? RoomExitStatus.UNLOCKED : RoomExitStatus.JAMMED);
        MapHandler.getRoom("rm_cafe").setExitStatus("east", bioFilled ? RoomExitStatus.JAMMED : RoomExitStatus.UNLOCKED);
        MapHandler.getRoom("rm_bio").setExitStatus("south", bioFilled ? RoomExitStatus.JAMMED : RoomExitStatus.UNLOCKED);
        MapHandler.getRoom("rm_garden").setExitStatus("north", bioFilled ? RoomExitStatus.UNLOCKED : RoomExitStatus.JAMMED);

        eventData.waterFilledRoomBio = !bioFilled;
        if (bioFilled) {
          return "There's a loud whooshing sound as the door to your east opens";
        }
        else {
          return "There's a loud whooshing sound as the door to your east slams shut";
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
        },
        {
          useObj: "obj_wrench",
          event: () => {
            let room = MapHandler.getRoom("rm_power");
            room.desc = room.desc.replace("a wrench laying on the floor", "the room around");
            room.desc = room.desc.replace("a wrench on the floor next to a scrap of paper", "a small scrap of paper on the floor");
            return null;
          }
        },
        {
          useObj: "obj_power_scrap",
          event: () => {
            let room = MapHandler.getRoom("rm_power");
            room.desc = room.desc.replace("a small scrap of paper on the floor", "the room around");
            room.desc = room.desc.replace("a wrench on the floor next to a scrap of paper", "a wrench laying on the floor");
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
