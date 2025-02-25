const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy HTML file to dist
try {
  console.log('Copying ui.html to dist...');
  fs.copyFileSync('ui.html', path.join('dist', 'ui.html'));
  console.log('Copied ui.html to dist.');
} catch (error) {
  console.error('Error copying ui.html:', error);
  process.exit(1);
}

// Copy manifest.json to dist
try {
  console.log('Copying manifest.json to dist...');
  fs.copyFileSync('manifest.json', path.join('dist', 'manifest.json'));
  console.log('Copied manifest.json to dist.');
} catch (error) {
  console.error('Error copying manifest.json:', error);
  process.exit(1);
}

console.log('Copy completed successfully!'); 