var util = require('util');
var BoardIO = require('board-io');
var CONSTANTS = require('board-io/lib/constants');
var PololuMaestro = require('pololu-maestro');
var winston = require('winston');

var LOG = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function () {
        return (new Date()).toLocaleTimeString()
      },
      colorize: true,
    })
  ]
});

var map = function(value, in_min, in_max, out_min, out_max) {
  return out_min +
    (value - in_min) * (out_max - out_min) / (in_max - in_min);
};

function MaestroIOBoard (opts, callback) {
  BoardIO.call(this);

  if (typeof opts === 'function' || !opts) {
    callback = opts;
    opts = {
      npins: 18,
      mode: PololuMaestro.SERIAL_MODES.USB_DUAL_PORT,
      path: undefined,
      baudrate: 115200,
    };
  }

  for(var i = 0; i < opts.npins; i++) {
    var supportedModes = [CONSTANTS.MODES.OUTPUT, CONSTANTS.MODES.SERVO];

    if(i === 8 && opts.npins === 12) {
      // Mini Maestro 12 supports PWM on pin 8
      supportedModes.push(CONSTANTS.MODES.PWM);
    } else if((opts.npins === 18 || opts.npins === 24) && i === 12) {
      // Mini Maestro 18 & 24 supports PWM on pin 12
      supportedModes.push(CONSTANTS.MODES.PWM);
    }

    if(i < 12) {
      // some pins support being analog inputs..
      supportedModes.push(CONSTANTS.MODES.ANALOG);
    } else {
      // the rest are digital inputs
      supportedModes.push(CONSTANTS.MODES.INPUT);
    }

    this.pins.push({
      mode: CONSTANTS.MODES.OUTPUT,
      supportedModes: supportedModes,
      value : 0,
      report: 1,
      analogChannel: (i<12) ? i : 127,
    });
  }

  if (opts.path) {

    this.maestro = new PololuMaestro(opts.path, opts.baudrate);

    this.maestro.on('ready', function () {
      this.emit("connect");
      this.emit("ready");
      callback && callback();
    }.bind(this));

  } else {
    PololuMaestro.find(opts.mode, function (err, maestro) {
      if (err) throw new Error(err);
      this.maestro = maestro;

      this.emit("connect");
      this.emit("ready");
      callback && callback();

    }.bind(this));
  }
}

util.inherits(MaestroIOBoard, BoardIO);

/**
 * Asks the board to read analog data.
 * @param {number} pin The pin to read analog data
 * @param {function} callback A function to call when we have the analag data.
 */
MaestroIOBoard.prototype.analogRead = function( pin, callback ) {
	LOG.debug("MaestroIOBoard", "asked to do analogRead of pin " + pin);

	this.maestro.analogRead( pin, callback );
};

/**
 * Asks the board to write an analog message.
 * @param {number} pin The pin to write analog data to.
 * @param {nubmer} value The data to write to the pin between 0 and 255.
 */
MaestroIOBoard.prototype.analogWrite = function( pin, value ) {
	LOG.debug("MaestroIOBoard", "asked to do analogWrite for pin " + pin + " to value " + value);

	if(!this.pins[pin] || !this.pins[pin].supportedModes || this.pins[pin].supportedModes.indexOf(IOBoard.CONSTANTS.MODES.PWM) == -1) {
		throw "Analog write attempted to non-PWM port";
	}

	var pwm = map(value, 0, 255, 0, 1024);

	this.maestro.setPWM(pwm, 16320);
};

/**
 * Asks the board to move a servo
 * @param {number} pin The pin the servo is connected to
 * @param {number} value The degrees to move the servo to.
 */
MaestroIOBoard.prototype.servoWrite = function( pin, degrees ) {
	LOG.debug("MaestroIOBoard", "asked to do servoWrite for pin " + pin + " to degrees " + degrees);

	var value = map(degrees, 0, 180, 640, 2304);

	this.maestro.setTarget(pin, value);
};

/**
 * Asks the board to write a value to a digital pin
 * @param {number} pin The pin you want to write a value to.
 * @param {value} value The value you want to write. Must be board.HIGH or board.LOW
 */
MaestroIOBoard.prototype.digitalWrite = function( pin, value ) {
	LOG.debug("MaestroIOBoard", "asked to do digitalWrite for pin " + pin + " to value " + value);

	this.maestro.digitalWrite(pin, value ? true : false);
};

/**
 * Asks the board to read digital data
 * @param {number} pin The pin to read data from
 * @param {function} callback The function to call when data has been received
 */
MaestroIOBoard.prototype.digitalRead = function( pin, callback ) {
	LOG.debug("MaestroIOBoard", "asked to do digitalRead of pin " + pin);

	this.maestro.digitalRead( pin, callback );
};

module.exports = MaestroIOBoard;
