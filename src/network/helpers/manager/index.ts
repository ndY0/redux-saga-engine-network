import { SagaMiddleware } from "@redux-saga/core";
import { SocketClient } from "../../clients/types";
import manager from "../../manager";

const connect = (
  sagaMiddleware: SagaMiddleware,
  socketClient: SocketClient
): void => {
  manager.connect(sagaMiddleware, socketClient);
};

export { connect };
