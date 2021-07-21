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
import { Task } from "redux-saga";

const putNetwork = (
  [endpoint, identifier = v1()]: [string, string?],
  ...args: unknown[]
): CallEffect => call([manager, manager.put], [endpoint, identifier], ...args);

const takeNetwork = (endpoint: string, identifier?: string): CallEffect =>
  call([manager, manager.take], endpoint, identifier);

const takeEveryNetwork = (
  endpoint: string,
  sagaSuccessHandler: (...args: unknown[]) => Generator,
  sagaErrorHandler: (...args: unknown[]) => Generator = function* () {
    yield undefined;
  }
): ForkEffect =>
  fork(function* every() {
    while (true) {
      try {
        const value = yield takeNetwork(endpoint);
        yield fork(function* (...args) {
          yield call([manager, sagaSuccessHandler], ...args);
        }, value);
      } catch (e) {
        yield fork(function* (...args) {
          yield call([manager, sagaErrorHandler], ...args);
        }, e);
      }
    }
  });

const spawnEveryNetwork = (
  endpoint: string,
  sagaSuccessHandler: (...args: unknown[]) => Generator,
  sagaErrorHandler: (...args: unknown[]) => Generator = function* () {
    yield undefined;
  }
): ForkEffect =>
  spawn(function* every() {
    while (true) {
      try {
        const value = yield takeNetwork(endpoint);
        yield fork(function* (...args) {
          yield call([manager, sagaSuccessHandler], ...args);
        }, value);
      } catch (e) {
        yield fork(function* (...args) {
          yield call([manager, sagaErrorHandler], ...args);
        }, e);
      }
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
