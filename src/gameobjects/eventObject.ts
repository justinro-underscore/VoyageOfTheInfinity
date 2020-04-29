/**
 * Defines how an event object should be defined
 */
export interface EventObject {
  useEvents: { // Events that occur when an object is used by itself or with another object
    useObj: string; // ID of the main object to use
    withObj?: string; // ID of the object the useObj is being used on (if null, use object by itself)
    event: () => string; // Defines what happens when the object(s) is used (return null if you want to say you cannot use these objects)
  }[];
  commandEvents?: { // Events that occur when a command is executed on an object
    command: string; // The command that triggers this event
    events: { // List of events that occur when this command is used on the given object
      useObj: string; // ID of the object that is being commanded upon
      event: () => string; // Defines what happens when the object is triggered (return null if you want to run the normal functionality of the command)
    }[];
  }[];
  moveEvents?: { // Events that occur when trying to move from a room NOTE: Occurs before the move takes place!
    room: string; // The room that the event is triggered in
    dir: number; // The direction that the move is taking place: {0: North, 1: East, 2: South, 3: West}
    event: () => MoveEventResultObject; // Defines what happens when the direction is taken (return null if nothing is to happen)
  }[];
}

/**
 * Defines the return object of a move event
 */
export interface MoveEventResultObject {
  overrideResult: boolean; // If true, only show the result of this object. Otherwise, show result + normal move result
  result: string; // The result shown to the user (can be "" if normal functionality is desired)
}
