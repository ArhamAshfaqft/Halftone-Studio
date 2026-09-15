import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function getAppIcon(): string | undefined {
  const possiblePaths = [
    path.join(__dirname, 'icon.ico'),
    path.join(__dirname, 'icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(process.resourcesPath, 'build/icon.ico'),
    path.join(process.resourcesPath, 'build/icon.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0B0D11',
    title: 'Halftone Studio',
    icon: appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.halftonestudio.pro');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Native IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Artwork File',
    properties: ['openFile'],
    filters: [
      { name: 'Supported Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const base64 = `data:${mime};base64,${buffer.toString('base64')}`;

  return {
    path: filePath,
    name: path.basename(filePath),
    dataUrl: base64
  };
});

ipcMain.handle('dialog:saveFile', async (_, options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Prepress File',
    defaultPath: options.defaultPath,
    filters: options.filters || [
      { name: 'PNG Image', extensions: ['png'] }
    ]
  });

  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

ipcMain.handle('file:writeBuffer', async (_, { filePath, bufferData }: { filePath: string; bufferData: number[] }) => {
  try {
    const buffer = Buffer.from(bufferData);
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save file' };
  }
});
