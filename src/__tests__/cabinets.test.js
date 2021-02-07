import { setupStore, useStore } from "../module.js";

const  counterStore = {
    name: "counterStore",
        initState: 0,
            operations: {
        increment: (state, payload) => state + payload,
            decrement: (state, payload) => state - payload
    }
};

const commentsStore = {
    name: "comments",
    initState: [],
    operations: {
        comment: (state, comment) =>  [...state, comment],
        removeComent: (state, id) => state.filter(comment => comment.id !== id)
     },
     maps: {
       //#1
       comment: (payload) => {
        //Converting simple String for comment reducer, into a msg object to be passed to the
        //comment reducer.
        const id = [...payload].map(c => c.charCodeAt(0) ).join("") + "_" + new Date().getTime();
        return {msg:payload, id, date: new Date() } 
       }
     }
     
}



it("Setup and Using Cabinets store", () => {

    const store = setupStore(counterStore);
    const foundStore = useStore("counterStore");
    expect(store).toStrictEqual(foundStore);
});