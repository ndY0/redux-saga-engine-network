import { Manager, Socket } from "./types";

abstract class SocketClient implements SocketClient {
  abstract createManager<T>(uri: string, options: Partial<T>): Manager;
}

export { SocketClient, Manager, Socket };
