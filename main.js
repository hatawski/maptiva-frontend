const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,    // set true in production
    kiosk: false,         // set true in production to fully lock
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // loads your React app
  mainWindow.loadURL("http://localhost:3000");

  // ✅ Emergency escape — Ctrl+Shift+F12
  globalShortcut.register("CommandOrControl+Shift+F12", () => {
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") app.quit();
});