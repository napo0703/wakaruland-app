const {app, Menu} = require('electron');
const menubar = require('menubar')
const mb = menubar({
  width: 335, height: 450
})

mb.on('ready', function ready () {
  console.log('app is ready')
  const template = [{
      label: "わかるらんど",
      submenu: [
          { label: "About わかるらんど", selector: "orderFrontStandardAboutPanel:" },
          { type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
})