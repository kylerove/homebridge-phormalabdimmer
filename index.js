var comms = require('ncd-red-comm');
var MCP4728 = require('ncd-red-mcp4728');
var myAccessories = [];

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform('PhormalabDimmer', PhormalabDimmer);
};

class PhormalabDimmer {
    
    contructor(log, config, api) {
        this.log = log;
        this.log.debug('PhormalabDimmer plugin loaded');
        this.config = config;
        this.api = api;
        this.name = config.name;
        this.i2c_address = parseInt(this.config.i2c_address, 16) || 0x60;
        this.i2c_device = this.config.i2c_device || '/dev/i2c-1';
        this.lampNames = this.config.lamp_names || ['Phormalab'];
        this.accessories = []
        
        // Enable config based DEBUG logging enable
        this.debug = config.debug || false;
        if (this.debug) {
            debug.enabled = true;
        }

        this.api.on('didFinishLaunching', () => {
            this.log("didFinishLaunching");

            this.log(`Expecting MCP4728 I²C DAC at address 0x${this.i2c_address.toString(16)} on bus ${this.i2c_device}`);
            this.comm = new comms.NcdI2C(1);
            this.dac = new MCP4728(this.i2c_address, this.comm, {
                eeprom_persist_1: true,
                eeprom_persist_2: true,
                eeprom_persist_3: true,
                eeprom_persist_4: true,
            });
        
            for (i = 1; i < (this.lampNames.length + 1); i++) {
                if (typeof this.lampNames[i] !== 'undefined') {
                    debug("Creating accessory for", this.lampNames[i]);
                    var newLamp = PhormalabAccessory(this, this.dac, i, this.lampNames[i]);
                    updateStatus(newLamp, i);
                }
            }
        });
    }

    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }

    function PhormalabAccessory(that, dac, channel, name) {
        this.log = that.log;
        this.name = name;
        this.log("Determining if Phormalab lamp "+this.name+" on channel "+channel+" exists in HB database");
        this.lampID = channel;
        this.refresh = that.refresh;
        this.cache = { 'brightness': 100,
                       'state': false };
        
        var uuid = UUIDGen.generate(this.name + " - Phormalab");
        
        if (!getAccessoryByLampID(this.lampID)) {
            this.log("Adding Phormalab lamp", this.name);
            this.accessory = new Accessory(this.name, uuid, 10);
            this.accessory.log = that.log;
            this.accessory.context.lampID = channel;
        
            this.accessory.getService(Service.AccessoryInformation)
                .setCharacteristic(Characteristic.Manufacturer, "Phormalab")
                .setCharacteristic(Characteristic.Model, "Hotdoor")
                .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name + "-" + this.lampID)
                .setCharacteristic(Characteristic.FirmwareRevision, "MCP4728");
            
            this.accessory.addService(Service.Lightbulb, this.name, this.lampID);
            
            this.accessory
                .getService(Service.Lightbulb)
                .getCharacteristic(Characteristic.On)
                .on('get', this.getPowerState.bind(this.accessory))
                .on('set', this.setPowerState.bind(this.accessory));
            
            // this.addOptionalCharacteristic(Characteristic.HeatingThresholdTemperature);
            this.accessory
                .getService(Service.Lightbulb)
                .addCharacteristic(new Characteristic.Brightness())
                .on('get', this.getBrightness.bind(this.accessory))
                .on('set', this.setBrightness.bind(this.accessory));
                
            this.accessory
                .getService(Service.Lightbulb).log = this.log;
                
            //this.accessory.context.ChangeLamp = new ChangeLamp(this.accessory);
            that.api.registerPlatformAccessories("homebridge-phormalabdimmer", "PhormalabDimmer", [this.accessory]);
            myAccessories.push(this.accessory);
            return this.accessory;
        } else {
            this.log("Existing Phormalab accessory", this.name);
            return getAccessoryByLampID(this.lampID);
        }
    }
    
    function getAccessoryByLampID(lampID) {
        var value;
        myAccessories.forEach(function(accessory) {
            // debug("getAccessoryByName zone", accessory.name, name);
            if (accessory.context.lampID === lampID) {
                value = accessory;
            }
        });
        
        return value;
    }

    function getPowerState(callback) {
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
    }
    
    function setPowerState(state, callback) {
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
    }
    
    function readBrightness(callback) {
        dac.get().then((r) => {
            console.log(r);
            console.log('Get brightness: ' + brightness);
            setTimeout(setBrightness, 5000);
        }).catch(console.log);
    }
    
    function setBrightness(brightness, callback) {
        this.cache.brightness = brightness;
        dac.set(brightness, this.lampID, true).then((r) => {
            console.log(r);
            console.log('Set brightness: ' + brightness);
            setTimeout(readBrightness, 500);
        }).catch(console.log);
    }
};