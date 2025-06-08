const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const files = ['manifest.json', 'js/main.js', 'index.html', 'js/plugin.js', 'style.css'];
const distDir = path.join(__dirname, '..', 'dist');
const outputPath = path.join(distDir, 'md-master-plugin.zip');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
});

archive.on('error', err => {
  throw err;
});

archive.pipe(output);

files.forEach(file => {
  archive.file(path.join(__dirname, '..', file), { name: file });
});

archive.finalize();
