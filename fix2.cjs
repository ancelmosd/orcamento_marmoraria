const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf-8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

replaceFile('src/utils/helpers.tsx', c => c.replace("import { normalizeSearchText } from '../types';", 
`export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
}`));

replaceFile('src/components/SettingsView.tsx', c => {
  let res = c.replace(", FINISHING_TYPES, EDGE_TYPES } from 'framer-motion'", "} from 'framer-motion'");
  if(!res.includes('FINISHING_TYPES')) {
    res = res.replace("from '../types';", "FINISHING_TYPES, EDGE_TYPES } from '../types';");
  }
  return res.replace("import { normalizeSearchText", "import { CustomList } from '../utils/helpers';\nimport { normalizeSearchText");
});

replaceFile('src/components/QuotesView.tsx', c => {
  let res = c.replace("import PhotoGallery from './PhotoGallery';", "import { PhotoGallery } from './PhotoGallery';");
  return res.replace("import { normalizeSearchText", "import { CustomList } from '../utils/helpers';\nimport { normalizeSearchText");
});

replaceFile('src/components/QuickQuoteView.tsx', c => {
  return c.replace("import { normalizeSearchText", "import { CustomList, evaluateFormula } from '../utils/helpers';\nimport { normalizeSearchText");
});

replaceFile('src/components/CutPlanView.tsx', c => {
  return c.replace("import { normalizeSearchText", "import { CustomList } from '../utils/helpers';\nimport { normalizeSearchText");
});

replaceFile('src/components/ServicesView.tsx', c => {
  return c.replace("category: 'other'", "category: 'other' as 'finish'|'edge'|'other'");
});

console.log("Fix2 executed");
