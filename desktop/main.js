// ============================================
// ClearCorex Desktop — Electron main process
// ============================================
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0a0e1a',
    title: 'ClearCorex',
    show: false,
    frame: false,                 // Use our custom in-app titlebar (single X, no OS chrome)
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in the default browser, never inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================
// IPC handlers
// ============================================

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open email list',
    properties: ['openFile'],
    filters: [
      { name: 'Email lists', extensions: ['csv', 'txt', 'tsv', 'json', 'log'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 50 * 1024 * 1024) {
      return { error: 'File is too large (max 50 MB).' };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { name: path.basename(filePath), size: stat.size, content };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('file:save', async (_e, { defaultName, content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save export',
    defaultPath: defaultName || 'clearcorex-export.csv',
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePath) return { ok: false };
  try {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { ok: true, path: result.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('app:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url);
});

ipcMain.handle('app:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.handle('app:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('app:close',    () => mainWindow && mainWindow.close());
