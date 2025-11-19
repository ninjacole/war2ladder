// Script to fix manifest.json paths by URL encoding them
const fs = require('fs');
const path = require('path');

const manifestPath = './public/maps/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const fixedManifest = manifest.map(item => ({
    name: item.name,
    path: `/maps/${encodeURIComponent(item.name)}`
}));

fs.writeFileSync(manifestPath, JSON.stringify(fixedManifest, null, 2));
console.log('Fixed manifest.json with URL-encoded paths');