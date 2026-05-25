// Script to create a placeholder icon for electron-builder
// Run: node electron/create-icon.js
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Created electron/assets/ directory');
}
console.log('Assets directory ready at:', assetsDir);
