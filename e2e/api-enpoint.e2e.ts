import { Store, createStore, combineReducers, applyMiddleware } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { v1 } from "uuid";
import { SocketClientMock } from "../mock/socket-client.mock";
import { SocketClient } from "../src/network/clients/types";
import { registerApiEndpoint } from "../src/network/helpers/http";
import { connect } from "../src/network/helpers/manager";
import {
  putNetwork,
  takeNetwork,
  callNetwork,
  takeEveryNetwork,
  spawnEveryNetwork,
} from "../src/network/effects";

describe("api endpoint", () => {
  let store: Store;
  let socketClient: SocketClient;
  let sagaMiddleware: SagaMiddleware;
  beforeAll(() => {
    function apiEndpointFunc(...args: unknown[]) {
      return args;
    }
    function apiEndpointErrorFunc() {
      throw new Error("error");
    }
    registerApiEndpoint("test", apiEndpointFunc);
    registerApiEndpoint("testError", apiEndpointErrorFunc);
    socketClient = new SocketClientMock();
    sagaMiddleware = createSagaMiddleware();
    connect(sagaMiddleware, socketClient);
    store = createStore(
      combineReducers({ test: (state) => ({ ...state }) }),
      {},
      applyMiddleware(sagaMiddleware)
    );
  });
  it("should allow take to receive the result returned by a put for an api endpoint", (done) => {
    const passedIdentifier = v1();
    sagaMiddleware.run(function* () {
      const result = yield takeNetwork("test", passedIdentifier);
      expect(result).toEqual(["test", { test: "test" }]);
      done();
    });
    sagaMiddleware.run(function* () {
      const identifier = yield putNetwork(["test", passedIdentifier], "test", {
        test: "test",
      });
      expect(identifier).toEqual(passedIdentifier);
    });
  });
  it("should allow to put and wait for answer with callNetwork effect for an api endpoint", (done) => {
    sagaMiddleware.run(function* () {
      const result = yield callNetwork("test", "test", {
        test: "test",
      });
      expect(result).toEqual(["test", { test: "test" }]);
      done();
    });
  });
  it("should allow to take every result of an api endpoint ", (done) => {
    let counter = 0;
    sagaMiddleware.run(function* () {
      yield takeEveryNetwork("test", function* (args) {
        counter += 1;
        expect(args).toEqual(["test", { test: "test" }]);
        if (counter === 3) {
          done();
        }
      });
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["test"], "test", { test: "test" });
      yield putNetwork(["test"], "test", { test: "test" });
      yield putNetwork(["test"], "test", { test: "test" });
    });
  });
  it("should allow to spawn every result of an api endpoint ", (done) => {
    let counter = 0;
    sagaMiddleware.run(function* () {
      yield spawnEveryNetwork("test", function* (args) {
        counter += 1;
        expect(args).toEqual(["test", { test: "test" }]);
        if (counter === 3) {
          done();
        }
      });
    });
    sagaMiddleware.run(function* () {
      yield putNetwork(["test"], "test", { test: "test" });
      yield putNetwork(["test"], "test", { test: "test" });
      yield putNetwork(["test"], "test", { test: "test" });
    });
  });
  it("should throw an error on take if an error occur during network call", (done) => {
    const passedIdentifier = v1();
    sagaMiddleware.run(function* () {
      try {
        yield takeNetwork("testError", passedIdentifier);
      } catch (e) {
        expect(e).toEqual(new Error("error"));
      }
      done();
    });
    sagaMiddleware.run(function* () {
      const identifier = yield putNetwork(
        ["testError", passedIdentifier],
        "test",
        {
          test: "test",
        }
      );
      expect(identifier).toEqual(passedIdentifier);
    });
  });
});
