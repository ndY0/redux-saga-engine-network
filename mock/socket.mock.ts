import { EventEmitter } from "events";
import { Socket } from "../src/network/clients/types";

class SocketMock extends EventEmitter implements Socket {
  on = jest.fn((event: string, listener: (...data: unknown[]) => void) => {
    return super.on(event, listener);
  });
  onAny = jest.fn((handler: (event: string, ...data: unknown[]) => void) => {
    return super.on("*", handler);
  });
  emit = jest.fn((event: string, ...data: unknown[]) => {
    super.emit("*", event, ...data);
    return super.emit(event, ...data);
  });
  connect = jest.fn();
  disconnect = jest.fn();
}

export { SocketMock };
