# redux-saga-engine-network

a network adapter for redux-saga-engine-react to seemingly integrate socket and api interraction in redux-saga way

## Why ?

as redux-saga provides a convenient effect approach to interact with the redux store, fetching data from remote remains a task on the hands of developers. integrating WebSocket technologies into your application futher complicates the integration into redux-saga reactive coding approach. This is where redux-saga-engine-network intend to give a helping hand.

## How ?

redux-saga-engine-network allows you to register endpoints, both api and socket, wich can be later interracted with redux-saga like effects. this provide you with the benefits of clear declaration of your remote endpoints, and flawless integration of your calls into your sagas. futhermore, events are tracked and can be listened from multiple points into your scripts, opening the door of distributed reaction.

## Usage

### installation

```sh
npm install redux-saga-engine-network
```

### testing

You can clone the repository and run the `npm test` command

### endpoint declaration

redux-saga-engine-network needs to access the redux-saga middleware and a socket factory class in order to function, in your initialization script, you should import the connect helper function, and pass it the arguments (futher exemples uses socket.io-client library as implementation for the socket engine).

```ts
//src/initialize.ts

import { connect } from 'redux-saga-engine-network/helpers';
import { SocketClient as ISocketClient } from 'redux-saga-engine-network/clients';
import from '../network/declarations/endpoints';
import createSagaMiddleware from 'redux-saga';
import { ManagerOptions, Manager } from 'socket.io-client';

...

const sagaMiddleware = createSagaMiddleware({...});
class SocketClient extends ISocketClient {
  createManager<T = ManagerOptions>(uri: string, options: Partial<T>): Manager {
    return new Manager(uri, options);
  }
}
connect(sagaMiddleware, new SocketClient());

...
```

you can now start declaring your endpoints, make sure to import them before the call to connect helper.

#### api endpoint

```ts
// src/network/declarations/endpoints/api.ts

import { registerApiEndpoint } from "redux-saga-engine-network/helpers";

registerApiEndpoint("getTodoList", api.getTodoList);
// api.getTodoList should wrap a call with axios or other http client and return the expected data
```

#### socket endpoint

```ts
import {
  registerSocket,
  registerSocketEndpoint,
  registerSocketManager,
} from "redux-saga-engine-network/helpers";

registerSocketManager(
  "todoManager",
  {
    url: "http://localhost",
    port: 8080,
    options: {
      // socket.io-client manager options
    },
  },
  connectionErrorSaga,
  reconnectSuccessSaga,
  reconnectErrorSaga,
  maxReconnectErrorSaga
);

registerSocket(
  "todoManager",
  "todoSocket",
  "/todo",
  {
    auth: {
      //socket.io-client socket auth options
    },
  },
  connectSaga,
  disconnectSaga
);

registerSocketEndpoint(
  "postTodoList",
  "todoSocket",
  "post_todo_list_event",
  function selectResponseForPostTodoList(
    event: string,
    args: [{ type: string; data: any }]
  ) {
    return event === "reply" && args[0].type === "post_todo_list";
  },
  function selectErrorForPostTodoList(
    event: string,
    args: [{ type: string; data: any }]
  ) {
    return event === "error:message" && args[0].type === "post_todo_list";
  }
);
```

first, you register a manager with a key, wich will take care of managing the underlying connection, passing it optional sagaHandler to react on connection events.

then, you declare a socket, providing it a key, the manager key,
the socket io namespace to connect to, passing it optional sagaHandlers to react to client connection events.

finally, you declare a socket endpoint, providing it a key, the socket key,
the event name to emit, a selector function, which will filter server response and route them to consumer if intended for this endpoint,
and a error selector function, wich wil filter error response from the server in a likewise manner.

### endpoint usage

in order to use the endpoints api and socket endpoints seamlessly, redux-saga-engine-network provide you with custom redux-saga effects :

#### putNetwork and takeNetwork

you can put an event to an endpoint, passing data to it, and wait for the answer with the take effect :

```ts
import { takeEvery, all, call } from "redux-saga/effects";
import { POST_TODO_LIST } from "../actions";
import { putNetwork, takeNetwork } from "redux-saga-engine-network/effects";

function* handlePostTodoList({ data }) {
  yield putNetwork(["postTodoList"], { data: [] });
}

export function* watcher() {
  yield takeEvery(POST_TODO_LIST, handlePostTodoList);
}

function* handleResultPostTodoList1() {
  // do something
}
function* handleResultPostTodoList2() {
  // here too
}

export function* watcherResults() {
  yield all([
    function* () {
      try {
        const data = yield takeNetwork(["postTodoList"]);
        yield call(handleResultPostTodoList1, data);
      } catch (e) {
        // handle error
      }
    },
    function* () {
      try {
        const data = yield takeNetwork(["postTodoList"]);
        yield call(handleResultPostTodoList2, data);
      } catch (e) {
        // handle error
      }
    },
  ]);
}
```

note that you can take on multiple points for a single response

#### callNetwork

if you don't need to retrieve data at multiple points, you can use the callNetwork effect, wich will wait for the data to be returned :

```ts
import { takeEvery } from "redux-saga/effects";
import { POST_TODO_LIST } from "../actions";
import { callNetwork } from "redux-saga-engine-network/effects";

function* handlePostTodoList({ data }) {
  try {
    const result = yield callNetwork("postTodoList", { data: [] });
  } catch (e) {
    // handle errors from network or error message if socket
  }
}

export function* watcher() {
  yield takeEvery(POST_TODO_LIST, handlePostTodoList);
}
```

#### takeEveryNetwork

finally, you can attach a handler for a specific endpoint, which would be in charge of handling every response :

```ts
import { takeEvery } from "redux-saga/effects";
import { POST_TODO_LIST } from "../actions";
import { callNetwork } from "redux-saga-engine-network/effects";

function* handlePostTodoList({ data }) {
  // do something on every response
}

function* handleErrorsPostTodoList(err) {
  // do something on error response from the server
}

export function* watcher() {
  yield takeEveryNetwork(
    "postTodoList",
    handlePostTodoList,
    handleErrorsPostTodoList
  );
  yield putNetwork(["postTodoList"], { data: [] });
  yield putNetwork(["postTodoList"], { data: [] });
  yield putNetwork(["postTodoList"], { data: [] });
}
```
