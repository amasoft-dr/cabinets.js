import { setupStore, useStore } from "../module.js";

const counterStore = {
    name: "counterStore",
    initState: 0,
    operations: {
        increment: (state, payload) => state + payload,
        decrement: (state, payload) => state - payload
    }
};

const counterStoreWithMaps = {
    ...counterStore,
    name: "counterStoreMaps",
    maps:{
        increment: (state, payload) => payload + 5
    }
};

const counterStoreWithDefMap = {
    ...counterStore,
    name: "counterStoreWithDefMap",
    maps:{
        increment: (state, payload) => payload + 5,
        def: (state, payload) => payload + 2
    }
};


const counterStoreWithInterceptors = {
    ...counterStore,
    name: "counterStoreWithInterceptors",
    interceptors:{
        increment: (state, payload) => {
            state  = 10;
            payload = state * 2 + payload;         
            return {state, payload};
        }
        
    }
};

const counterStoreWithInterAndDefInter = {
      ...counterStore,
    name: "counterStoreWithInterAndDefInter",
    interceptors:{
        increment: (state, payload) => {
            payload += 10;       
            return {state, payload};
        },
        def: (state, payload) => {return {state, payload:payload -1}}
        
    }
   
};

const lazyCounterStore = {
    name: "lazyCounterStore",
    initState: 0,
    lazyOperations: {
        increment: async (state, payload) => state + payload,
        decrement: async (state, payload) => state - payload
    }
};


it("Setups and uses Cabinets store", () => {
    const store = setupStore(counterStore);
    const foundStore = useStore("counterStore");
    expect(store).toStrictEqual(foundStore);
});


it("Fires actions and checks state changes", () => {
    const { fire, actions, getState } = useStore("counterStore");
    fire(actions.increment(10));
    fire(actions.increment(10));
    fire(actions.decrement(5));
    fire(actions.increment(5));
    expect(getState()).toBe(20);
});

it("Checks if reducer map function was called", () => {
    setupStore(counterStoreWithMaps);
    const { fire, actions, getState } = useStore("counterStoreMaps");
    fire(actions.increment(10));
    expect(getState()).toBe(15);
});

it("Checks if no error while firing action with no associated map", () => {
    //Using store from previous test.
    const { fire, actions, getState } = useStore("counterStoreMaps");
    fire(actions.decrement(10));
    expect(getState()).toBe(5);
});

it("Checks state with both configured action map and default one", () => {
    setupStore(counterStoreWithInterAndDefInter);
    const { fire, actions, getState } = useStore("counterStoreWithInterAndDefInter");
    //1.increment interceptor adds 10 to payload.
    fire(actions.increment(10));
    expect(getState()).toBe(20);
    //2. Default interceptor  substracts 1 form payload
    fire(actions.decrement(10));
    expect(getState()).toBe(11);
});

it("Checks if specific action Interceptor  was invoked", () => {
    setupStore(counterStoreWithInterceptors);
    const { fire, actions, getState } = useStore("counterStoreWithInterceptors");
    //1. Interceptor Change State to 10,
    //2. Inteceptor Change the Payload to: 2 * 10 + 10 = 30
    //3. Reducer sums 30 from payload to existing 10 from state.
    //Result should be: 130
    fire(actions.increment(100));
    expect(getState()).toBe(130);
});

it("Checks state after firing action with no configured interceptor", () => {
    const { fire, actions, getState } = setupStore(counterStoreWithInterceptors);
    //1. Default interceptor changes substracts 1 form payload
    fire(actions.decrement(10));
    expect(getState()).toBe(-10);
});

it("Checks state with both configured action interceptor and default one", () => {
    const { fire, actions, getState } = setupStore(counterStoreWithDefMap);
    //1. Mapping map adds 5 to payload.
    fire(actions.increment(10));
    expect(getState()).toBe(15);
    //2. Default map  substracts 1 form payload
    fire(actions.decrement(10));
    expect(getState()).toBe(3);
});

it("Check asyn state changes",async ()=>{
   const {lazyActions, lazyFire, getState} = setupStore(lazyCounterStore);
   const state = await  lazyFire(lazyActions.increment(10));
  expect(state).toBe(11);

});



