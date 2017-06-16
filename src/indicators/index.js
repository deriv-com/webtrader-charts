import './IndicatorBase.js';

// import './cdl.js';
/* amin:
 * cdl.js is too big, even after minfiying with uglifyjs.
 * But uglifyjs has an option to mangle property names, we can CAREFULLY take advantage of this option.
 *
 * Use this command to mangle object properties, 
 *
 * "uglifyjs cdl.js --beautify --mangle-props regex=/^(candle|isCandle).*$/  > cdl-mangled-props.js"
 *
 * the file cdl-mangled-props.js will be included in the project bundle.
 * This will reduce the final bundle size about 35KB.
*/
import './cdl-mangled-props.js';

import './stoch.js';
import './sma.js';
import './wma.js';
import './ema.js';
import './tema.js';
import './trima.js';
import './ATR.js';
import './adx.js';
import './bbands.js';
import './dema.js';
import './lsma.js';
import './ppo.js';
import './stochrsi.js';
import './ultosc.js';
import './BOP.js';
import './adxr.js';
import './cc.js';
import './dx.js';
import './lwma.js';
import './roc.js';
import './stochs.js';
import './var.js';
import './alligator.js';
import './cci.js';
import './macd.js';
import './rsi.js';
import './sum.js';
import './wclprice.js';
import './NATR.js';
import './alma.js';
import './fractal.js';
import './mama.js';
import './sar.js';
import './t3.js';
import './ROCP.js';
import './ao.js';
import './chop.js';
import './hma.js';
import './mass.js';
import './ROCR.js';
import './apo.js';
import './cks.js';
import './ichimoku.js';
import './max.js';
import './smma.js';
import './trange.js';
import './STDDEV.js';
import './aroon.js';
import './cmo.js';
import './min.js';
import './aroonosc.js';
import './dc.js';
import './kama.js';
import './mom.js';
import './stochf.js';
import './typprice.js'; 
