const fs = require('fs');

let cnt = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');
cnt = cnt.replace("import { Client, Material", "import { FINISHING_TYPES, EDGE_TYPES, Client, Material");
fs.writeFileSync('src/components/SettingsView.tsx', cnt);

let qq = fs.readFileSync('src/components/QuickQuoteView.tsx', 'utf-8');
qq = qq.replace("import { Client, Material", "import { FINISHING_TYPES, EDGE_TYPES, ModulePartService, ModulePartSupply, Client, Material");
qq = qq.replace("import { CustomList, evaluateFormula }", "import { CustomList }");
qq = qq.replace("import { normalizeSearchText", "import { evaluateFormula } from '../utils/helpers';\nimport { normalizeSearchText");
qq = qq.replace("import React, { useState, useEffect, useRef }", "import React, { useState, useEffect, useRef, useMemo }");
fs.writeFileSync('src/components/QuickQuoteView.tsx', qq);

let qv = fs.readFileSync('src/components/QuotesView.tsx', 'utf-8');
qv = qv.replace("import { PhotoGallery } from './PhotoGallery';", "import PhotoGallery from './PhotoGallery';");
fs.writeFileSync('src/components/QuotesView.tsx', qv);

let sv = fs.readFileSync('src/components/ServicesView.tsx', 'utf-8');
sv = sv.replace("category: e.target.value", "category: e.target.value as any");
fs.writeFileSync('src/components/ServicesView.tsx', sv);

console.log('Fixed more TS errors');
