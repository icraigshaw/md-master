// MD Master Plugin - JavaScript functionality
const fs = require('fs');
const path = require('path');

function showError(message) {
  if (typeof alert !== 'undefined') {
    alert(message);
  } else {
    console.error(message);
  }
}

class MDMaster {
  constructor() {
    this.files = [];
    this.currentFile = null;
    this.currentFilter = 'all';
    this.currentSort = 'name';
    this.activeTab = 'edit';
    
    this.init();
  }
  
  init() {
    this.dataDir = (typeof plugin !== 'undefined' && plugin.getDataPath)
      ? plugin.getDataPath()
      : path.join(__dirname, 'data');
    this.loadFilesFromDisk();
    this.bindEvents();
    this.renderFileList();
    this.updateWordCount();
    this.updateFileCounts();
  }
  
  loadFilesFromDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const mdFiles = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.md'));

      if (mdFiles.length === 0) {
        const examplePath = path.join(this.dataDir, 'Example.md');
        const exampleContent = '# Welcome to MD Master\n\nStart writing your markdown here.';
        fs.writeFileSync(examplePath, exampleContent, 'utf8');
        mdFiles.push('Example.md');
      }

      this.files = mdFiles.map(file => {
        const filePath = path.join(this.dataDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const stat = fs.statSync(filePath);
        return {
          id: path.basename(file, '.md'),
          name: file,
          path: filePath,
          content,
          modifiedDate: stat.mtime.toISOString(),
          wordCount: this.countWords(content),
          size: stat.size,
          folder: 'documents'
        };
      });
    } catch (err) {
      const msg = `Failed to load files: ${err.message}`;
      if (typeof alert !== 'undefined') {
        alert(msg);
      } else {
        console.error(msg);
      }
      this.files = [];
    }
  }
  
  bindEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const filter = e.currentTarget.dataset.filter;
        if (filter) {
          this.setFilter(filter);
        }
      });
    });
    
    // Folder toggle
    document.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFolder(e.currentTarget);
      });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchFiles(e.target.value);
      });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderFileList();
      });
    }
    
    // Editor tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });
    
    // Toolbar actions
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        this.executeToolbarAction(action);
      });
    });
    
    // Editor content change
    const markdownEditor = document.getElementById('markdownEditor');
    const splitEditor = document.getElementById('splitEditor');
    
    if (markdownEditor) {
      markdownEditor.addEventListener('input', (e) => {
        this.updateContent(e.target.value);
        this.updateWordCount();
        this.updatePreview();
      });
    }
    
    if (splitEditor) {
      splitEditor.addEventListener('input', (e) => {
        this.updateContent(e.target.value);
        this.updateWordCount();
        this.updateSplitPreview();
      });
    }
    
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveCurrentFile();
      });
    }
    
    // New file button
    const newFileBtn = document.getElementById('newFileBtn');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.createNewFile();
      });
    }
    
    // New folder button
    const newFolderBtn = document.getElementById('newFolderBtn');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.createNewFolder();
      });
    }
  }
  
  setFilter(filter) {
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-filter="${filter}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    this.currentFilter = filter;
    this.renderFileList();
    this.updatePanelTitle();
  }
  
  updatePanelTitle() {
    const panelTitle = document.getElementById('panelTitle');
    if (panelTitle) {
      const titles = {
        'all': 'All Files',
        'recent': 'Recent Files',
        'projects': 'Projects',
        'work': 'Work',
        'personal': 'Personal'
      };
      panelTitle.textContent = titles[this.currentFilter] || 'Files';
    }
  }
  
  toggleFolder(folderElement) {
    const isCollapsed = folderElement.classList.contains('collapsed');
    const children = folderElement.parentElement.querySelector('.folder-children');
    
    if (children) {
      if (isCollapsed) {
        folderElement.classList.remove('collapsed');
        children.classList.remove('hidden');
      } else {
        folderElement.classList.add('collapsed');
        children.classList.add('hidden');
      }
    }
  }
  
  getFilteredFiles() {
    let filtered = [...this.files];
    
    // Apply filter
    if (this.currentFilter === 'recent') {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(file => new Date(file.modifiedDate) > twoDaysAgo);
    } else if (this.currentFilter !== 'all') {
      filtered = filtered.filter(file => file.folder === this.currentFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.modifiedDate) - new Date(a.modifiedDate);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });
    
    return filtered;
  }
  
  searchFiles(query) {
    if (!query.trim()) {
      this.renderFileList();
      return;
    }
    
    const filtered = this.files.filter(file => 
      file.name.toLowerCase().includes(query.toLowerCase()) ||
      file.content.toLowerCase().includes(query.toLowerCase())
    );
    
    this.renderFileList(filtered);
  }
  
  renderFileList(customFiles = null) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    if (!customFiles) {
      this.loadFilesFromDisk();
    }

    const files = customFiles || this.getFilteredFiles();
    
    fileList.innerHTML = '';
    
    files.forEach(file => {
      const fileElement = this.createFileElement(file);
      fileList.appendChild(fileElement);
    });
    
    // Update counts
    this.updateFileCounts();
    
    // Restore active file if it exists
    if (this.currentFile) {
      const activeElement = document.querySelector(`[data-file-id="${this.currentFile.id}"]`);
      if (activeElement) {
        activeElement.classList.add('active');
      }
    }
  }
  
  createFileElement(file) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    fileElement.dataset.fileId = file.id;
    
    const preview = file.content.replace(/[#*\-\[\]]/g, '').substring(0, 100);
    const date = new Date(file.modifiedDate).toLocaleDateString();
    
    fileElement.innerHTML = `
      <div class="file-name">${file.name}</div>
      <div class="file-preview">${preview}...</div>
      <div class="file-meta">
        <span class="file-date">${date}</span>
        <span class="file-words">${file.wordCount} words</span>
      </div>
    `;
    
    fileElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openFile(file);
    });
    
    return fileElement;
  }
  
  updateFileCounts() {
    const allCount = this.files.length;
    const recentCount = this.files.filter(file => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      return new Date(file.modifiedDate) > twoDaysAgo;
    }).length;
    
    const allCountElement = document.querySelector('[data-filter="all"] .nav-count');
    const recentCountElement = document.querySelector('[data-filter="recent"] .nav-count');
    
    if (allCountElement) allCountElement.textContent = allCount;
    if (recentCountElement) recentCountElement.textContent = recentCount;
    
    // Update folder counts
    const folders = ['projects', 'work', 'personal'];
    folders.forEach(folder => {
      const count = this.files.filter(file => file.folder === folder).length;
      const element = document.querySelector(`[data-filter="${folder}"] .nav-count`);
      if (element) {
        element.textContent = count;
      }
    });
  }
  
  openFile(file) {
    // Update active file in list
    document.querySelectorAll('.file-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const fileElement = document.querySelector(`[data-file-id="${file.id}"]`);
    if (fileElement) {
      fileElement.classList.add('active');
    }
    
    this.currentFile = file;
    
    // Hide welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
      welcomeMessage.classList.add('hidden');
    }
    
    // Update editor content
    const markdownEditor = document.getElementById('markdownEditor');
    const splitEditor = document.getElementById('splitEditor');
    
    if (markdownEditor) {
      markdownEditor.value = file.content;
    }
    if (splitEditor) {
      splitEditor.value = file.content;
    }
    
    this.updatePreview();
    this.updateSplitPreview();
    this.updateWordCount();
  }
  
  switchTab(tab) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeTabBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTabBtn) {
      activeTabBtn.classList.add('active');
    }
    
    this.activeTab = tab;
    
    const editorContainer = document.getElementById('editorContainer');
    const splitView = document.getElementById('splitView');
    const markdownEditor = document.getElementById('markdownEditor');
    const markdownPreview = document.getElementById('markdownPreview');
    
    // Reset visibility
    if (editorContainer) editorContainer.classList.remove('hidden');
    if (splitView) splitView.classList.add('hidden');
    if (markdownEditor) markdownEditor.classList.remove('hidden');
    if (markdownPreview) markdownPreview.classList.add('hidden');
    
    switch (tab) {
      case 'edit':
        // Already set correctly above
        break;
      case 'preview':
        if (markdownEditor) markdownEditor.classList.add('hidden');
        if (markdownPreview) markdownPreview.classList.remove('hidden');
        this.updatePreview();
        break;
      case 'split':
        if (editorContainer) editorContainer.classList.add('hidden');
        if (splitView) splitView.classList.remove('hidden');
        this.updateSplitPreview();
        break;
    }
  }
  
  updatePreview() {
    const markdownEditor = document.getElementById('markdownEditor');
    const markdownPreview = document.getElementById('markdownPreview');
    
    if (markdownEditor && markdownPreview) {
      const content = markdownEditor.value;
      markdownPreview.innerHTML = this.parseMarkdown(content);
    }
  }
  
  updateSplitPreview() {
    const splitEditor = document.getElementById('splitEditor');
    const splitPreview = document.getElementById('splitPreview');
    
    if (splitEditor && splitPreview) {
      const content = splitEditor.value;
      splitPreview.innerHTML = this.parseMarkdown(content);
    }
  }
  
  parseMarkdown(content) {
    // Simple markdown parser
    let html = content
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      // Blockquotes
      .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      // Checkboxes
      .replace(/^- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled> $1</li>')
      .replace(/^- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled> $1</li>')
      // Numbered lists
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n/gim, '<br>');
    
    // Wrap consecutive list items in ul
    html = html.replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul><br><ul>/gim, '');
    
    // Handle paragraphs
    html = html.replace(/(<br>){2,}/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1');
    
    return html;
  }
  
  updateContent(content) {
    if (this.currentFile) {
      this.currentFile.content = content;
      this.currentFile.wordCount = this.countWords(content);
      this.currentFile.modifiedDate = new Date().toISOString();
      
      // Update file list
      this.renderFileList();
    }
  }
  
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  updateWordCount() {
    const editor = this.activeTab === 'split' ? 
      document.getElementById('splitEditor') : 
      document.getElementById('markdownEditor');
    
    const wordCountElement = document.getElementById('wordCount');
    
    if (editor && wordCountElement) {
      const wordCount = this.countWords(editor.value);
      wordCountElement.textContent = `${wordCount} words`;
    }
  }
  
  executeToolbarAction(action) {
    const editor = this.activeTab === 'split' ? 
      document.getElementById('splitEditor') : 
      document.getElementById('markdownEditor');
    
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    let replacement = '';
    let newCursorPos = start;
    
    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        newCursorPos = selectedText ? start + replacement.length : start + 2;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        newCursorPos = selectedText ? start + replacement.length : start + 1;
        break;
      case 'header':
        replacement = `# ${selectedText}`;
        newCursorPos = selectedText ? start + replacement.length : start + 2;
        break;
      case 'list':
        replacement = `- ${selectedText}`;
        newCursorPos = selectedText ? start + replacement.length : start + 2;
        break;
      case 'link':
        replacement = `[${selectedText || 'link text'}](url)`;
        newCursorPos = start + replacement.length - 4;
        break;
      case 'code':
        replacement = `\`${selectedText}\``;
        newCursorPos = selectedText ? start + replacement.length : start + 1;
        break;
    }
    
    editor.value = editor.value.substring(0, start) + replacement + editor.value.substring(end);
    editor.focus();
    editor.setSelectionRange(newCursorPos, newCursorPos);
    
    // Update content and preview
    this.updateContent(editor.value);
    this.updateWordCount();
    if (this.activeTab === 'preview' || this.activeTab === 'split') {
      this.updatePreview();
      this.updateSplitPreview();
    }
  }
  
  saveCurrentFile() {
    if (!this.currentFile) return;

    const fileName = this.currentFile.name.endsWith('.md')
      ? this.currentFile.name
      : `${this.currentFile.name}.md`;
    const filePath = path.join(this.dataDir, fileName);

    fs.writeFile(filePath, this.currentFile.content, 'utf8', (err) => {
      const saveBtn = document.getElementById('saveBtn');

      if (err) {
        showError(`Failed to save file: ${err.message}`);
        if (saveBtn) {
          const originalText = saveBtn.textContent;
          saveBtn.textContent = 'Error saving!';
          saveBtn.style.backgroundColor = 'var(--color-error)';
          setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
          }, 2000);
        }
        return;
      }

      this.currentFile.path = filePath;
      try {
        const stat = fs.statSync(filePath);
        this.currentFile.modifiedDate = stat.mtime.toISOString();
        this.currentFile.size = stat.size;
      } catch (statErr) {
        showError(`Failed to read saved file info: ${statErr.message}`);
      }

      this.renderFileList();

      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.backgroundColor = 'var(--color-success)';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.backgroundColor = '';
        }, 2000);
      }
    });
  }
  
  createNewFile() {
    const fileName = prompt('Enter file name:', 'New File.md');
    if (!fileName) return;

    const folder = prompt('Enter folder (relative to library):', '') || '';
    const finalName = fileName.endsWith('.md') ? fileName : fileName + '.md';
    const dirPath = path.join(this.dataDir, folder);
    const filePath = path.join(dirPath, finalName);
    const content = '# ' + finalName.replace('.md', '') + '\n\nStart writing...';

    fs.mkdir(dirPath, { recursive: true }, (dirErr) => {
      if (dirErr) {
        showError(`Failed to create folder: ${dirErr.message}`);
        return;
      }

      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          showError(`Failed to create file: ${err.message}`);
          return;
        }

        this.loadFilesFromDisk();
        this.renderFileList();

        const newFile = this.files.find(f => f.path === filePath);
        if (newFile) {
          this.openFile(newFile);
        }
      });
    });
  }
  
  createNewFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const folderPath = path.join(this.dataDir, folderName);

    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        showError(`Failed to create folder: ${err.message}`);
        return;
      }

      this.loadFilesFromDisk();
      this.renderFileList();
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MDMaster();
});