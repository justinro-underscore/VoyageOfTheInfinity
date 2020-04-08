import { MapHandler } from "../../handler/mapHandler";

export const TestingEventMap: {events: {useObj: string, withObj?: string, event: () => string}[]} = {
  events: [
    {
      useObj: "obj_key1",
      withObj: "obj_door1",
      event: () => {
        let room = MapHandler.getGameMap().rooms.get("rm_bottom_left");
        room.desc = "This room is in the corner and not directly connected to anything else\nThere are exits to the east, north, and south";
        room.setExit("south", "rm_unlocked_room");
        return `You unlocked the door!\n\n${ MapHandler.getCurrRoomInfo(true) }`;
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
    }
  ]
};
