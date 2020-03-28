import { GameObject } from "../gameobjects/gameObject";
import { TestingEventMap } from "../gameinfo/events/testingEvents";

export class EventHandler {
  private static eventMap: Map<string, () => string>;
  private static availableEventMaps: Map<string, {events: {useObj: string, withObj: string, event: () => string}[]}> = new Map([
    ["testing", TestingEventMap]
  ]);

  static instantiateEventMap(eventMapKey: string) {
    if (!EventHandler.availableEventMaps.has(eventMapKey)) {
      console.error(`Event Map {${ eventMapKey }} does not exist!`)
    }
    else {
      EventHandler.eventMap = new Map<string, () => string>();
      EventHandler.availableEventMaps.get(eventMapKey).events.forEach(eventData => {
        EventHandler.eventMap.set(`${ eventData.useObj } ${ eventData.withObj }`, eventData.event);
      });
    }
  }

  static runEvent(useObject: GameObject, withObject: GameObject): string {
    let key = `${ useObject.id } ${ withObject.id }`;
    if (EventHandler.eventMap.has(key)) {
      return EventHandler.eventMap.get(key)();
    }
    else if (EventHandler.eventMap.has(`${ withObject.id } ${ useObject.id }`)) {
      return `Cannot use ${ useObject.name } with ${ withObject.name } (Hint: try reversing them)`;
    }
    else {
      return `Cannot use ${ useObject.name } with ${ withObject.name }`;
    }
  }
}