# node-maestro-board-io
This is the [johnny-five](http://johnny-five.io/) IO plugin for 
[Pololu Maestro](https://www.pololu.com/product/1354) servo controllers.

Basically just [node-maestro-ioboard](https://github.com/achingbrain/node-maestro-ioboard)
fixed to work with recent [board-io](https://github.com/achingbrain/board-io).

# Usage
Instantiate this plugin as follows: `new MaestroIO(opts, callback)`, where both arguments
are optional.
## Options
* `npins` (default: 18) Number of pins on the connected board (6, 12, 18, 24).
* `mode` (default: require('pololu-maestro').SERIAL_MODES.USB_DUAL_PORT) Connection mode (USB_DUAL_MODE or USB_CHAINED). Only first one is tested.
* `path` (default: undefined -- autodetect) Path to serial device.
* `baudrate` (115200)

## Example
```js
var five = require('johnny-five')
var io = require('node-maestro-board-io')

var board = new five.Board({
  io: new io()
})

board.on('ready', function () {
  var servos = new five.Servos([1,2])
  servos.sweep()
})
```
