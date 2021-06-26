import { EventEmitter } from "events";
import { Manager } from "../src/network/clients/types";
import { SocketMock } from "./socket.mock";

class SocketManagerMock extends EventEmitter implements Manager {
  on = jest.fn((event: string, listener: (...data: unknown[]) => void) => {
    return super.on(event, listener);
  });
  socket = jest.fn(() => new SocketMock());
}

export { SocketManagerMock };
