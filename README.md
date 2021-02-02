# cabinets.js A Global State Manegment Libary
Cabinets is global state management library, it is not tied to any library or framework. It is simple to use but yet powerful.


## It is designed to be simple

In contrast with others state management libraries, it is desgined to be simple to use, it is intuitive, you don't even need
to read the whole documentation to get your app up and running with Cabinets.js

## It is not tied to any UI library

It is not tied to any UI library like React or Vue, you can use it with plain-old-vanilla Javascript and will work.
However we have a Cabinets-react.js which makes simple the integration with React.js. Please click **here** to check
this project.

## It does not have dependencies
Hence **cabinets.js** is very simple it does not use any dependencies. We plan to stick to this principle.
It is a very small size library, so could be attractive to your project if you want to have
low resources size.

## It is intended for small-medium size application
Cabinets main purpose is to be used where it really needs: small-medium size applications
we are not competing with others well-stablished, well stables Global State Containers,
so, but there is no any technical restriction, you can use it but probably you end up
needing some more feautrues that are not present in cabinets.



## Features

-Uniderictional State management. Data Flows in one predicatble way only.

-No configuration is required, use it as it is.

-Easy API

-Can have multiple Stores

-Can use multiple Stores independlty or can use them combined them.

-Supports Mappings to transform the payload before reducer is reached.

-Supports Interceptors which allow to do extra things and even modify both
State and Payload.

-Support Lazy Actions to modify the state in a async way.

-Rich set of custom Cabinets Exceptions(Error) so you could always know
why things went wrong.


## Not yet implemented, but working on that

-Cabinets Flight Recorder:
> To Record all events/interactions with your stores. So you could debug easily, even
do time travel debugging.

## Let's Code

Cabinets.js is based on the idea that in your application you can have multiple store containers
so you could decide if you are going to use them independently from each other or even you can combine them 
and use it a one single big store.

An exmple of how to setup and export a simple store in **AppStores.js** file

```javascript
import { setupStore } from "cabinets";

const counterStore = setupStore({
    name: "counter",
    initState: 10,
    operations: {
        increment: (state, payload) => state + payload,
        decrement: (state, payload) => state - payload
     }
}

export counterStore;

```

To use it, you only need to import it

```javascript
import { useStore } from "cabinets";
import {counterStore} from "./AppStores.js";

const { actions, fire, getState, subscribe } = useStore("counter");

subscribe((state)=> console.log("State has chaged") );

function myFunction(){
  console.log(getState());
  fire(actions.increment(10) );
  fire(actions.decrement(2) );
  console.log(getState());
}

myFunction();

```
Please note when you call **useStore** function it will return
multiple important items:

-**actions:** Is an array of all actions functions that will trigger the invocation of a reducer, one of this action must be passed to fire
function. An action function can take a payload argument with will
be passed to the mapper, interceptor and finally to the reducer.

-**fire**: Is a function that will take an action and 
and will invoke a reducer, if the reducer has associated mappings
and interceptors those functions will be called first,then the
reducer.


-**subscribe**: It's a function that will register a callback  so
  **cabinets.js** could notify when the state has changed, cabinetss.js will
   pass the current state to the callback.(It is very convinience to use subscribe
   function with for example rect *useState => setState* so, when state change component
   will re-render. This technique is use in cabinets-react.js). Subscribe takes another argument;
   an array of dependencies, very useful when  partial object state change subscription 
   is required. e.g if you have a state called app and **app** has a property called **userInfo**, 
   so you can subscribe your callback to execute it only if **userInfo** has
   changed, so you could update your NavBar info only if this prop changed.

-**getState:** It's a function that gives you the current state for the store specified in the **useStore** function.


### Using multiple Stores 

So you have an Application which counts visit, but also allows you to have comments,
you have multiple ways to handle multiple states in cabinets.

**1-.** Having independent Store, so you will handle how and when to use it.

**2-**  Creating one single Store with an Object that will be the root for all your substores.

**3.-** Combined different Stores. Good solution if you want to keep the code cleaner.
you can combine different stores from different  files.

Let's see first Using multiple independent Stores in  **AppStores.js** file
```javascript
import { setupStore } from "cabinets";



const counterStore = setupStore({
    name: "counter",
    initState: 10,
    operations: {
        increment: (state, payload) => state + payload,
        decrement: (state, payload) => state - payload
     }
}

const stringId = (str) => [...str].map(c => c.charCodeAt(0) )
                          .join("") + "_" + new Date().getTime();
                          
const commentStore = setupStore({
    name: "comments",
    initState: [],
    operations: {
        comment: (state, payload) => {
          const newComment = {comment:payload,id:stringId(payload)}
          return [...state, newComment];
        },
        removeComent: (state, payload) => state.filter(comment => comment.id != payload)
     }
}



export counterStore;
export commentStore;

```

To use it, you only need to import them

```javascript
import { useStore } from "cabinets";
import {counterStore, commentStore} from "./AppStores.js";

const counterStore = useStore("counter");
const commentsStore = useStore("commentsStore");

counterStore.subscribe((state)=> console.log("Counter State has chaged: " + state) );
commentsStore.subscribe((state)=> console.log("Hey you have new anonymous comment: " + state) );


function myFunction(){
  console.log(counterStore.state);
  fire(counterStore.actions.increment(10) );
  fire(counterStore.actions.decrement(2) );
  console.log(counterStore.state);
}

function myAnotherFunction(){
  console.log("Comments:" +  commentsStore.getState());
  commentsStore.fire(commentsStore.actions.comment("Hello, an comment from Amasoft DR, keep going.") );
  console.log("Comments:" +  commentsStore.getState());
  const lastComment = commentsStore.getState().slice(-1)[0]; 
  console.log(`Removing last comment ${lastComment.comment} with id: {lastComment.id}` );
  commentsStore.fire(commentsStore.actions.removeComment(lastComment.id) );
  console.log("Comments:" +  commentsStore.getState());
}

myFunction();
myAnotherFunction();

```

The first approach it's recomended if you are sure those Stores do have nothing to do with each other and
you need to be notified indepedently(Although **subscribe** function support props level subscription). Also
you can have those stores in multiple files.

But you already noticed, when multiple stores are used in same scope we cannot use spreading which is a cool js feature,
so to interact with which store we need very long sentences.

Let's implement second approach, so **AppStores.js** file :


```javascript
import { setupStore } from "cabinets";

const stringId = (str) => [...str].map(c => c.charCodeAt(0) )
                          .join("") + "_" + new Date().getTime();
                          
const appStore = setupStore({
    name: "appStore",
    initState: {counter:0, comments:[]},
    operations: {
        increment: (state, payload) => state.counter + payload,
        decrement: (state, payload) => state.counter - payload,
        comment: (state, payload) => {
          const newComment = {comment:payload,id:stringId(payload)}
          return [...state.comments, newComment];
        },
        removeComent: (state, payload) => {
          const comments = state.comments.filter(comment => comment.id != payload)
          state.comments = comments;
          return state;
        }
        
     }
}

export appStore;

```


To use it, you only need to import them

```javascript
import { useStore } from "cabinets";
import {appStore} from "./AppStores.js";


const { actions, fire, getState, subscribe } = useStore("appStore");


subscribe((state)=> console.log("Counter State has chaged: " + state.counter), ["counter"] );
subscribe((state)=> console.log("Hey you have new anonymous comment: " + state.comments), ["comments] );


function myFunction(){
  console.log(getState().counter);
  fire(actions.increment(10) );
  fire(actions.decrement(2) );
  console.log(getState().counter);
}

function myAnotherFunction(){
  console.log("Comments:" +  getState().comments);
  fire(actions.comment("Hello, an comment from Amasoft DR, keep going.") );
  console.log("Comments:" +  getState().comments);
  const lastComment = getState().comments.slice(-1)[0]; 
  console.log(`Removing last comment ${lastComment.comment} with id: {lastComment.id}` );
  fire(actions.removeComment(lastComment.id) );
  console.log("Comments:" +  getState().comments);
}

myFunction();
myAnotherFunction();

```
You can see, now the code it's cleaner and we also have fined-grained notification based on prop change. 
This approach is good for small apps and/or single developer dedicated only with State development.
This approach could result difficult to follow if you have too many operations, subs-stores, and 
different people writing your application code. It requires same file, same store to be edited, an probably 
differnt devs can write their own substore and become
a nigthmare, imagine the frustration while merging.

This lead us to the 3rd approach, **Combining Store** 

When writing independent Stores that are going to be combined you need
to set-up you mind and know that they can be combined and you need
a way to access your specific state sub-store because the state
that is passed to maps, interceptors and reducers will have 
every sub-store attach to it, In a store that is going to be combined
you alaways access your piece of store's state as state.yourStoreName.

Also, if you know for sure or agree with other devs that your store
will be combined with some other specific stores then you will have
access to those stores data or even can trigger state updates for them.

Let's see the code

Code for **counterStore.js**
```javascript

import { setupStore } from "cabinets";

const counterStore = setupStore({
    name: "counter",
    initState: 10,
    operations: {
        increment: (state, payload) => {
          state.counter = state.counter + payload;
          return state;
        },
        decrement: (state, payload) => {
           state.counter = state.counter + payload;
           return state;
        }
     }
}

```
Code for **CommentsStore.js**
```javascript
import { setupStore } from "cabinets";

const stringId = (str) => [...str].map(c => c.charCodeAt(0) )
                          .join("") + "_" + new Date().getTime();
                          
const commentStore = setupStore({
    name: "comments",
    initState: [],
    operations: {
        comment: (state, payload) => {
          const newComment = { comment:payload,id:stringId(payload) }
          state.comments = [...state.comments, newComment];
          return state;
        },
        removeComent: (state, payload) => {
          state.comments = state.comments.filter(comment => comment.id != payload)
          return state;
        }
     }
}

export commentStore;
```
Code for **MyAppStore.js**

```javascript
import { combinedStores, useStore } from "cabinets";
import {counterStore} from "./CounterStore.js";
import {commentsStore} from "./CommentsStroe.js";

const myAppStore = combinedStores("myAppStore", counterStore, commentsStore);

export default function myAppStore(){
    return useStore("myAppStore");
 }

```

Now you can use import **MyAppStore.js** file



```javascript
import { useStore } from "cabinets";
import myAppStore from "./MyAppStore.js";

const { actions, fire, getState, subscribe } = myAppStore("appStore");


subscribe((state)=> console.log("Counter State has chaged: " + state.counter), ["counter"] );
subscribe((state)=> console.log("Hey you have new anonymous comment: " + state.comments), ["comments] );


function myFunction(){
  console.log(getState().counter);
  fire(actions.increment(10) );
  fire(actions.decrement(2) );
  console.log(getState().counter);
}

function myAnotherFunction(){
  console.log("Comments:" +  getState().comments);
  fire(actions.comment("Hello, an comment from Amasoft DR, keep going.") );
  console.log("Comments:" +  getState().comments);
  const lastComment = getState().comments.slice(-1)[0]; 
  console.log(`Removing last comment ${lastComment.comment} with id: {lastComment.id}` );
  fire(actions.removeComment(lastComment.id) );
  console.log("Comments:" +  getState().comments);
}

myFunction();
myAnotherFunction();

```


