import networkManager from "../../manager";

const registerApiEndpoint = (
  endpointName: string,
  func: (...args: unknown[]) => unknown
): void => networkManager.registerApiEndpoint(endpointName, func);

export { registerApiEndpoint };
