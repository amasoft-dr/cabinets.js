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

const commentsStore = {
    name: "comments",
    initState: [],
    operations: {
        comment: (state, comment) => [...state, comment],
        removeComent: (state, id) => state.filter(comment => comment.id !== id)
    },
    maps: {
        //#1
        comment: (payload) => {
            //Converting simple String for comment reducer, into a msg object to be passed to the
            //comment reducer.
            const id = [...payload].map(c => c.charCodeAt(0)).join("") + "_" + new Date().getTime();
            return { msg: payload, id, date: new Date() }
        }
    }

}



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

it("Checks if specific action Interceptor  was invoked", () => {
    setupStore(counterStoreWithInterceptors);
    const { fire, actions, getState } = useStore("counterStoreWithInterceptors");
    //1. Interceptor Change State to 10,
    //2. Inteceptor Change the Payload to: 2 * 10 + 10 = 30
    //3. Reducer sums 30 from payload to existing 10 from state.
    //Result should be: 40
    fire(actions.increment(10));
    expect(getState()).toBe(40);
});

it("Checks state after firing action with no configured interceptor", () => {
    setupStore(counterStoreWithInterceptors);
    const { fire, actions, getState } = useStore("counterStoreWithInterceptors");
    //1. Default interceptor changes substracts 1 form payload
    fire(actions.decrement(10));
    expect(getState()).toBe(-10);
});

it("Checks state with both configured action interceptor and default one", () => {
    setupStore(counterStoreWithInterAndDefInter);
    const { fire, actions, getState } = useStore("counterStoreWithInterAndDefInter");
    //1.increment interceptor adds 10 to payload.
    fire(actions.increment(10));
    expect(getState()).toBe(20);
    //2. Default interceptor  substracts 1 form payload
    fire(actions.decrement(10));
    expect(getState()).toBe(11);
});




