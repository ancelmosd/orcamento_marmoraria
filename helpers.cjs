const fs = require('fs');
const content = fs.readFileSync('scratch.tsx', 'utf-8');

const importsHeader = `import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { normalizeSearchText } from '../types';

`;

const exportsContent = content.replace(/^function/gm, 'export function');

fs.mkdirSync('src/utils', {recursive: true});
fs.writeFileSync('src/utils/helpers.tsx', importsHeader + exportsContent);
console.log('Created helpers.tsx');
