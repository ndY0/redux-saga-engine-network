/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
import networkManager from "../../manager";
import NetworkManager from "../../manager/manager";
import { Socket } from "../../clients/types";

const registerSocketManager = (
  key: string,
  {
    url,
    port,
    options: { ...options },
  }: {
    url: string;
    port: number;
    options: Record<string | number | symbol, unknown>;
  },
  connectionErrorSaga: (
    error: Error,
    manager: NetworkManager
  ) => Generator = function* () {
    yield null;
  },
  reconnectSuccessSaga: (
    attemptNumber: number,
    manager: NetworkManager
  ) => Generator = function* () {
    yield null;
  },
  reconnectErrorSaga: (
    attemptNumber: number,
    manager: NetworkManager
  ) => Generator = function* () {
    yield null;
  },
  maxReconnectErrorSaga: (
    attemptNumber: number,
    manager: NetworkManager
  ) => Generator = function* () {
    yield null;
  }
): void =>
  networkManager.registerSocketManager(
    key,
    { url, port, options: { ...options } },
    connectionErrorSaga,
    reconnectSuccessSaga,
    reconnectErrorSaga,
    maxReconnectErrorSaga
  );

const registerSocket = (
  managerKey: string,
  socketKey: string,
  namespace: string,
  {
    auth: { ...authOptions },
  }: { auth: Record<string | number | symbol, unknown> } = { auth: {} },
  connectSaga: (socket: Socket) => Generator = function* () {
    yield null;
  },
  disconnectSaga: (
    reason: string,
    manager: NetworkManager
  ) => Generator = function* () {
    yield null;
  }
): void =>
  networkManager.registerSocket(
    managerKey,
    socketKey,
    namespace,
    { auth: { ...authOptions } },
    connectSaga,
    disconnectSaga
  );

const registerSocketEndpoint = (
  endpointName: string,
  socketKey: string,
  emitEventName: string,
  responseSelector: (event: string, ...args: any) => boolean = () => true,
  errorSelector: (event: string, ...args: any) => boolean = () => true
): void =>
  networkManager.registerSocketEndpoint(
    endpointName,
    socketKey,
    emitEventName,
    responseSelector,
    errorSelector
  );

export { registerSocketManager, registerSocket, registerSocketEndpoint };
