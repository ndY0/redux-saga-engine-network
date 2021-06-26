import networkManager from ".";
import NetworkManager from "./manager";

describe("network manager reference", () => {
  it("should be an instance of NetworkManager", () => {
    expect(networkManager).toBeInstanceOf(NetworkManager);
  });
});
