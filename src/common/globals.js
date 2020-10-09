import $ from 'jquery';

export const globals = {
   config: {
      appId: null,
      brand: 'binary',
      lang: 'en', // i18n() in utils.js uses this.
      server: 'wss://ws.binaryws.com/websockets/v3',
      get url() {
         return `${this.server}?l=${this.lang}&app_id=${this.appId}&brand=${this.brand}`;
      }
   }
};

export default { globals };
