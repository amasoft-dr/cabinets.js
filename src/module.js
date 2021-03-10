class Kabinets {
  constructor() {
    const $this = this;
    const stores = {};

    this.getStores = () => stores;

    this.mount = (store) => {
      stores[store.name] = store;
    };

    this.isMounted = (storeName) => {
      return stores[storeName] !== undefined;
    };

    this.unmount = (storeName) => {
      delete stores[storeName];
    };

    this.findStore = (name) => {
      return stores[name];
    };

    //Kabinets Custom Errors
    class KabinetsError extends Error {
      constructor(message, stateInfo) {
        super(message + KabinetsError.info(stateInfo));
        this.name = "KabinetsError";
      }
      static info(stateInfo) {
        if (stateInfo)
          return " " + Object.keys(stateInfo)
            .map(key => `${key} : ${JSON.stringify(stateInfo[key])}`)
            .join(' , ')
        else return "";
      }
    }

    class SetupStoreError extends KabinetsError {
      constructor(message, stateInfo) {
        super(message, stateInfo);
        this.name = this.name + ".SetupStoreError";
      }
    }

    class ReducerError extends KabinetsError {
      constructor(message, stateInfo) {
        super(message, stateInfo);
        this.name = this.name + ".ReducerError";
      }
    }
    // eslint-disable-next-line
    class AsyncActionError extends KabinetsError {
      constructor(message, stateInfo) {
        super(message, stateInfo);
        this.name = this.name + ".AsyncActionError";
      }
    }

    class MappingError extends KabinetsError {
      constructor(message, stateInfo) {
        super(message, stateInfo);
        this.name = this.name + ".MappingError";
      }
    }
    // eslint-disable-next-line
    class InterceptorError extends KabinetsError {
      constructor(message, stateInfo) {
        super(message, stateInfo);
        this.name = this.name + ".InterceptorError";
      }
    }
    //End Custom Errors
    this.initGlobalStore = () => {
      function createAction(name, map = (s, p) => p, store) {

        const action = (payload) => {
          const defActionReturn = {
            type: name,
            map: map,
            store,
            toString: () => `${store}.${name}`
          };
          if (payload) {
            return { ...defActionReturn, payload: payload };
          } else {
            return defActionReturn;
          }
        };

        return action;
      }

      function initReducer(name, initState, operations) {
        return {
          state: initState,
          name: name,
          ...operations
        };
      }

      //function initStore(){
      //}
      async function lazyFire(action) {
        return dispatch(action, "async");
      }

      function fire(action) {
        return dispatch(action);
      }

      function dispatch(action, actionType = "sync") {
        let store;
        try {
          store = Object.values($this.getStores()).find(
            (store) => store.name === action.store
          );
          const oldState =
            typeof store.state === "object" ? { ...store.state } : store.state;

          //Todo: Error Handling
          if (store) {
            const reducerFn = actionType === "sync" ? store.reducer[action.type] : store.lazyReducer[action.type];
            const ctx = { reducer: store.reducer, fire: store.fire, actions: store.actions };
            const interceptor =
              store.interceptors[action.type] !== undefined
                ? store.interceptors[action.type]
                : store.interceptors["def"];
            //Alaways calls action.map to transform the state
            //preveious to call reducer function, in case map is
            //not supply creating actions, then default (payload)=> payload
            //function will be used.

            //1. payload is mapped prior to be passed to reducer
            //2. state and mapped payload is passed to interceptor
            //3. building {state, payload} object spreading later...
            //4. In case interceptor returns a new state and payload
            //   overriding previous values, if interceptor does not
            //   return keeping previous values

            //1.
            let mapResult;
            try {
              mapResult = action.map(store.state, action.payload);
            } catch (e) {
              throw new MappingError("Error while mapping payload prior to pass it to reducer.",
                {
                  Store: store.name, "Mapping For Action : ": action.type,
                  Payload: action.payload, State: store.state, Error: e.message
                });
            }
            //2.
            let interResult;
            try {
              interResult = interceptor(store.state, mapResult, ctx);
            } catch (e) {
              throw new InterceptorError("Error while executing interceptor prior to execute reducer.",
                { Store: store.name, "Interceptor for Action: ": action.type, State: store.state, Error: e.message });
            }

            //3.
            const reducerArgs = { state: store.state, payload: mapResult };
            //4.
            const { state, payload } = { ...reducerArgs, ...interResult };

            //Notifying all subscriber
            function notify() {
              if (store.__subs__) {
                store.__subs__.forEach((sub) => {
                  if (sub.deps && sub.deps.length > 0) {
                    for (const dep in sub.deps) {
                      const propName = sub.deps[dep];

                      if (oldState[propName] !== store.state[propName]) {
                        sub.fn(store.state);
                      }
                    }
                  } else sub.fn(store.state);
                });
              }
            }


            try {
              if (actionType === "async") {
                return reducerFn(state, payload, ctx)
                  .then(state => {
                    store.state = state;
                    notify();
                    return store.state;
                  });

              } else {
                store.state = reducerFn(state, payload, ctx);
                notify();
              }

            } catch (e) {
              throw new ReducerError("Error in Reducer Code.",
                {
                  Store: store.name, "Reducer for Action: ": action.type, State: store.state,
                  Payload: action.payload, Error: e.message
                });
            }

            return store.state;
          }

        } catch (e) {
          console.error(
            `Error while executing reducer linked to action: ${action}`, e);

          if (e instanceof KabinetsError)
            throw e;

          throw new KabinetsError("Error while executing reducer action.",
            { Store: store.name, Action: action, State: store.state, Error: e.message });
        }
      }

      function subscribe(storeName, fn, deps) {
        if (fn === undefined) return;
        let store = $this.findStore(storeName);
        if (store.__subs__ === undefined) store.__subs__ = [];

        if (!store.__subs__.find(sub => sub.fn === fn) )
             store.__subs__.push({ fn, deps });
      }

      function unsubscribe(storeName, fn){
           if (fn === undefined) return;
           let store = $this.findStore(storeName);
            store.__subs__ = store.__subs__.filter( sub => sub.fn !== fn);
      }

      function limitedStore(store) {
        const { state, maps, interceptors, reducer, lazyReducer, ...rest } = store;
        return rest;
      }

      function setupStore({
        name,
        initState,
        operations = {},
        maps = { _def_impl: true },
        lazyOperations = {},
        interceptors = { _def_impl: true }
      }) {

        try {
          //Setting default maps, interceptors
          maps = { def: (s, p) => p, ...maps };
          interceptors = { def: (s, p) => { s, p }, ...interceptors };
          //End Setting up defaults.

          const actions = Object.keys(operations)
            .map(op => {
              const mapFn = maps[op] === undefined ? "def" : op;
              return { [op]: createAction(op, maps[mapFn], name) };
            })
            .reduce((curr, acc) => {
              return { ...acc, ...curr };
            }, null);

          const lazyActions = Object.keys(lazyOperations)
            .map(lazyOp => {
              const mapFn = maps[lazyOp] === undefined ? "def" : lazyOp;
              return { [lazyOp]: createAction(lazyOp, maps[mapFn], name) };
            })
            .reduce((curr, acc,) => {
              return { ...acc, ...curr };
            }, null);

          const store = {
            name,
            state: initState,
            actions,
            lazyActions,
            reducer: initReducer(name, initState, operations),
            lazyReducer: initReducer(name, initState, lazyOperations),
            subscribe: (fn, deps) => subscribe(name, fn, deps),
            unsubscribe: (fn) => unsubscribe(name, fn),
            fire,
            lazyFire,
            maps,
            getState: () => {
              let str = $this.findStore(name);
              if (str) return str.state;
            },
            interceptors
          };
          $this.mount(store);
          return limitedStore(store);

        } catch (e) {
          throw new SetupStoreError("Error while Setting Up Store",
            { Store: name, Operations: operations, State: initState, Error: e.message });
        }

      }
      const combiner = (items) =>
        items.reduce((ac, curr) => {
          if (curr instanceof String) {
            return (ac += curr);
          }
          if (curr instanceof Array) {
            return [...ac, ...curr];
          }
          const combinedItems = { ...ac, ...curr };
          return combinedItems;
        },{});

      function arrayToObjSet(array) {
        return array.reduce((curr, acc) => {
          return { ...acc, ...curr };
        },{});
      }

      function combineReducers(reducers) {
        return combiner(reducers);
      }

      function combineStores(name, ...limitedStores) {

        const stores = limitedStores.map((limStore) =>
          $this.findStore(limStore.name)
        );

        const allReducers = combineReducers(
          stores.map((store) => store.reducer)
        );

        const allLazyReducers = combineReducers(
          stores.map((store) => store.lazyReducer)
        );

        const allMaps = combiner(
          stores.filter(store => !store.maps._def_impl)
            .map((store) => store.maps)
        );

        const allInterceptors = combiner(
          stores.filter(store => !store.interceptors._def_impl)
            .map((store) => store.interceptors)
        );

        const combinedName =
          name === undefined
            ? stores.map((store) => `${store.name}`).join("-")
            : name;

        const combinedStates = arrayToObjSet(
          stores.map((store) => {
            const state = { [store.name]: store.getState() };
            return state;
          })
        );

        const combinedSubs = stores
          .map((store) => store.__subs__)
          .filter((subs) => subs !== undefined);
        //Registering new combined Stores...

        const store = setupStore({
          name: combinedName,
          initState: combinedStates,
          operations: allReducers,
          lazyOperations: allLazyReducers,
          maps: allMaps,
          interceptors: allInterceptors
        });

        //Combining all subscribers if they exists
        store.__subs__ = combinedSubs;
        //Unmounting previously mounted stores if they are mounted
        stores.forEach((store) => {
          if ($this.isMounted(store.name)) {
            $this.unmount(store.name);
          }
        });

        return store;
      }

      //Exporting important functions that can be used invkoking initGlobalStore
      return {
        setupStore,
        combineStores,
        limitedStore,
        initReducer,
        createAction,
        KabinetsError,
        ReducerError,
        InterceptorError,
        MappingError,
        AsyncActionError,
        SetupStoreError
      };
    };
  }
}

const kabinets = new Kabinets();

//Defining external API
const globalStore =  kabinets.initGlobalStore();
export const {  setupStore, 
                combineStores, 
                KabinetsError,
                ReducerError,
                InterceptorError,
                MappingError,
                AsyncActionError,
                SetupStoreError } = globalStore;

export function useStore(name) {
  const { limitedStore } = globalStore;
  return limitedStore(kabinets.findStore(name));
}