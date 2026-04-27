const fs = require('fs');

const files = ['CutPlanView.tsx', 'QuickQuoteView.tsx', 'SettingsView.tsx'];
files.forEach(f => {
  const p = 'src/components/' + f;
  let code = fs.readFileSync(p, 'utf-8');
  code = code.replace(/import \{.*?\} from '\.\.\/types';/s, (match) => {
    return match.replace('}', ', FINISHING_TYPES, EDGE_TYPES }');
  });
  fs.writeFileSync(p, code);
  console.log('Fixed imports in ' + f);
});

// QuotesView needs generateQuotePDF
let qs = fs.readFileSync('src/components/QuotesView.tsx', 'utf-8');
qs = qs.replace(/import \{.*?\} from '\.\.\/types';/s, (match) => {
  return match + '\nimport { generateQuotePDF } from \'../utils/pdfGenerator\';';
});
fs.writeFileSync('src/components/QuotesView.tsx', qs);
console.log('Fixed QuotesView');

// ServicesView missing category
let sv = fs.readFileSync('src/components/ServicesView.tsx', 'utf-8');
sv = sv.replace(/setFormData\(\{ name: '', price: '', description: '', minutes_per_meter: '' \}\)/g, 'setFormData({ name: \'\', price: \'\', description: \'\', minutes_per_meter: \'\', category: \'other\' })');
fs.writeFileSync('src/components/ServicesView.tsx', sv);
console.log('Fixed ServicesView');
