import { SagaMiddleware } from "@redux-saga/core";
import { SocketClient } from "../../clients/types";
import manager from "../../manager";

const connect = (
  sagaMiddleware: SagaMiddleware,
  socketClient: SocketClient
): void => {
  manager.connect(sagaMiddleware, socketClient);
};

const disconnect = (): void => {
  manager.disconnect();
};

const flushConfig = (): void => {
  manager.flushConfig();
};

export { connect, disconnect, flushConfig };
