import { EventObject } from "../gameobjects/eventObject";
import { GameObject } from "../gameobjects/gameObject";
import { TestingEventMap } from "../gameinfo/events/testingEvents";

/**
 * Handles all events
 * An event is described as a manipulation of the game world due to using two objects
 */
export class EventHandler {
  private static multipleObjsEventMap: Map<string, () => string>; // Links use objects and with objects (format: "${ use_obj } ${ with_obj }") with their event
  private static singleObjEventMap: Map<string, () => string>; // Links use objects that can be used on their own with their event
  /*
   * Can have multiple event maps for different scenarios. Links keys with their event maps
   */
  private static availableEventMaps: Map<string, EventObject> = new Map([
    ["testing", TestingEventMap]
  ]);

  /**
   * Sets the currently used event map based on a key
   * @param eventMapKey The key relating to the event map to instantiate
   */
  static instantiateEventMap(eventMapKey: string) {
    if (!EventHandler.availableEventMaps.has(eventMapKey)) {
      console.error(`Event Map {${ eventMapKey }} does not exist!`)
    }
    else {
      EventHandler.multipleObjsEventMap = new Map<string, () => string>();
      EventHandler.singleObjEventMap = new Map<string, () => string>();
      EventHandler.availableEventMaps.get(eventMapKey).events.forEach(eventData => {
        if (eventData.hasOwnProperty("withObj")) {
          EventHandler.multipleObjsEventMap.set(`{${ eventData.useObj }} {${ eventData.withObj }}`, eventData.event); // Where the key format is defined
        }
        else {
          EventHandler.singleObjEventMap.set(`${ eventData.useObj }`, eventData.event); // Where the key format is defined
        }
      });
    }
  }

  /**
   * Attempts to run an event given one or two objects
   * @param useObject The object being used
   * @param withObject The object being used on, if none provided tries to use useObj on its own
   * @returns The outcome of the event
   */
  static runEvent(useObject: GameObject, withObject?: GameObject): string {
    if (withObject != null) {
      let key = `{${ useObject.id }} {${ withObject.id }}`;
      if (EventHandler.multipleObjsEventMap.has(key)) {
        return EventHandler.multipleObjsEventMap.get(key)();
      }
      else if (EventHandler.multipleObjsEventMap.has(`{${ withObject.id }} {${ useObject.id }}`)) {
        return `Cannot use ${ useObject.name } with ${ withObject.name } (Hint: try reversing them)`;
      }
      else {
        return `Cannot use ${ useObject.name } with ${ withObject.name }`;
      }
    }
    else {
      if (EventHandler.singleObjEventMap.has(useObject.id)) {
        return EventHandler.singleObjEventMap.get(useObject.id)();
      }
      else {
        return `Cannot use ${ useObject.name } on its own`;
      }
    }
  }
}
