import { SocketClient } from "../src/network/clients/types";
import { SocketManagerMock } from "./socket-manager.mock";

const createManagerMock = jest.fn(() => new SocketManagerMock());

export class SocketClientMock implements SocketClient {
  createManager = createManagerMock;
}
