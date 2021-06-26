import createSagaMiddleware from "redux-saga";
import { SocketClientMock } from "../../../../mock/socket-client.mock";
import { connect } from ".";
import manager from "../../manager";

describe("connect helper", () => {
  it("should connect the manager to the saga middleware and socket client", () => {
    const sagaMiddleware = createSagaMiddleware();
    const socketClientMock = new SocketClientMock();
    const connectSpy = jest.spyOn(manager, "connect");
    connect(sagaMiddleware, socketClientMock);
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenNthCalledWith(
      1,
      sagaMiddleware,
      socketClientMock
    );
  });
});
