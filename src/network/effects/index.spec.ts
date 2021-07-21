import {
  callNetwork,
  putNetwork,
  takeNetwork,
  takeEveryNetwork,
  spawnEveryNetwork,
} from ".";

describe("effects", () => {
  it("should create a saga call effect, passing the put generator and Network manager context, alongside the given arguments", () => {
    const test = putNetwork(["test", "test"], "value");
    expect(test.type).toEqual("CALL");
    expect(test.payload.args[1]).toEqual("value");
    expect(test.payload.fn.name).toEqual("put");
    expect(test.payload.context.constructor.name).toEqual("NetworkManager");
  });
  it("should create a saga call effect, passing the take generator and Network manager context, alongside the given arguments", () => {
    const test = takeNetwork("test", "test");
    expect(test.type).toEqual("CALL");
    expect(test.payload.args[0]).toEqual("test");
    expect(test.payload.args[1]).toEqual("test");
    expect(test.payload.fn.name).toEqual("take");
    expect(test.payload.context.constructor.name).toEqual("NetworkManager");
  });
  it("should create a saga call effect, passing a generator function encapsulation a all effect composed of putNework and takeNetwork, and Network manager context, alongside the given arguments", () => {
    const test = callNetwork("test", "test");
    expect(test.type).toEqual("CALL");
    const innerGeneratorNext = test.payload.fn().next().value;
    expect(innerGeneratorNext.type).toEqual("ALL");
    const innerEffects = innerGeneratorNext.payload;

    expect(innerEffects[1].type).toEqual("CALL");
    expect(innerEffects[1].payload.fn.name).toEqual("put");
    expect(innerEffects[1].payload.context.constructor.name).toEqual(
      "NetworkManager"
    );

    expect(innerEffects[0].type).toEqual("CALL");
    expect(innerEffects[0].payload.fn.name).toEqual("take");
    expect(innerEffects[0].payload.context.constructor.name).toEqual(
      "NetworkManager"
    );
  });
  it("should fork a while loop, that first take from network, then fork to the handler", () => {
    function* testSuccessHandler() {
      yield true;
    }
    function* testErrorHandler() {
      yield true;
    }
    const test = takeEveryNetwork("test", testSuccessHandler, testErrorHandler);
    expect(test.type).toEqual("FORK");
    const everyInnerGenerator = test.payload.fn();
    const takeEffect = everyInnerGenerator.next().value;

    expect(takeEffect.type).toEqual("CALL");
    expect(takeEffect.payload.args[0]).toEqual("test");
    expect(takeEffect.payload.fn.name).toEqual("take");
    expect(takeEffect.payload.context.constructor.name).toEqual(
      "NetworkManager"
    );
    const forkEffect = everyInnerGenerator.next().value;
    expect(forkEffect.type).toEqual("FORK");
    const innerForkGenerator = forkEffect.payload.fn();
    const callEffect = innerForkGenerator.next().value;

    expect(callEffect.type).toEqual("CALL");
    expect(callEffect.payload.fn.name).toEqual("testSuccessHandler");
    expect(callEffect.payload.context.constructor.name).toEqual(
      "NetworkManager"
    );
  });
  it("should spawn a while loop, that first take from network, then fork to the handler", () => {
    function* testSuccessHandler() {
      yield true;
    }
    function* testErrorHandler() {
      yield true;
    }
    const test = spawnEveryNetwork(
      "test",
      testSuccessHandler,
      testErrorHandler
    );
    expect(test.type).toEqual("FORK");
    const everyInnerGenerator = test.payload.fn();
    const takeEffect = everyInnerGenerator.next().value;

    expect(takeEffect.type).toEqual("CALL");
    expect(takeEffect.payload.args[0]).toEqual("test");
    expect(takeEffect.payload.fn.name).toEqual("take");
    expect(takeEffect.payload.context.constructor.name).toEqual(
      "NetworkManager"
    );
    const forkEffect = everyInnerGenerator.next().value;
    expect(forkEffect.type).toEqual("FORK");
    const innerForkGenerator = forkEffect.payload.fn();
    const callEffect = innerForkGenerator.next().value;

    expect(callEffect.type).toEqual("CALL");
    expect(callEffect.payload.fn.name).toEqual("testSuccessHandler");
    expect(callEffect.payload.context.constructor.name).toEqual(
      "NetworkManager"
    );
  });
});
