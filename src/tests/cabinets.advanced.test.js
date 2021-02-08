import { setupStore, useStore } from "../module.js";


const strId = (str) => [...str].map(c => c.charCodeAt(0) )
                          .join("") + "_" + new Date().getTime();

const blogStore = {
    name: "blogStore",
    initState: {
        blog:{
            comments: [],
            articles: []
        }
    },
    operations: {
        addComment: (state, newComment) => {
            state.blog.comments = [...state.blog.comments, newComment];
            return {...state};
        },
        removeComment: (state, commentId) => {
            state.blog.comments = 
                     state.blog.comments.filter( comment => comment.id != commentId);
            return {...state};
        },
        addArticle: (state, newArticle) => {
            state.blog.articles = [...state.blog.articles, newArticle];
            return {...state};
        },
        removeComment: (state, articleId) => {
             state.blog.articles = 
                     state.blog.articles.filter( article => article.id != articleId);
            return {...state};
        }
       
    },
    maps:{
     //Adding a default map to modify the payload adding id to both comments and articles
    //Adding creation date.
     def: (state, entry) => {
         const id = strId(entry.text);
         return {...entry, id, creationDate: new Date() };
     }
    }
}; 


it("Setting Up and Finding Complex Store", () => {
  const store = setupStore(blogStore);
  const foundStore = useStore("blogStore");
  expect(store).toStrictEqual(foundStore);
}); 