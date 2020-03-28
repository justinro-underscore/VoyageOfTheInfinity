import { MapHandler } from "../../handler/mapHandler";

export const TestingEventMap: {events: {useObj: string, withObj: string, event: () => string}[]} = {
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
    }
  ]
};