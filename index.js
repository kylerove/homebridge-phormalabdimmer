var Service, Characteristic;
var i2c = require('@abandonware/i2c');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-phormalabdimmer', 'phormalabdimmer', PhormalabDimmer);
};

function PhormalabDimmer(log, config) {

    this.log = log;

    this.name = config.name;
    this.i2c_address = parseInt(config.i2c_address);
    this.i2c_device = config.i2c_device || '/dev/i2c-1';

    this.cache = {
        'brightness': 100,
        'state': false
    };

    this.wire = new i2c(this.i2c_address, {
        device: this.i2c_device
    });

    this.services = {};
}

PhormalabDimmer.prototype = {

    /** Required Functions **/
    identify: function(callback) {
        this.log('Identify requested!');
        callback();
    },

    getServices: function() {
        this.services.informationService = new Service.AccessoryInformation();

        this.services.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Phormalab')
            .setCharacteristic(Characteristic.Model, 'Hotdoor')
            .setCharacteristic(Characteristic.SerialNumber, this.name);

        this.log('creating Phormalab');
        this.services.lightbulbService = new Service.Lightbulb(this.name);

        this.services.lightbulbService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        this.services.lightbulbService
            .addCharacteristic(new Characteristic.Brightness())
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        return [this.services.informationService, this.services.lightbulbService];
    },

    getPowerState: function(callback) {
        this.getBrightness(function(err, brightness) {
            if (err) {
                this.log('Error (getPowerState): '+err);
                callback(err);
                return;
            }

            if (brightness == 0) {
                this.log('getPowerState: 0');
                this.cache.state = false;
                callback(null, false);
            } else {
                this.log('getPowerState: '+brightness);
                this.cache.state = true;
                callback(null, true);
            }
        }.bind(this));
    },
    setPowerState: function(state, callback) {
        if (state && !this.cache.state) {
            this.setBrightness(100, function(err) {
                if (err) {
                    this.log('Error (setPowerState): '+err);
                    callback(err);
                } else {
                    this.log('setPowerState: '+100);
                    this.cache.state = true;
                    callback();
                }
            }.bind(this));
        } else if (!state && this.cache.state) {
            this.setBrightness(0, function(err) {
                if (err) {
                    this.log('Error (setPowerState): '+err);
                    callback(err);
                } else {
                    this.log('setPowerState: 0');
                    this.cache.state = false;
                    callback();
                }
            }.bind(this));
        } else {
            this.log('Error (setPowerState): unexpected no action taken');
            callback();
        }
    },
    readInteger: function(address, callback) {
        this.wire.readBytes(address, 2, function(error, res) {
            if (error) {
                this.log('Error (readInteger): '+error);
                callback(error);
            } else {
                let value = res[0];
                this.log('readInteger: '+parseInt((value << 8) || res[1]));
                callback(null, parseInt((value << 8) || res[1]));
            }
        }.bind(this));
    },
    writeInteger: function(address, value, callback) {
        bytes = [];
        bytes[0] = (value >> 8) & 0xFF;
        bytes[1] = value & 0xFF;

        this.wire.writeBytes(address, bytes, function(error) {
            if (error) {
                this.log('Error (writeInteger): '+error);
                callback(error);
                return;
            }
            
            this.log('writeInteger: '+bytes[0]+' '+bytes[1]);
            callback();
        });
    },
    readBrightness: function(callback) {
        this.readInteger(this.brightness, function(err, brightness) {
            if (err) {
                this.log('Error (readBrightness): '+err);
                callback(err);
                return;
            }
            this.log('readBrightness: '+this.brightness);
        }.bind(this));
    },
    setBrightness: function(brightness, callback) {
        this.cache.brightness = brightness;
        this.writeInteger(this.brightness, brightness, function(err) {
            if (err) {
                this.log('Error (setBrightness): '+err);
                callback(err);
            } else {
                this.log('setBrightness: '+brightness);
                this.getPowerState(function(err, val){
                    if (!err) {
                        this.services.lightbulbService
                            .getCharacteristic(Characteristic.On)
                            .updateValue(val);
                    }
                }.bind(this));
                callback();
            }
        }.bind(this));
    }

};
