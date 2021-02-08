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
    name: "counterStoreMaps",
    initState: 0,
    operations: {
        increment: (state, payload) => state + payload,
        decrement: (state, payload) => state - payload
    },
    maps:{
        increment: (payload) => payload + 5
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
    fire(actions.decrement(5));
    expect(getState()).toBe(5);
});

it("Checks if reducer map function was called", () => {
    const store = setupStore(counterStoreWithMaps);
    console.log(store);
    const { fire, actions, getState } = useStore("counterStoreMaps");
    console.log(actions);
    fire(actions.increment(10));
    expect(getState()).toBe(15);
});

