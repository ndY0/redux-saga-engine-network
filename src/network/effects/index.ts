/* eslint-disable func-names */
import {
  fork,
  call,
  all,
  spawn,
  CallEffect,
  ForkEffect,
} from "redux-saga/effects";
import manager from "../manager";
import { v1 } from "uuid";

const putNetwork = (
  [endpoint, identifier = v1()]: [string, string?],
  ...args: unknown[]
): CallEffect => call([manager, manager.put], [endpoint, identifier], ...args);

const takeNetwork = (endpoint: string, identifier?: string): CallEffect =>
  call([manager, manager.take], endpoint, identifier);

const takeEveryNetwork = (
  endpoint: string,
  sagaHandler: (...args: unknown[]) => Generator
): ForkEffect =>
  fork(function* every() {
    while (true) {
      const value = yield takeNetwork(endpoint);
      yield fork(function* (...args) {
        yield call(sagaHandler, ...args);
      }, value);
    }
  });

const spawnEveryNetwork = (
  endpoint: string,
  sagaHandler: (...args: unknown[]) => Generator
): ForkEffect =>
  spawn(function* every() {
    while (true) {
      const value = yield takeNetwork(endpoint);
      yield fork(function* (...args) {
        yield call(sagaHandler, ...args);
      }, value);
    }
  });

const callNetwork = (endpoint: string, ...args: unknown[]): CallEffect =>
  call(
    function* (endpointz, ...argz) {
      const identifier = v1();
      const [result] = yield all([
        takeNetwork(endpointz, identifier),
        putNetwork([endpointz, identifier], ...argz),
      ]);
      return result;
    },
    endpoint,
    ...args
  );

export {
  callNetwork,
  putNetwork,
  takeNetwork,
  takeEveryNetwork,
  spawnEveryNetwork,
};
