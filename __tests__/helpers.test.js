const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  parseMarkdown,
  countWords,
  readMarkdownFile,
  writeMarkdownFile,
  listMarkdownFiles
} = require('../js/helpers');

describe('parseMarkdown', () => {
  test('converts headers and emphasis', () => {
    const md = '# Title\n\n**bold** and *italic*';
    const html = parseMarkdown(md);
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });
});

describe('countWords', () => {
  test('counts words correctly', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('  multiple   spaces  ')).toBe(2);
    expect(countWords('')).toBe(0);
    expect(countWords('some\nlines here')).toBe(3);
  });
});

describe('file operations', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdtest-'));
  const filePath = path.join(tmpDir, 'test.md');
  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('write, read and list markdown files', () => {
    const content = '# Sample';
    writeMarkdownFile(filePath, content);
    expect(fs.existsSync(filePath)).toBe(true);
    const read = readMarkdownFile(filePath);
    expect(read).toBe(content);
    const files = listMarkdownFiles(tmpDir);
    expect(files).toContain(filePath);
  });
});
