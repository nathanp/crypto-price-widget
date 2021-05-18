const electron = require("electron");
// app control, application life.BrowserWindow creates native browser window.
const { app, dialog, BrowserWindow, Menu, Tray } = require("electron");

//Store Window size and position
const windowStateKeeper = require("electron-window-state");

const path = require("path");
const url = require("url");

const settings = require("electron-settings");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

function createWindow() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 320,
    defaultHeight: 240,
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: app.getName(),
    alwaysOnTop: false,
    //show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    maxWidth: 960,
    minWidth: 290,
    minHeight: 100,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    titleBarStyle: "customButtonsOnHover",
    autoHideMenuBar: true,
    transparent: true,
    icon: path.join(__dirname, "images/icon.png"),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  // Build and set context menu
  const appIcon = new Tray(path.join(__dirname, "images/icon.png"))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show on Taskbar',
      click: function () {
        mainWindow.setSkipTaskbar(false);
      }
    },
    {
      label: 'Quit',
      role: 'quit'
    }
  ])

  appIcon.setContextMenu(contextMenu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('show', function () {
    appIcon.setToolTip('always');
  });

  mainWindow.on('close', function(event) {
    const choice = dialog.showMessageBoxSync(mainWindow,
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Would you like to exit to system tray?'
        });
    if (choice === 0) {
      event.preventDefault();
      mainWindow.setSkipTaskbar(true);
    }
  });

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
