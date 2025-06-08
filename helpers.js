const fs = require('fs');
const path = require('path');

function parseMarkdown(content) {
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled> $1</li>')
    .replace(/^- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled> $1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>');

  html = html.replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul><br><ul>/gim, '');

  html = html.replace(/(<br>){2,}/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1');

  return html;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function readMarkdownFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeMarkdownFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

module.exports = {
  parseMarkdown,
  countWords,
  readMarkdownFile,
  writeMarkdownFile,
  listMarkdownFiles
};
