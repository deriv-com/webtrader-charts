const fs = require('fs');
const path = require('path');

const i18nDir = path.dirname(require.main.filename);

const languages =  [
   'ar', 'en', 'de', 'es', 'fr', 'id', 'it', 'pl', 'pt', 'ru', 'th', 'vi', 'zh_cn', 'zh_tw',
   // 'ach', 'ja', 'nl', 'zh', 
];
const keys = [
   'Cancel', 'OK',
   // overlay-management + indicator-management
   'Add comparisons', 'Current comparisons', 'Current indicators', 'Favorites', 'Add indicator', 'Volatility Indicators',
   'Overlap Studies', 'Momentum Indicators', 'Price Transformation', 
   'Statistical Functions', 'Pattern Recognition', 'Bill Williams',
   // chart-options
   'Time interval', 'Chart type', 'Indicators', 'Comparisons', 'Drawing tools',
   'Chart template', 'Share chart', 'Share', 'Link', 'Embed code', 'Download as',
   'Candles', 'OHLC', 'Line' , 'Dot' , 'Line Dot' , 'Spline' , 'Table', 'Crosshair',
   'Vertical line', 'Horizontal line', 'Tick', '1 Tick', '1 Minute', '1 Hour',
   '1 Day', 'Ticks', 'Minutes', 'Hours', 'Days',
   // chart-template-manager
   'Load chart template', 'Save changes', 'Save as', 'Upload template', 'Back', 'Save',
   `You haven't saved any templates yet`, 'Name', 'This field is required', 'Rename',
   `Use the "Save as ..." button to save the chart settings, type, time period, indicators and comparisons`,
   
   // 'Are you sure you want to delete template?', 'Are you sure you want to overwrite current template?', 
   // 'Template changes saved', 'Invalid JSON file', 'Invalid template type', 'Successfully applied the template and saved it as',
   // 'Downloading template as', 'Template name already exists',
   // 'Add/Remove indicators', 'Add/Remove comparisons',
];

const dictionary = { };
keys.forEach(key => {
   dictionary[key] = { };
   languages.forEach(lang => {
      dictionary[key][lang] = '';
   });
});

for(const lang of languages) {
   const filePath = path.join(i18nDir, `${lang}.json`);
   const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
   keys.forEach(key => {
         if(key === 'OK') {
            dictionary[key][lang] = (content['Ok'] && content['Ok'][1]) || '';
         }
         else {
            dictionary[key][lang] = (content[key] && content[key][1]) || '';
         }
         if(dictionary[key][lang] === key)
            dictionary[key][lang] = '';
      });
}

fs.writeFileSync(path.join(i18nDir, 'dictionary.json'), JSON.stringify(dictionary), 'utf-8'); 
console.log('Done.');
