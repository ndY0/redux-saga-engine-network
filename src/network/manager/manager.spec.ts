import "reflect-metadata";
import createSagaMiddleware from "redux-saga";
import NetworkManager from "./manager";
import { SocketClientMock } from "../../../mock/socket-client.mock";
import { SocketManagerMock } from "../../../mock/socket-manager.mock";
import { v1 } from "uuid";

describe("NetworkManager", () => {
  it("should instanciate with its registers for divers managers, subscriptions and handlers", () => {
    const networkManager = new NetworkManager();
    expect(Reflect.get(networkManager, "managers")).toBeInstanceOf(Map);
    expect(Reflect.get(networkManager, "sockets")).toBeInstanceOf(Map);
    expect(Reflect.get(networkManager, "handlers")).toBeInstanceOf(Map);
    expect(Reflect.get(networkManager, "subscriptions")).toBeInstanceOf(Map);
    expect(
      Reflect.get(networkManager, "networkChannel")["@@redux-saga/MULTICAST"]
    ).toEqual(true);
  });
  it("should connect each socket already registered, and reference the socket client and saga middleware", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);
    expect(Reflect.get(networkManager, "sagaMiddleware")).toEqual(
      sagaMiddleware
    );
    expect(Reflect.get(networkManager, "socketClient")).toEqual(
      socketClientMock
    );
  });
  it("should register a socket manager provided its definition", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const effectsList = [];
    sagaMiddleware.run = <any>(
      (<unknown>jest.fn((effect) => effectsList.push(effect)))
    );
    const sagaMiddlewareRunSpy = jest.spyOn(sagaMiddleware, "run");
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );
    const socketClient = Reflect.get(networkManager, "socketClient");
    expect(socketClient.createManager).toHaveBeenCalledTimes(1);
    expect(socketClient.createManager).toHaveBeenCalledWith(
      "http://localhost:8080",
      { autoConnect: false }
    );
    const manager = Reflect.get(networkManager, "managers").get("test");
    expect(manager).toBeDefined();
    expect(manager).toBeInstanceOf(SocketManagerMock);
    expect(manager.on).toHaveBeenCalledTimes(4);
    expect(manager.on).toHaveBeenNthCalledWith(
      1,
      "error",
      expect.any(Function)
    );
    expect(manager.on).toHaveBeenNthCalledWith(
      2,
      "reconnect",
      expect.any(Function)
    );
    expect(manager.on).toHaveBeenNthCalledWith(
      3,
      "reconnect_error",
      expect.any(Function)
    );
    expect(manager.on).toHaveBeenNthCalledWith(
      4,
      "reconnect_failed",
      expect.any(Function)
    );
    manager.emit("error", new Error("test"));
    manager.emit("reconnect", 2);
    manager.emit("reconnect_error", 2);
    manager.emit("reconnect_failed", 2);
    expect(sagaMiddlewareRunSpy).toHaveBeenCalledTimes(4);
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Function)
    );
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Function)
    );
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      3,
      expect.any(Function)
    );
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      4,
      expect.any(Function)
    );
    const errorEffect = effectsList[0]().next().value;
    expect(errorEffect.type).toEqual("CALL");
    expect(errorEffect.payload.fn).toEqual(connectionErrorSaga);
    const reconnectSuccessEffect = effectsList[1]().next().value;
    expect(reconnectSuccessEffect.type).toEqual("CALL");
    expect(reconnectSuccessEffect.payload.fn).toEqual(reconnectSuccessSaga);
    const reconnectionErrorEffect = effectsList[2]().next().value;
    expect(reconnectionErrorEffect.type).toEqual("CALL");
    expect(reconnectionErrorEffect.payload.fn).toEqual(reconnectErrorSaga);
    const maxReconnectErrorEffect = effectsList[3]().next().value;
    expect(maxReconnectErrorEffect.type).toEqual("CALL");
    expect(maxReconnectErrorEffect.payload.fn).toEqual(maxReconnectErrorSaga);
  });
  it("should register a socket provided its definition and managerKey", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const effectsList = [];
    sagaMiddleware.run = <any>(
      (<unknown>jest.fn((effect) => effectsList.push(effect)))
    );
    const sagaMiddlewareRunSpy = jest.spyOn(sagaMiddleware, "run");
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );

    function* connectSaga() {
      return true;
    }
    function* disconnectSaga() {
      return true;
    }

    networkManager.registerSocket(
      "test",
      "test",
      "test",
      { auth: {} },
      connectSaga,
      disconnectSaga
    );

    const manager = Reflect.get(networkManager, "managers").get("test");
    expect(manager.socket).toHaveBeenNthCalledWith(1, "test", {});

    const socket = Reflect.get(networkManager, "sockets").get("test");
    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.on).toHaveBeenNthCalledWith(
      1,
      "connect",
      expect.any(Function)
    );
    expect(socket.on).toHaveBeenNthCalledWith(
      2,
      "disconnect",
      expect.any(Function)
    );
    expect(socket.onAny).toHaveBeenCalledTimes(1);
    expect(socket.onAny).toHaveBeenNthCalledWith(1, expect.any(Function));

    socket.emit("connect", {});
    socket.emit("disconnect", "test", {});
    expect(sagaMiddlewareRunSpy).toHaveBeenCalledTimes(2);
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Function)
    );
    expect(sagaMiddlewareRunSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Function)
    );
    const connectEffect = effectsList[0]().next().value;
    expect(connectEffect.type).toEqual("CALL");
    expect(connectEffect.payload.fn).toEqual(connectSaga);
    const disconnectEffect = effectsList[1]().next().value;
    expect(disconnectEffect.type).toEqual("CALL");
    expect(disconnectEffect.payload.fn).toEqual(disconnectSaga);
  });
  it("should throw an error if the manager specified for registering a socket doesnt exists", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);
    function* connectSaga() {
      return true;
    }
    function* disconnectSaga() {
      return true;
    }

    expect(() =>
      networkManager.registerSocket(
        "test",
        "test",
        "test",
        { auth: {} },
        connectSaga,
        disconnectSaga
      )
    ).toThrowError(new Error("no manager registered at key test"));
  });
  it("should register a socket endpoint given managerKey, socketKey, the event to emit, and the response selector", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );

    function* connectSaga() {
      return true;
    }
    function* disconnectSaga() {
      return true;
    }

    networkManager.registerSocket(
      "test",
      "test",
      "test",
      { auth: {} },
      connectSaga,
      disconnectSaga
    );
    networkManager.registerSocketEndpoint(
      "test",
      "test",
      "test",
      (event: string, data: { type: string }) =>
        event === "reply" && data.type === "test"
    );

    const socketEndpoint = Reflect.get(networkManager, "handlers").get("test");
    expect(socketEndpoint.type).toEqual("socket");
    expect(socketEndpoint.socketKey).toEqual("test");
    expect(socketEndpoint.event).toEqual("test");
    expect(socketEndpoint.handler).toEqual(expect.any(Function));
  });
  it("should throw an exception if socketKey doesnt exists", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );

    expect(() =>
      networkManager.registerSocketEndpoint(
        "test",
        "test",
        "test",
        (event: string, data: { type: string }) =>
          event === "reply" && data.type === "test"
      )
    ).toThrowError(new Error("no socket registered at key test"));
  });
  it("should throw an exception if endpoint name already registered", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );

    function* connectSaga() {
      return true;
    }
    function* disconnectSaga() {
      return true;
    }

    networkManager.registerSocket(
      "test",
      "test",
      "test",
      { auth: {} },
      connectSaga,
      disconnectSaga
    );
    networkManager.registerSocketEndpoint(
      "test",
      "test",
      "test",
      (event: string, data: { type: string }) =>
        event === "reply" && data.type === "test"
    );
    expect(() =>
      networkManager.registerSocketEndpoint(
        "test",
        "test",
        "test",
        (event: string, data: { type: string }) =>
          event === "reply" && data.type === "test"
      )
    ).toThrowError(new Error("test endpoint already registered"));
  });
  it("should register an api endpoint given an endpointName an function to call", () => {
    const networkManager = new NetworkManager();
    function apiEndpointFunc() {
      return undefined;
    }
    networkManager.registerApiEndpoint("test", apiEndpointFunc);
    const apiEndpoint = Reflect.get(networkManager, "handlers").get("test");
    expect(apiEndpoint.type).toEqual("http");
    expect(apiEndpoint.handler).toEqual(expect.any(Function));
  });
  it("should throw an exception if endpoint already registered", () => {
    const networkManager = new NetworkManager();
    function apiEndpointFunc() {
      return undefined;
    }
    networkManager.registerApiEndpoint("test", apiEndpointFunc);
    expect(() =>
      networkManager.registerApiEndpoint("test", apiEndpointFunc)
    ).toThrowError(new Error("test endpoint already registered"));
  });
  it("should yield a call effect with the function of the selected handler if on api endpoint, then return the identifier", () => {
    const networkManager = new NetworkManager();
    function apiEndpointFunc() {
      return undefined;
    }
    networkManager.registerApiEndpoint("test", apiEndpointFunc);
    const identifier = v1();
    const putFactory = networkManager.put(["test", identifier], {
      test: "test",
    });
    const resultEffect = putFactory.next().value;
    expect(resultEffect.type).toEqual("CALL");
    expect(resultEffect.payload.fn).toEqual(expect.any(Function));
    expect(resultEffect.payload.args).toEqual([identifier, { test: "test" }]);

    expect(putFactory.next().value).toEqual(identifier);
  });
  it("should add a subscription with the provided identifier, and return a call effect with the function of the selected handler if socket endpoint", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();

    networkManager.connect(sagaMiddleware, socketClientMock);

    function* connectionErrorSaga() {
      return true;
    }
    function* reconnectSuccessSaga() {
      return true;
    }
    function* reconnectErrorSaga() {
      return true;
    }
    function* maxReconnectErrorSaga() {
      return true;
    }
    networkManager.registerSocketManager(
      "test",
      {
        url: "http://localhost",
        port: 8080,
        options: {},
      },
      connectionErrorSaga,
      reconnectSuccessSaga,
      reconnectErrorSaga,
      maxReconnectErrorSaga
    );

    function* connectSaga() {
      return true;
    }
    function* disconnectSaga() {
      return true;
    }

    networkManager.registerSocket(
      "test",
      "test",
      "test",
      { auth: {} },
      connectSaga,
      disconnectSaga
    );
    networkManager.registerSocketEndpoint(
      "test",
      "test",
      "test",
      (event: string, data: { type: string }) =>
        event === "reply" && data.type === "test"
    );

    const identifier = v1();
    const putFactory = networkManager.put(["test", identifier], {
      test: "test",
    });
    const resultEffect = putFactory.next().value;
    expect(resultEffect.type).toEqual("CALL");
    expect(resultEffect.payload.context.constructor.name).toEqual("SocketMock");
    expect(resultEffect.payload.fn).toEqual(expect.any(Function));
    expect(resultEffect.payload.args).toEqual(["test", { test: "test" }]);

    expect(putFactory.next().value).toEqual(identifier);
  });
  it("should throw an exeption if requested endpoint doesnt exists", () => {
    const networkManager = new NetworkManager();
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();
    networkManager.connect(sagaMiddleware, socketClientMock);
    const identifier = v1();
    const putFactory = networkManager.put(["test", identifier], {
      test: "test",
    });
    expect(() => putFactory.next()).toThrowError(
      new Error("no endpoint registered at key test")
    );
  });
  it("should return a race effect between the result and error listeners", () => {
    const networkManager = new NetworkManager();
    function apiEndpointFunc() {
      return undefined;
    }
    networkManager.registerApiEndpoint("test", apiEndpointFunc);
    const identifier = v1();
    const takeEffect = networkManager.take("test", identifier);
    const raceEffect = takeEffect.next().value;
    expect(raceEffect.type).toEqual("RACE");
    const successEffect = raceEffect.payload.result;
    const errorEffect = raceEffect.payload.error;
    expect(successEffect.type).toEqual("TAKE");
    expect(successEffect.payload.channel["@@redux-saga/MULTICAST"]).toEqual(
      true
    );
    expect(successEffect.payload.pattern).toEqual(expect.any(Function));
    expect(errorEffect.type).toEqual("TAKE");
    expect(errorEffect.payload.channel["@@redux-saga/MULTICAST"]).toEqual(true);
    expect(errorEffect.payload.pattern).toEqual(expect.any(Function));
  });
  it("should throw an error if endpoint doesnt exists", () => {
    const networkManager = new NetworkManager();
    const identifier = v1();
    const takeEffect = networkManager.take("test", identifier);
    expect(() => takeEffect.next()).toThrowError(
      new Error("no endpoint registered at key test")
    );
  });
});
