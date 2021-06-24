import networkManager from "../../manager";
import { registerSocketManager } from ".";

describe("socket helpers", () => {
  it("should call the api register endpoint function of manager, with given id and callback", () => {
    jest.setMock;
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
});
