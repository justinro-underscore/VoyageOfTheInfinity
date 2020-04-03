import { GameObject } from "../gameobjects/gameObject";
import { TestingEventMap } from "../gameinfo/events/testingEvents";

/**
 * Handles all events
 * An event is described as a manipulation of the game world due to using two objects
 */
export class EventHandler {
  private static eventMap: Map<string, () => string>; // Links use objects (format: "${ use_obj } ${ with_obj }") with their event
  /*
   * Can have multiple event maps for different scenarios. Links keys with their event maps
   */
  private static availableEventMaps: Map<string, {events: {useObj: string, withObj: string, event: () => string}[]}> = new Map([
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
      EventHandler.eventMap = new Map<string, () => string>();
      EventHandler.availableEventMaps.get(eventMapKey).events.forEach(eventData => {
        EventHandler.eventMap.set(`{${ eventData.useObj }} {${ eventData.withObj }}`, eventData.event); // Where the key format is defined
      });
    }
  }

  /**
   * Attempts to run an event given two objects
   * @param useObject The object being used
   * @param withObject The object being used on
   * @returns The outcome of the event
   */
  static runEvent(useObject: GameObject, withObject: GameObject): string {
    let key = `{${ useObject.id }} {${ withObject.id }}`;
    if (EventHandler.eventMap.has(key)) {
      return EventHandler.eventMap.get(key)();
    }
    else if (EventHandler.eventMap.has(`{${ withObject.id }} {${ useObject.id }}`)) {
      return `Cannot use ${ useObject.name } with ${ withObject.name } (Hint: try reversing them)`;
    }
    else {
      return `Cannot use ${ useObject.name } with ${ withObject.name }`;
    }
  }
}
