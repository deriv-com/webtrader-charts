import $ from 'jquery';
export const globals = {
   notification: {
      error: (msg) => $.growl && $.growl.error && $.growl.error({message: msg}),
      warning: (msg) => $.growl && $.growl.warning && $.growl.warning({message: msg}),
      notice: (msg) => $.growl && $.growl.notice && $.growl.notice({message: msg}),
   }
};

export default { globals };
