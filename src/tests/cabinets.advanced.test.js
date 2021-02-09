import { setupStore, combineStores, useStore } from "../module.js";

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
};

const blogStore2 = {
    ...blogStore,
    name: "blog"
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
};



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
        counterStateStore);

    const { fire, actions, getState } = blogCounterStore;
    expect(getState()).toHaveProperty("blog");
    expect(getState()).toHaveProperty("counter");

    fire(actions.increment(10));
    expect(getState().counter).toBe(10);

})