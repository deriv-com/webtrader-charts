import toastr from '../lib/toastr.js';

toastr.options = {
  closeButton: false,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: 'toast-bottom-right',
  containerId: 'toast-container',
  preventDuplicates: true,
  onclick: null,
  showDuration: '300',
  hideDuration: '1000',
  timeOut: '5000',
  extendedTimeOut: '1000',
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut'
};
export const error = (msg, target = 'body') => {
   toastr.error(msg, '', { target: target });
}
export const warning =  (msg, target = 'body') => {
   toastr.warning(msg, '', { target: target });
};
export const info = (msg, target = 'body') => {
   toastr.info(msg, '', { target: target });
};
export const clear = () => toastr.clear();

export default {
   error,
   warning,
   info,
   clear,
};
