import $ from 'jquery';
import _ from 'lodash';
import notification from './notification.js';
import {globals} from './globals.js';
import {i18n} from './utils.js';

let socket = null;

export const init = ({appId, lang = 'en', server = 'wss://ws.binaryws.com/websockets/v3'}) => {
   if(!appId) {
      throw new Error("appId is requried");
   }
   globals.config.appId = appId;
   globals.config.lang = lang;
   globals.config.server = server;
   connect();
}

const connect = () => {
   const ws = new WebSocket(globals.config.url);

   ws.addEventListener('open', onopen);
   ws.addEventListener('close', onclose);
   ws.addEventListener('message', onmessage);

   ws.addEventListener('error',(event) => {
      onclose(); // try to reconnect
   });

   socket = ws;
   // window.ss = socket;
   return ws;
}

const send_raw = obj => {
   socket.send(JSON.stringify(obj));
}

let timeoutIsSet = false;
const onclose = () => {
   notification.error(`${i18n('Connection error')}.`, '.webtrader-charts-chart-window-contianer');
   if(!timeoutIsSet) {
      timeoutIsSet = true;
      setTimeout(() => {
         timeoutIsSet = false;
         connect();
      }, 100);
   }
}

const buffered_execs = [];
const buffered_sends = [];
const unresolved_promises = { /* req_id: { resolve: resolve, reject: reject, data: data } */};
const cached_promises = { /* key: {data: data, promise: promise } */}; /* requests that have been cached */
const is_connected = () => (socket && (socket.readyState === 1));


let is_onopen_first_time = true;
const onopen = () => {
   /* send buffered sends */
   while(buffered_sends.length > 0) {
      const data = buffered_sends.shift();
      if(!unresolved_promises[data.req_id]) {
         send_raw(data);
      }
   }
   /* if the connection got closed while the result of an unresolved request
           is not back yet, issue the same request again */
   for(const key in unresolved_promises) {
      const promise = unresolved_promises[key];
      if(!promise) continue;
      if(promise.sent_before) { /* reject if sent once before */
         promise.reject({message: `${i18n('connection closed')}.`});
      } else { /* send */
         promise.sent_before = true;
         send_raw(promise.data);
      }
   }
   while (buffered_execs.length > 0)
      buffered_execs.shift()();

   if(!is_onopen_first_time) {
      // ChartingRequestMap uses this event to refresh charts
      events.trigger('connection-reopen');
      notification.clear();
   }
   is_onopen_first_time = false;
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

/* send a raw request and return a promise */
let req_id_counter = 0;
const send_request = (data) => {
   data.req_id = ++req_id_counter;

   return new Promise((resolve,reject) => {
      unresolved_promises[data.req_id] = { resolve: resolve, reject: reject, data: data };
      if (is_connected()) {
         send_raw(data);
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
