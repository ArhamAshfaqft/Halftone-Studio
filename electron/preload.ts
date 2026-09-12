import { contextBridge, ipcRenderer } from 'electron';

export interface OpenFileResult {
  path: string;
  name: string;
  dataUrl: string;
}

export interface ElectronAPI {
  openFile: () => Promise<OpenFileResult | null>;
  saveFileDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  writeBuffer: (filePath: string, bufferData: number[]) => Promise<{ success: boolean; error?: string }>;
  isDesktop: boolean;
}

const api: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  writeBuffer: (filePath, bufferData) => ipcRenderer.invoke('file:writeBuffer', { filePath, bufferData }),
  isDesktop: true,
};

contextBridge.exposeInMainWorld('electronAPI', api);
