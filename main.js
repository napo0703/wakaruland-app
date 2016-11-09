const menubar = require('menubar')
const mb = menubar({
  width: 335, height: 450
})

mb.on('ready', function ready () {
  console.log('app is ready')
  // your app code here
})