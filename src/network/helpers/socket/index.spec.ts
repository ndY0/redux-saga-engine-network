import networkManager from "../../manager";
import {
  registerSocket,
  registerSocketEndpoint,
  registerSocketManager,
} from ".";

describe("socket helpers", () => {
  it("should call the api register socket manager function of manager, with given id and generators", () => {
    const registerSocketManagerSpy = jest
      .spyOn(networkManager, "registerSocketManager")
      .mockImplementationOnce(() => {
        return undefined;
      });
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
    registerSocketManager(
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
    expect(registerSocketManagerSpy).toHaveBeenCalledTimes(1);
    expect(registerSocketManagerSpy).toHaveBeenCalledWith(
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
  });
  it("should call the api register socket function of manager, with given managerKey, socketKey, namespace and generators", () => {
    const registerSocketSpy = jest
      .spyOn(networkManager, "registerSocket")
      .mockImplementationOnce(() => {
        return undefined;
      });
    function* connectSaga() {
      yield null;
    }
    function* disconnectSaga() {
      yield null;
    }
    registerSocket(
      "test",
      "test",
      "test",
      {
        auth: {},
      },
      connectSaga,
      disconnectSaga
    );
    expect(registerSocketSpy).toHaveBeenCalledTimes(1);
    expect(registerSocketSpy).toHaveBeenCalledWith(
      "test",
      "test",
      "test",
      { auth: {} },
      connectSaga,
      disconnectSaga
    );
  });
  it("should call the api register socket endpoint function of manager, with given endpoint name, socketKey, and event name to emit and the response selector", () => {
    const registerSocketEndpointSpy = jest
      .spyOn(networkManager, "registerSocketEndpoint")
      .mockImplementationOnce(() => {
        return undefined;
      });
    function selector() {
      return true;
    }
    registerSocketEndpoint("test", "test", "test", selector);
    expect(registerSocketEndpointSpy).toHaveBeenCalledTimes(1);
    expect(registerSocketEndpointSpy).toHaveBeenCalledWith(
      "test",
      "test",
      "test",
      selector
    );
  });
});
