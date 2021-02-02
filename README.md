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
import {counterStore} from "./AppStores.js";

const { actions, fire, getState, subscribe } = useStore("counter");

subscribe((state)=> console.log("State has chaged") );

function myFunction(){
  const state = getState();
  console.log(state);
  fire(actions.increment(10);
  fire(actions.decrement(2);
  console.log(state);
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
