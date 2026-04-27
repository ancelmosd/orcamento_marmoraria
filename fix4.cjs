const fs = require('fs');

function fix(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, replacer(c));
}

// 1. SettingsView
fix('src/components/SettingsView.tsx', c => {
  return c.replace(/import \{ (.*?)FINISHING_TYPES.*?\} from 'framer-motion';/g, "import { $1 } from 'framer-motion';");
});

// 2. QuickQuoteView
fix('src/components/QuickQuoteView.tsx', c => {
  c = c.replace(/import \{ (.*?)FINISHING_TYPES.*?\} from 'framer-motion';/g, "import { $1 } from 'framer-motion';");
  c = c.replace(/import \{ evaluateFormula \} from '\.\.\/utils\/helpers';\n/g, '');
  return c;
});

// 3. QuotesView default export issue
fix('src/components/QuotesView.tsx', c => {
  return c.replace("import PhotoGallery from './PhotoGallery';", "import { PhotoGallery } from './PhotoGallery';");
});

// 4. ServicesView category type issue
fix('src/components/ServicesView.tsx', c => {
  c = c.replace(/category: e.target.value as any/g, "category: e.target.value as 'finish'|'edge'|'other'");
  c = c.replace("normalizeSearchText(m.price)", "normalizeSearchText(String(m.price))")
  c = c.replace("normalizeSearchText(m.minutes_per_meter)", "normalizeSearchText(String(m.minutes_per_meter))")
  return c;
});

console.log('Fixed TS finally');
