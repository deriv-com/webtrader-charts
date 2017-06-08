import $ from 'jquery';
export const globals = {
   notification: {
      error: (msg) => $.growl && $.growl.error && $.growl.error({message: msg}),
      warning: (msg) => $.growl && $.growl.warning && $.growl.warning({message: msg}),
      notice: (msg) => $.growl && $.growl.notice && $.growl.notice({message: msg}),
   },
   config: {
      appId: null,
      lang: 'en', // i18n() in utils.js uses this.
      server: 'wss://ws.binaryws.com/websockets/v3',
      get url() {
         return `${this.server}?l=${this.lang}&app_id=${this.appId}`;
      }
   }
};

export default { globals };
