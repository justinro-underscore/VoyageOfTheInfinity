import { EventObject } from "../../gameobjects/eventObject";
import { MapHandler } from "../../handler/mapHandler";
import { RoomExitStatus } from "../../gameobjects/room";
import { GameObject } from '../../gameobjects/gameObject';
import { InventoryHandler } from '../../handler/inventoryHandler';

export const TestingEventMap: EventObject = {
  useEvents: [
    {
      useObj: "obj_key1",
      withObj: "obj_door1",
      event: () => {
        let room = MapHandler.getRoom("rm_bottom_left");
        room.desc = "This room is in the corner and not directly connected to anything else\nThere are exits to the east, north, and south";
        room.setExitStatus("south", RoomExitStatus.UNLOCKED);
        return `You unlocked the door!`;
      }
    },
    {
      useObj: "obj_weapon",
      event: () => {
        return `You swing the sword wildly`;
      }
    },
    {
      useObj: "obj_use_test_1_use",
      withObj: "obj_use_test_1_with",
      event: () => {
        return `Used Use with With!`;
      }
    },
    {
      useObj: "obj_use_test_2_use_1",
      withObj: "obj_use_test_2_with",
      event: () => {
        return `Used Use 1 with With!`;
      }
    },
    {
      useObj: "obj_use_test_2_use_2",
      withObj: "obj_use_test_2_with",
      event: () => {
        return `Used Use 2 with With!`;
      }
    },
    {
      useObj: "obj_use_test_3_use",
      withObj: "obj_use_test_3_with_1",
      event: () => {
        return `Used Use with With 1!`;
      }
    },
    {
      useObj: "obj_use_test_3_use",
      withObj: "obj_use_test_3_with_2",
      event: () => {
        return `Used Use with With 2!`;
      }
    },
    {
      useObj: "obj_use_test_4_use_1",
      withObj: "obj_use_test_4_with_1",
      event: () => {
        return `Used Use 1 with With 1!`;
      }
    },
    {
      useObj: "obj_use_test_4_use_2",
      withObj: "obj_use_test_4_with_1",
      event: () => {
        return `Used Use 2 with With 1!`;
      }
    },
    {
      useObj: "obj_use_test_4_use_1",
      withObj: "obj_use_test_4_with_2",
      event: () => {
        return `Used Use 1 with With 2!`;
      }
    },
    {
      useObj: "obj_use_test_4_use_2",
      withObj: "obj_use_test_4_with_2",
      event: () => {
        return `Used Use 2 with With 2!`;
      }
    },
    {
      useObj: "obj_idol",
      withObj: "obj_pedestal",
      event: () => {
        if (MapHandler.getRoom("rm_ne").exits[1][1] === RoomExitStatus.LOCKED) { // Idol has not been taken
          return null;
        }
        return "You cannot place the idol back on the pedestal";
      }
    }
  ],
  commandEvents: [
    {
      command: "examine",
      events: [
        {
          useObj: "obj_spawner",
          event: () => {
            if (MapHandler.getObjectFromID("obj_new_obj") === null && InventoryHandler.getObjectFromID("obj_new_obj") === null) {
              let room = MapHandler.getRoom("rm_ne");
              let obj = new GameObject({
                id: "obj_new_obj",
                name: "New Object",
                altNames: [],
                desc: "This object was created from the spawner!",
                pickupable: true
              });
              room.addObject(obj);
              return `An object has been spawned!`;
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
          useObj: "obj_idol",
          event: () => {
            if (MapHandler.getRoom("rm_ne").exits[1][1] === RoomExitStatus.LOCKED) {
              let idol = MapHandler.getObjectFromID("obj_idol");
              InventoryHandler.addObject(idol);
              MapHandler.removeObject(idol);
              idol.desc = "The idol is blazingly gold";
              MapHandler.getObjectFromID("obj_pedestal").desc = "An ornate pedestal that used to hold the idol. It warns you that you are an idiot";
              MapHandler.getRoom("rm_ne").setExitStatus("east", RoomExitStatus.UNLOCKED);
              return "As you remove the idol from its pedestal, an inlet on the top of the pedestal depresses. There is a rumbling and the door next to you opens...";
            }
            return null;
          }
        },
        {
          useObj: "obj_boulder",
          event: () => {
            return "I'm sorry, did you just try to pick up this boulder?";
          }
        }
      ]
    }
  ]
};
