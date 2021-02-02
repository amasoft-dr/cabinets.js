# cabinets.js A Global State Manegment Libary
Cabinets is global state management library, it is not tied to any library or framework. It is simple to use but yet powerful.


## It is designed to be simple

In contrast with others state management libraries, it is desgined to be simple to use, it is intuitive, you don't even need
to read the whole documentation to get your app up and running with Cabinets.js

##It is not tied to any UI library

It is not tied to any UI library like React or Vue, you can use it with plain-old-vanilla Javascript and will work.
However we have a Cabinets-react.js which makes simple the integration with React.js. Please click **here** to check
this project.



# Features

Cabinets.js is based on the idea that in your application you can have multiple store containers
so you could decide if you are going to use them independently from each other or even you can combine them 
and use it a one single big store.

An exmple of how to setup and export a simple store in **AppStores.js**;

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
import counterStore from "./AppStores.js";

const { actions, fire, getState, subscribe } = useStore("counter");

subscribe((state)=> console.log("State has chaged") );

function myFunction(){
  const state = getState();
  console.log(state);
  fire(actions.increment(10);
  fire(actions.decrement(2);
  console.log(state);
}

```
Please note when you call **useStore** function it will return
multiple important items

-**actions:** Is an array of all actions functions that will trigger the invocation of a reducer, one of this action must be passed to fire
function. An action function can take a payload argument with will
be passed to the mapper, interceptor and finally to the reducer.

-**fire**: Is a function that will take an action and 
and will invoke a reducer, if the reducer has associated mappings
and interceptors those functions will be called first,then the
reducer.


-**subscribe**: Is a function that will register a callback  so
  **cabinets.js** could notify when the state has changed, it takes
   another argument, an array of dependencies, very useful when 
   partial object state change subscription is required. e.g if you have
   an state called app and **app** has a property called **userInfo**, 
   so you can subscribe your callback to execute it only if **userInfo** has
   changed, so you could update your NavBar info only if this prop changed.
