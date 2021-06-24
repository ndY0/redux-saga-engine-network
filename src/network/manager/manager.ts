import { call, put, take, spawn, race } from "redux-saga/effects";
import { multicastChannel, SagaMiddleware } from "redux-saga";
import { v1 } from "uuid";
import { SocketClient } from "../clients";
import { Manager, Socket } from "../clients/types";

export default class NetworkManager {
  socketClient: SocketClient;

  sagaMiddleware: SagaMiddleware;

  managers = new Map<string, Manager>();

  sockets = new Map<string, Socket>();

  handlers = new Map<
    string,
    {
      type: "socket" | "http";
      socketKey?: string;
      event?: string;
      handler:
        | ((
            eventSocketKey: string,
            identifiers: string[],
            event: string,
            ...args: unknown[]
          ) => Generator)
        | ((identifier: string, ...args: unknown[]) => Generator);
    }
  >();

  subscriptions = new Map();

  networkChannel = multicastChannel<{
    type: string;
    identifiers: string[];
    data: Record<string | number | symbol, unknown>;
  }>();

  connect(sagaMiddleware: SagaMiddleware, socketClient: SocketClient): void {
    this.sagaMiddleware = sagaMiddleware;
    this.socketClient = socketClient;
    this.sockets.forEach((socket) => socket.connect());
  }

  registerSocketManager(
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
  ): void {
    const manager = this.socketClient.createManager(`${url}:${port}`, {
      ...options,
      autoConnect: false,
    });
    manager.on("error", (error) => {
      this.sagaMiddleware.run(function* () {
        yield call<
          (...args: unknown[]) => unknown
        >(connectionErrorSaga, error, manager);
      });
    });
    manager.on("reconnect", (attemptNumber) => {
      this.sagaMiddleware.run(function* () {
        yield call<
          (...args: unknown[]) => unknown
        >(reconnectSuccessSaga, attemptNumber, manager);
      });
    });
    manager.on("reconnect_error", (attemptNumber) => {
      this.sagaMiddleware.run(function* () {
        yield call<
          (...args: unknown[]) => unknown
        >(reconnectErrorSaga, attemptNumber, manager);
      });
    });
    manager.on("reconnect_failed", (attemptNumber) => {
      this.sagaMiddleware.run(function* () {
        yield call<
          (...args: unknown[]) => unknown
        >(maxReconnectErrorSaga, attemptNumber, manager);
      });
    });
    this.managers.set(key, manager);
  }

  registerSocket(
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
  ): void {
    const manager = this.managers.get(managerKey);
    if (!manager) {
      throw new Error(`no manager registered at key ${managerKey}`);
    }
    const socket = manager.socket(namespace, { ...authOptions });

    socket.on("connect", () => {
      this.sagaMiddleware.run(function* () {
        yield call(connectSaga, socket);
      });
    });
    socket.on("disconnect", (reason) => {
      this.sagaMiddleware.run(function* () {
        yield call<
          (...args: unknown[]) => unknown
        >(disconnectSaga, reason, socket);
      });
    });

    socket.onAny((event, ...args) => {
      this.handlers.forEach((handler) => {
        if (handler.type === "socket") {
          const subscriptionToNotify = [];
          this.subscriptions.forEach((sub, key, map) => {
            if (
              sub.eventSocketKey === socketKey &&
              sub.event === handler.event
            ) {
              subscriptionToNotify.push(sub);
              map.delete(key);
            }
          });
          this.sagaMiddleware.run(
            handler.handler,
            socketKey,
            subscriptionToNotify.map((sub) => sub.identifier),
            event,
            ...args
          );
        }
      });
    });

    this.sockets.set(socketKey, socket);
  }

  registerSocketEndpoint(
    endpointName: string,
    socketKey: string,
    emitEventName: string,
    selector: (event: string, ...args: unknown[]) => boolean = () => true
  ): void {
    const socket = this.sockets.get(socketKey);
    if (!socket) {
      throw new Error(`no socket registered at key ${socketKey}`);
    }
    if (this.handlers.has(endpointName)) {
      throw new Error(`${endpointName} endpoint already registered`);
    }
    const localRef = this.networkChannel;
    this.handlers.set(endpointName, {
      type: "socket",
      socketKey,
      event: emitEventName,
      *handler(
        eventSocketKey: string,
        identifiers: string[],
        event: string,
        ...args: unknown[]
      ) {
        if (eventSocketKey === socketKey && selector(event, ...args)) {
          yield put(localRef, {
            type: endpointName,
            identifiers,
            data: { ...args },
          });
        }
      },
    });
  }

  registerApiEndpoint(
    endpointName: string,
    func: (...args: unknown[]) => unknown
  ): void {
    if (this.handlers.has(endpointName)) {
      throw new Error(`${endpointName} endpoint already registered`);
    }
    const localRef = this.networkChannel;
    this.handlers.set(endpointName, {
      type: "http",
      *handler(identifier: string, ...args: unknown[]) {
        yield spawn(function* () {
          try {
            const res = yield call(func, ...args);
            yield put(localRef, {
              type: endpointName,
              identifiers: [identifier],
              data: res,
            });
          } catch (e) {
            yield put(localRef, {
              type: `${endpointName}_error`,
              identifiers: [identifier],
              data: e,
            });
          }
        });
      },
    });
  }

  *put(
    [endpoint, identifier]: [string, string],
    ...args: unknown[]
  ): Generator {
    if (!this.handlers.has(endpoint)) {
      throw new Error(`no endpoint registered at key ${endpoint}`);
    }
    const handler = this.handlers.get(endpoint);
    if (handler.type === "socket") {
      const socket = this.sockets.get(handler.socketKey);
      this.subscriptions.set(v1(), {
        eventSocketKey: handler.socketKey,
        event: handler.event,
        identifier,
      });
      yield call([socket, socket.emit], handler.event, ...args);
    } else {
      yield call(handler.handler, identifier, ...args);
    }
    return identifier;
  }

  *take(endpoint: string, identifier: string): Generator {
    if (!this.handlers.has(endpoint)) {
      throw new Error(`no endpoint registered at key ${endpoint}`);
    }
    const results = yield race({
      result: take(
        this.networkChannel,
        (args: {
          type: string;
          identifiers: string[];
          data: Record<string | number | symbol, unknown>;
        }) =>
          identifier
            ? args.type === endpoint &&
              args.identifiers.some((haye) => identifier === haye)
            : args.type === endpoint
      ),
      error: take(
        this.networkChannel,
        (args: {
          type: string;
          identifiers: string[];
          data: Record<string | number | symbol, unknown>;
        }) =>
          identifier
            ? args.type === `${endpoint}_error` &&
              args.identifiers.some((haye) => identifier === haye)
            : args.type === `${endpoint}_error`
      ),
    });
    const { result, error } = <
      {
        result?: { data: Record<string | number | symbol, unknown> };
        error?: { data: Record<string | number | symbol, unknown> };
      }
    >results;
    if (error) {
      throw error.data;
    }
    return result.data;
  }
}
