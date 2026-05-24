const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,   // ← fullscreen in production
    kiosk: true,        // ← lock the PC
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // ✅ Load built React in production
  mainWindow.loadFile(path.join(__dirname, "build", "index.html"));

  // ✅ Emergency escape
  globalShortcut.register("CommandOrControl+Shift+F12", () => {
    mainWindow.setKiosk(false);
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") app.quit();
});