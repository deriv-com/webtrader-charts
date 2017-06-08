import $ from 'jquery';
import _ from 'lodash';
import {globals} from './globals.js';

let socket = null;

export const init = ({appId, lang = 'en', server = 'wss://ws.binaryws.com/websockets/v3'}) => {
   if(!appId) {
      throw new Error("appId is requried");
   }
   globals.config.appId = appId;
   globals.config.lang = lang;
   globals.config.server = server;
   socket = connect();
}

const connect = () => {
   const ws = new WebSocket(globals.config.url);

   ws.addEventListener('open', onopen);
   ws.addEventListener('close', onclose);
   ws.addEventListener('message', onmessage);

   ws.addEventListener('error',(event) => {
      // TODO: i18n
      // ({message: 'Connection error.'.i18n()});
      globals.notification.error('Connection error.');
      onclose(); // try to reconnect
   });

   return ws;
}

let timeoutIsSet = false;
// TODO: refresh open charts
const onclose = () => {
   if(!timeoutIsSet) {
      timeoutIsSet = true;
      _.delay(() => {
         timeoutIsSet = false;
         connect();
      });
   }
}

const buffered_execs = [];
const buffered_sends = [];
const unresolved_promises = { /* req_id: { resolve: resolve, reject: reject, data: data } */};
const cached_promises = { /* key: {data: data, promise: promise } */}; /* requests that have been cached */
const is_connected = () => (socket && (socket.readyState === 1));


const onopen = () => {
   /* send buffered sends */
   while(buffered_sends.length > 0) {
      const data = buffered_sends.shift();
      if(!unresolved_promises[data.req_id]) {
         socket.send(JSON.stringify(data));
      }
   }
   /* if the connection got closed while the result of an unresolved request
           is not back yet, issue the same request again */
   for(const key in unresolved_promises) {
      const promise = unresolved_promises[key];
      if(!promise) continue;
      if(promise.sent_before) { /* reject if sent once before */
         // TODO: i18n
         // promise.reject({message: 'connection closed.'.i18n()});
         promise.reject({message: 'connection closed.'});
      } else { /* send */
         promise.sent_before = true;
         socket.send(JSON.stringify(promise.data));
      }
   }
   while (buffered_execs.length > 0)
      buffered_execs.shift()();
}

/* execute buffered executes */
const onmessage = (message) => {
   const data = JSON.parse(message.data);

   /* do not block the main thread */
   events.trigger(data.msg_type, data);

   const key = data.req_id;
   const promise = unresolved_promises[key];
   if (promise) {
      delete unresolved_promises[key];
      if (data.error) {
         data.error.echo_req = data.echo_req;
         data.error.req_id = data.req_id;
         promise.reject(data.error);
      }
      else
         promise.resolve(data);
   }
}

// TODO: 
//this is triggering asycn loading of tick_handler.
//the module will automatically start working as soon as its loaded
// require(['websockets/stream_handler']); // require tick_handler to handle ticks.

/* send a raw request and return a promise */
let req_id_counter = 0;
const send_request = (data) => {
   data.req_id = ++req_id_counter;

   return new Promise((resolve,reject) => {
      unresolved_promises[data.req_id] = { resolve: resolve, reject: reject, data: data };
      if (is_connected()) {
         socket.send(JSON.stringify(data));
      } else
         buffered_sends.push(data);
   });
};

const timeout_promise =(key, milliseconds) => {
   _.delay(() => {
      const promise = unresolved_promises[key];
      if (promise) {
         delete unresolved_promises[key];
         // TODO: i18n
         // promise.reject({message: 'timeout for websocket request'.i18n()});
         promise.reject({message: 'timeout for websocket request'});
      }
   }, milliseconds);
};

export const events = $('<div/>'); // use jquery in memory object for events.

/* execute callback when the connection is ready */
export const execute = (cb) => {
   if (is_connected())
      setTimeout(cb, 0);// always run the callback async
   else
      buffered_execs.push(cb);
}

export const cached  = {
   /* Note: Will cache only if the result was successfull.*/
   send:(data) => {
      const key = JSON.stringify(data);
       if (cached_promises[key])
           return cached_promises[key].promise;
      cached_promises[key] = { data: data, promise: null };
      return cached_promises[key].promise = api.send(data)
         .catch((up) => {
            /* we don't want to cache promises that are rejected,
             clear the cache in case of promise rejection */
            delete cached_promises[key];
            throw up;
         });
   }
}

/* sends a request and returns an es6-promise */
export const send = (data, timeout) => {
   const promise = send_request(data);
   //note: "timeout" is a temporary fix for backend, try not to use it.
   if(timeout) timeout_promise(data.req_id, timeout);
   return promise;
}

const api = {
   events,
   execute,
   cached,
   send
};

export default api;
