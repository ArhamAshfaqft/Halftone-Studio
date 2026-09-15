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

ipcMain.handle('license:verify', async (_, licenseKey: string) => {
  const cleanKey = (licenseKey || '').trim();
  if (!cleanKey) return { success: false, message: 'Please enter a license key.' };

  const params = new URLSearchParams();
  params.append('product_id', 'DSmaPzQfRhVyw-LVGp2s8w==');
  params.append('license_key', cleanKey);
  params.append('increment_uses_count', 'true');

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, message: data.message || 'Invalid license key for this product.' };
    }

    const purchase = data.purchase || {};
    if (purchase.refunded) return { success: false, message: 'This license has been refunded.' };
    if (purchase.chargebacked || purchase.disputed) return { success: false, message: 'This license is disputed or chargebacked.' };
    if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
      return { success: false, message: 'The subscription for this license has expired.' };
    }

    return {
      success: true,
      licenseInfo: {
        key: cleanKey,
        email: purchase.email || 'Verified Customer',
        productName: purchase.product_name || 'Halftone Studio',
        purchaseDate: purchase.created_at || new Date().toISOString(),
        verifiedAt: Date.now(),
        uses: data.uses || 1,
      }
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error contacting Gumroad.' };
  }
});
