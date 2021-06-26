import networkManager from "../../manager";
import { registerApiEndpoint } from ".";

describe("http helpers", () => {
  it("should call the api register endpoint function of manager, with given id and callback", () => {
    const registerApiEndpointSpy = jest.spyOn(
      networkManager,
      "registerApiEndpoint"
    );
    function* testCallback() {
      return true;
    }
    registerApiEndpoint("test", testCallback);
    expect(registerApiEndpointSpy).toHaveBeenCalledTimes(1);
    expect(registerApiEndpointSpy).toHaveBeenCalledWith("test", testCallback);
  });
});
