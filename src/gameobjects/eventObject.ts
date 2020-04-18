/**
 * Defines how an event object should be defined
 */
export interface EventObject {
  events: {
    useObj: string, // The main object to use
    withObj?: string, // The object the useObj is being used on (if null, use object by itself)
    event: () => string // Defines what happens when the object(s) is used
  }[];
}
