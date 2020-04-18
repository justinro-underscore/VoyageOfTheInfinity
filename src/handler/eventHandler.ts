import { EventObject } from '../gameobjects/eventObject';
import { GameObject } from "../gameobjects/gameObject";
import { TestingEventMap } from "../gameinfo/events/testingEvents";

/**
 * Handles all events
 * An event is described as a manipulation of the game world due to using two objects
 */
export class EventHandler {
  private static multipleObjsEventMap: Map<string, () => string>; // Links use objects and with objects (format: "${ use_obj } ${ with_obj }") with their event
  private static singleObjEventMap: Map<string, () => string>; // Links use objects that can be used on their own with their event
  private static commandEventMap: Map<string, Map<string, () => string>>; // Links commands and their objects to events
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
      EventHandler.commandEventMap = new Map<string, Map<string, () => string>>();

      let eventObj = this.availableEventMaps.get(eventMapKey);
      // Add use events
      eventObj.useEvents.forEach(eventData => {
        if (eventData.hasOwnProperty("withObj")) {
          EventHandler.multipleObjsEventMap.set(`{${ eventData.useObj }} {${ eventData.withObj }}`, eventData.event); // Where the key format is defined
        }
        else {
          EventHandler.singleObjEventMap.set(`${ eventData.useObj }`, eventData.event); // Where the key format is defined
        }
      });
      // Add general command events
      if (eventObj.commandEvents != null) {
        eventObj.commandEvents.forEach(commandData => {
          if (!EventHandler.commandEventMap.has(commandData.command)) { // Check that command is instantiated
            EventHandler.commandEventMap.set(commandData.command, new Map<string, () => string>());
          }
          let eventMap = EventHandler.commandEventMap.get(commandData.command);
          commandData.events.forEach(eventData => {
            if (eventMap.has(eventData.useObj)) { // Cannot have conflicting events
              console.error(`Command event {${ commandData.command }} for object {${ eventData.useObj }} defined more than once!`);
            }
            else {
              eventMap.set(eventData.useObj, eventData.event);
            }
          });
        });
      }
    }
  }

  /**
   * Attempts to run an event given one or two objects
   * @param useObject The object being used
   * @param withObject The object being used on, if none provided tries to use useObj on its own
   * @returns The outcome of the event
   */
  static runUseEvent(useObject: GameObject, withObject?: GameObject): string {
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

  /**
   * Attempts to run an event from a command on a given object
   * @param command The command being run on the object
   * @param useObject The object being acted upon
   * @returns The outcome of the event, or null if the standard functionality of command should be executed
   */
  static runCommandEvent(command: string, useObject: GameObject): string {
    if (EventHandler.commandEventMap.has(command)) {
      let eventMap = EventHandler.commandEventMap.get(command);
      if (eventMap.has(useObject.id)) {
        return eventMap.get(useObject.id)();
      }
      return null;
    }
    return null;
  }
}
