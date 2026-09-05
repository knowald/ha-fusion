import { readFileSync } from 'node:fs';
import { translation } from '$lib/core/i18n';

// components render through $lang(); load the English file so assertions can
// read the copy a user sees rather than translation keys
translation.set(JSON.parse(readFileSync('static/translations/en.json', 'utf8')));
