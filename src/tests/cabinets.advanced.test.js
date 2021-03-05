import { setupStore, combineStores, useStore } from "../module.js";
import { ReducerError, SetupStoreError, InterceptorError, MappingError } from "../module.js";

class LocalStorage {
    constructor() {
        this.data = {}
    }
    set(name, value) {
        this.data[name] = JSON.stringify(value);
    }

    get(name) {
        return this.data[name];
    }

};

const localStorage = new LocalStorage();

const strId = (str) => [...str].map(c => c.charCodeAt(0))
    .join("") + "_" + new Date().getTime();

const blogStore = {
    name: "blogStore",
    initState: {
        blog: {
            comments: [],
            articles: []
        }
    },
    operations: {
        addComment: (state, newComment) => {
            state.blog.comments = [...state.blog.comments, newComment];
            return { ...state };
        },
        removeComment: (state, commentId) => {
            state.blog.comments =
                state.blog.comments.filter(comment => comment.id !== commentId);
            return { ...state };
        },
        addArticle: (state, newArticle) => {
            state.blog.articles = [...state.blog.articles, newArticle];
            return { ...state };
        },
        removeComment: (state, articleId) => {
            state.blog.articles =
                state.blog.articles.filter(article => article.id != articleId);
            return { ...state };
        }

    },
    maps: {
        //Adding a default map to modify the payload adding id to both comments and articles
        //Adding creation date.
        def: (state, entry) => {
            const id = strId(entry.author);
            return { ...entry, id, creationDate: new Date() };
        }
    },
    interceptors: {
        addArticle: (state, payload) => {
            localStorage.set("article_backups", { state, payload, lastUpdate: new Date() });
        }
    }
}

const blogStore2 = {
    ...blogStore,
    name: "blog",
    initState: {
        comments: [],
        articles: []
    },
    maps: {
        //Creating specific maps to increment/decrement, to avoid def mapper
        //tries to change the int payload spreading and generating an error...
        increment: (state, payload) => payload,
        decrement: (state, payload) => payload,
        //Adding a default map to modify the payload adding id to both comments and articles
        //Adding creation date.
        def: (state, entry) => {
            const id = strId(entry.author);
            return { ...entry, id, creationDate: new Date() };
        }
    },
    interceptors: {
        def: (state, payload) => {
            localStorage.set("article_backups2", { ...state, payload, lastUpdate: new Date() });
        }
    }
}

const counterStore = {
    name: "counter",
    initState: 0,
    operations: {
        increment: (state, payload) => {
            state.counter += payload
            return state;
        },
        decrement: (state, payload) => {
            state.counter -= payload;
            return state;
        }
    },
    lazyOperations: {
        increment: async (state, payload) => {
            state.counter += payload
            return state;
        },
        decrement: async (state, payload) => {
            state.counter -= payload;
            return state;
        }
    }
}

const basicCounterStore = {
    name: "basicCounterStore",
    initState: 0,
    operations: {
        increment: (state, payload) => state + payload,
        decrement: (state, payload) => state - payload
    }
}



it("Setting Up and Finding Complex Store", () => {
    const store = setupStore(blogStore);
    const foundStore = useStore("blogStore");
    expect(store).toStrictEqual(foundStore);
});

it("Changes Complex Store's State", () => {
    const { fire, actions, getState } = useStore("blogStore");
    const article = {
        text: "Hello World to everybody",
        title: "Hello World!",
        author: "@amasoft"
    }
    fire(actions.addArticle(article));
    const article1 = getState().blog.articles[0];
    expect(article.text).toBe(article1.text);

});

it("Checks if default map was executed in Complex Store", () => {
    const { fire, actions, getState } = useStore("blogStore");
    const article = {
        text: "This is Dimi from Amasoft",
        title: "Hello from Amasoft!",
        author: "@andreidim"
    }

    fire(actions.addArticle(article));
    const article1 = getState().blog.articles
        .find(article => article.author === "@andreidim");

    expect(article1).toHaveProperty("id");
    expect(article1).toHaveProperty("creationDate");

    const comment = {
        text: "Thank you @andreidim", author: "@adpmaster",
        articleId: article1.id
    }

    fire(actions.addComment(comment));

    const comment1 = getState().blog.comments
        .find(comment => comment.author === "@adpmaster");

    expect(comment1).toHaveProperty("id");
    expect(comment1).toHaveProperty("creationDate");

});


it("Checks if action's interceptor is executing in Complex Store", () => {
    //Hence we defined an interceptor to backup always our blog state, payload
    //and it also adds a lastUpdate field, let's see our fake localStorage.
    const blogBackup = JSON.parse(localStorage.get("article_backups"));
    expect(blogBackup).toHaveProperty("lastUpdate");
});

it("Checks if it's possible to combine stores", () => {
    //blogStore was set up during past tests, so
    //let's set up now counterStore
    const blogStateStore = setupStore(blogStore2);
    const counterStateStore = setupStore(counterStore);
    //It is important to first pass the name to the new
    //combined-store, then all stores to be combined.
    const blogCounterStore = combineStores("blogAndCounterStore",
        blogStateStore,
        counterStateStore
    );

    const { fire, actions, getState } = blogCounterStore;
    expect(getState()).toHaveProperty("blog");
    expect(getState()).toHaveProperty("counter");

    fire(actions.increment(10));
    expect(getState().counter).toBe(10);

    const article = {
        title: "I'm Eudys",
        text: "Hello Everybody, I'm a dev from @Amasoft",
        author: "@eudys"
    };
    fire(actions.addArticle(article));
    const foundArticle = getState().blog.articles.find(art => art.author === "@eudys");
    expect(foundArticle).toHaveProperty("id");
    expect(foundArticle).toHaveProperty("creationDate");

});

it("Checks if lazy operations are working in combined-stores", async () => {
    const { lazyActions, lazyFire, getState } = useStore("blogAndCounterStore");
    //state.counter is 10...
    const state = await lazyFire(lazyActions.increment(10));
    expect(getState().counter).toBe(20);
    expect(getState()).toBe(state);
});

it("Checks if action's interceptor is executing in combinged-store", () => {
    //Hence we defined an interceptor to backup always our blog state, payload
    //and it also adds a lastUpdate field, let's see our fake localStorage.
    const blogBackup = JSON.parse(localStorage.get("article_backups2"));
    expect(blogBackup).toHaveProperty("lastUpdate");
});

it("Checks if subscribe/notify is working when state change...", done => {
    const { actions, fire, getState, subscribe, unsubscribe } = useStore("blogAndCounterStore");
    //state.counter is 20...
    const notifyme = state => {
        expect(getState().counter).toBe(30);
        expect(getState()).toBe(state);
        done();
    };
    subscribe(notifyme);
    fire(actions.increment(10));
    unsubscribe(notifyme);

});

it("Checks if multiple subscribers are notified", done => {
    const { actions, fire, getState, subscribe, unsubscribe } = setupStore(basicCounterStore);
    //counter is 0...
    const subs = {
        notifyme(state) {

            expect(getState()).toBe(10);
            done();

        },
        notifyme2(state) {

            expect(getState()).toBe(10);
            done();

        }
    }
    jest.spyOn(subs, "notifyme");
    jest.spyOn(subs, "notifyme2");
    subscribe(subs.notifyme);
    subscribe(subs.notifyme2);
    subscribe(state => {
        expect(subs.notifyme).toHaveBeenCalled();
        expect(subs.notifyme2).toHaveBeenCalled();

    });

    fire(actions.increment(10));

});

it("Checks if subscribe/notify is working wen state prop change...", done => {

    const { actions, fire, getState, subscribe } = useStore("blogAndCounterStore");
    //state.counter is 40...
    //Hence we are only subscribing when "blog" property change, cabinets.js
    //won't notify and test pass, if we change "blog" for "counter" then we 
    //will have an error because 48 is not 58.
    subscribe(state => {

        expect(state).toBe(getState());
        expect(getState().counter).toBe(58);
        done();

    }, ["blog"]);

    fire(actions.increment(18));
    done();
});
//Testing Exceptions
const problemReduceStore = {
    name: "problemReduceStore",
    initState: "Hello ",
    operations: {
        sayHello: (state, payload) => state + payloads //Error here.
    }

};

const problemMapsStore = {
    name: "problemReduceStore",
    initState: "Hello ",
    operations: {
        sayHello: (state, payload) => state + payload
    },
    maps: {
        sayHello: (state, payload) => String.toUpperCase(payload) //Error here
    }

};

const problemInterceptorStore = {
    name: "problemReduceStore",
    initState: "Hello ",
    operations: {
        sayHello: (state, payload) => state + payload
    },
    interceptors: {
        sayHello: (state, payload) => {
            state.salutation.hindi = "Namaste";
            return { state, payload };
        }
    }

};

it("Checks ReducerError", ()=> {
   const t = () => {
       const {fire, actions} = setupStore(problemReduceStore);
       fire(actions.sayHello());
   };
   expect(t).toThrow(ReducerError);
});

it("Checks MappingError", ()=> {
   const t = () => {
       const {fire, actions} = setupStore(problemMapsStore);
       fire(actions.sayHello());
   };
   expect(t).toThrow(MappingError);
});


it("Checks InterceptorError", ()=> {
   const t = () => {
       const {fire, actions} = setupStore(problemInterceptorStore);
       fire(actions.sayHello());
   };
   expect(t).toThrow(InterceptorError);
});

it("Checks SetupError", ()=>{
    const t = () => {
       const {fire, actions} = setupStore({operations:null});
    }
    expect(t).toThrow(SetupStoreError);
});
