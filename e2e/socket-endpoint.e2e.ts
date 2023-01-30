import { Store, createStore, combineReducers, applyMiddleware } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import UUID from "pure-uuid";
import manager from "../src/network/manager";
import { SocketClientMock } from "../mock/socket-client.mock";
import { SocketClient } from "../src/network/clients/types";
import {
  registerSocketManager,
  registerSocketEndpoint,
  registerSocket,
} from "../src/network/helpers/socket";
import { connect } from "../src/network/helpers/manager";
import {
  putNetwork,
  takeNetwork,
  callNetwork,
  takeEveryNetwork,
  spawnEveryNetwork,
} from "../src/network/effects";
import { registerApiEndpoint } from "../src/network/helpers/http";
import { all } from "redux-saga/effects";

describe("socket endpoint", () => {
  let store: Store;
  let socketClient: SocketClient;
  let sagaMiddleware: SagaMiddleware;
  beforeAll(() => {
    sagaMiddleware = createSagaMiddleware();
    socketClient = new SocketClientMock();
    connect(sagaMiddleware, socketClient);
    store = createStore(
      combineReducers({ test: (state) => ({ ...state }) }),
      {},
      applyMiddleware(sagaMiddleware)
    );
    registerSocketManager("test", {
      url: "http://localhost",
      port: 8080,
      options: {},
    });
    registerSocket("test", "test", "baseNamespace", { auth: {} });
    registerSocketEndpoint(
      "testSocket",
      "test",
      "emitEvent",
      (event: string) => {
        return event === "emitEvent";
      },
      (event: string) => {
        return event === "error";
      }
    );
    registerSocketEndpoint(
      "testSocket2",
      "test",
      "emitEvent2",
      (event: string) => {
        return event === "emitEvent2";
      },
      (event: string) => {
        return event === "error";
      }
    );
    registerSocketEndpoint(
      "testSocketError",
      "test",
      "error",
      (event: string) => {
        return event === "emitEvent2";
      },
      (event: string) => {
        return event === "error";
      }
    );
    registerApiEndpoint("test", function () {
      return undefined;
    });
  });
  it("should allow take to receive the result returned by a put for a socket endpoint, on multiple points", (done) => {
    const passedIdentifier = (new UUID(4)).toString();
    sagaMiddleware.run(function* () {
      const result = yield all([
        takeNetwork("testSocket", passedIdentifier),
        takeNetwork("testSocket", passedIdentifier),
      ]);
      expect(result).toEqual([
        ["test", { test: "test" }],
        ["test", { test: "test" }],
      ]);
      done();
    });
    sagaMiddleware.run(function* () {
      //shouldnt trigger any take since none is registered
      yield putNetwork(["testSocket2", passedIdentifier], "test", {
        test: "test",
      });
      const identifier = yield putNetwork(
        ["testSocket", passedIdentifier],
        "test",
        {
          test: "test",
        }
      );
      const subscriptions = Reflect.get(manager, "subscriptions");
      expect(subscriptions.size).toEqual(0);
      expect(identifier).toEqual(passedIdentifier);
    });
  });
  it("should allow take to receive the error returned by a put for a socket endpoint", (done) => {
    const passedIdentifier = (new UUID(4)).toString();
    sagaMiddleware.run(function* () {
      try {
        yield takeNetwork("testSocketError", passedIdentifier);
      } catch (data) {
        expect(data).toEqual(["test", { test: "test" }]);
      }
      done();
    });
    sagaMiddleware.run(function* () {
      //shouldnt trigger any take since none is registered
      yield putNetwork(["testSocketError", passedIdentifier], "test", {
        test: "test",
      });
      const identifier = yield putNetwork(
        ["testSocket", passedIdentifier],
        "test",
        {
          test: "test",
        }
      );
      const subscriptions = Reflect.get(manager, "subscriptions");
      expect(subscriptions.size).toEqual(0);
      expect(identifier).toEqual(passedIdentifier);
    });
  });
  it("should allow to put and wait for answer with callNetwork effect for a socket endpoint", (done) => {
    sagaMiddleware.run(function* () {
      const result = yield callNetwork("testSocket", "test", {
        test: "test",
      });
      expect(result).toEqual(["test", { test: "test" }]);
      const subscriptions = Reflect.get(manager, "subscriptions");
      expect(subscriptions.size).toEqual(0);
      done();
    });
  });
  it("should allow to take every result of a socket endpoint ", (done) => {
    let counter = 0;
    sagaMiddleware.run(function* () {
      yield takeEveryNetwork("testSocket", function* (args) {
        counter += 1;
        expect(args).toEqual(["test", { test: "test" }]);
        if (counter === 3) {
          const subscriptions = Reflect.get(manager, "subscriptions");
          expect(subscriptions.size).toEqual(0);
          done();
        }
      });
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["testSocket"], "test", { test: "test" });
      yield putNetwork(["testSocket"], "test", { test: "test" });
      yield putNetwork(["testSocket"], "test", { test: "test" });
    });
  });
  it("should allow to take every error of a socket endpoint ", (done) => {
    sagaMiddleware.run(function* () {
      yield takeEveryNetwork(
        "testSocketError",
        function* () {
          yield undefined;
        },
        function* (args) {
          expect(args).toEqual(["test", { test: "test" }]);
          console.log("reached end condition");
          const subscriptions = Reflect.get(manager, "subscriptions");
          expect(subscriptions.size).toEqual(0);
          done();
        }
      );
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["testSocketError"], "test", { test: "test" });
    });
  });
  it("should allow to spawn every result of a socket endpoint ", (done) => {
    let counter = 0;
    sagaMiddleware.run(function* () {
      yield spawnEveryNetwork("testSocket", function* (args) {
        counter += 1;
        expect(args).toEqual(["test", { test: "test" }]);
        if (counter === 3) {
          const subscriptions = Reflect.get(manager, "subscriptions");
          expect(subscriptions.size).toEqual(0);
          done();
        }
      });
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["testSocket"], "test", { test: "test" });
      yield putNetwork(["testSocket"], "test", { test: "test" });
      yield putNetwork(["testSocket"], "test", { test: "test" });
    });
  });
  it("should allow to spawn every error of a socket endpoint ", (done) => {
    sagaMiddleware.run(function* () {
      yield spawnEveryNetwork(
        "testSocketError",
        function* () {
          yield undefined;
        },
        function* (args) {
          expect(args).toEqual(["test", { test: "test" }]);
          const subscriptions = Reflect.get(manager, "subscriptions");
          expect(subscriptions.size).toEqual(0);
          done();
        }
      );
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["testSocketError"], "test", { test: "test" });
    });
  });
});
