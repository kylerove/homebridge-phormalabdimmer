"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

module.exports = class PhormalabLamp {
    
    constructor(hap, log, dac, channel, name) {
        this.log = log;
        this.dac = dac;
        this.channel = channel;
        this.name = name;
    
        this.lampService = new hap.Service.Lightbulb(name);
        this.lampService.getCharacteristic(hap.Characteristic.On)
            .on("get", (callback) => {
                this.getBrightness(this.dac, this.channel, this.log, function(err, brightness) {
                    if (err) {
                        this.log('Error (getPowerState): '+err);
                        callback(err);
                        return;
                    }
                    if (brightness == 0) {
                        this.log('getPowerState: off (0%)');
                        callback(null, false);
                    } else {
                        this.log('getPowerState: on ('+brightness+'%)');
                        callback(null, true);
                    }
                }.bind(this));
            })
            .on("set", (value, callback) => {
                this.lampStates.On = value;
                log.info("Lamp state was set to: " + (this.lampStates.On? "on": "off"));
                
                if (this.lampStates.On) {
                    this.setBrightness(this.dac, this.channel, 100, this.log, function(err) {
                        if (err) {
                            log.info('Error (setPowerState): '+err);
                            callback(err);
                        } else {
                            log.info('setPowerState: on (100%)');
                            callback();
                        }
                    }.bind(this));
                } else if (!this.lampStates.On) {
                    this.setBrightness(this.dac, this.channel, 0, this.log, function(err) {
                        if (err) {
                            log.info('Error (setPowerState): '+err);
                            callback(err);
                        } else {
                            log.info('setPowerState: off (0%)');
                            callback();
                        }
                    }.bind(this));
                } else {
                    this.log('Error (setPowerState): unexpected no action taken');
                    callback();
                }
            });
        
            // this.addOptionalCharacteristic(Characteristic.Brightness);
        this.lampService.addCharacteristic(new hap.Characteristic.Brightness())
            .on("get", this.getBrightness.bind(this.lampService))
            .on("set", this.setBrightness.bind(this.lampService));
  
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "Phormalab")
            .setCharacteristic(hap.Characteristic.Model, "Hotdoor")
            .setCharacteristic(hap.Characteristic.SerialNumber, this.name + "-" + this.channel)
            .setCharacteristic(hap.Characteristic.FirmwareRevision, "MCP4728")   
         
        log.info("Phormalab lamp '%s' created!", name);
    }

    // optional, can be used to help identify the accessory
    identify() {
        this.log.info("Identify!");
    }      

    // called after accessory instantiation, returns all services that are associated with the accessory
    getServices() {
        return [
            this.informationService,
            this.lampService
        ];
    }

    getBrightness(dac, channel, log, callback) {
        if (dac.initialized) {
            dac.get().then((brightness) => {
                log.info(brightness);
                
                // TO DO: parse get to provide just brightness for this.channel
                
                log.info('Get brightness: ' + brightness + '%');
                setTimeout(setBrightness, 500);
            }).catch(log.error);
            callback(null, brightness);
        } else {
            // dac is offline, return null
            log.error('Unable to get brightness, MCP4827 is not accessible.');
            callback(null, null);
        }
    }
        
    setBrightness(dac, channel, value, log, callback) {
        this.lampStates.Brightness = value;
        if (dac.initialized) {
            dac.set(value, channel, true).then((r) => {
                log.debug(r);
                log.info('Set brightness: ' + value + '%');
                setTimeout(getBrightness, 500);
            }).catch(log.error);
        } else {
            // dac is offline, return null
            log.error('Unable to set brightness, MCP4827 is not accessible.');
        }
        
        // you must call the callback function
        callback(null);
    }
}