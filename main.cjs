const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const indexHtmlPath = path.join(__dirname, 'dist', 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ dist/index.html not found. Run: npm run build');
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Gawde & Gawde Computer Services'
  });

  win.loadFile(indexHtmlPath);
}

app.whenReady().then(createWindow);
