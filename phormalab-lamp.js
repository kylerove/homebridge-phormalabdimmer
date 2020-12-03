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
                if (this.dac.initialized) {
                    this.dac.get().then((brightness) => {
                        this.log.debug(brightness);
                        
                        // TO DO: parse get to provide just brightness for this.channel
                        
                        if (brightness == 0) {
                            this.log.info('getPowerState: off (0%)');
                            callback(null, false);
                        } else {
                            this.log.info('getPowerState: on ('+brightness+'%)');
                            callback(null, true);
                        }
                    }).catch(this.log.error);
                } else {
                    // dac is offline, return null
                    this.log.error('Unable to get brightness, MCP4827 is not accessible.');
                    callback(null, null);
                }
                

            })
            .on("set", (value, callback) => {
                this.lampStates.On = value;
                log.info("Lamp state was set to: " + (this.lampStates.On? "on": "off"));
                
                if (this.lampStates.On) {
                    this.lampStates.Brightness = 100;
                    if (this.dac.initialized) {
                        this.dac.set(100, this.channel, true).then((r) => {
                            this.log.debug(r);
                            this.log.info('Set brightness: 100%');
                            callback(null);
                        }).catch(this.log.error);
                    } else {
                        // dac is offline, return null
                        this.log.error('Unable to set brightness, MCP4827 is not accessible.');
                        callback('Unable to set brightness, MCP4827 is not accessible.');
                    }
                } else if (!this.lampStates.On) {
                    if (this.dac.initialized) {
                        this.dac.set(0, this.channel, true).then((r) => {
                            this.log.debug(r);
                            this.log.info('Set brightness: 0%');
                            callback(null);
                        }).catch(this.log.error);
                    } else {
                        // dac is offline, return null
                        this.log.error('Unable to set brightness, MCP4827 is not accessible.');
                        callback('Unable to set brightness, MCP4827 is not accessible.');
                    }
                } else {
                    this.log('Error (setPowerState): unexpected no action taken');
                    callback('Error (setPowerState): unexpected no action taken');
                }
            });
        
            // this.addOptionalCharacteristic(Characteristic.Brightness);
        this.lampService.addCharacteristic(new hap.Characteristic.Brightness())
            //.on("get", this.getBrightness.bind(this.lampService))
            //.on("set", this.setBrightness.bind(this.lampService));
            .on("get", (callback) => {
                if (this.dac.initialized) {
                    this.dac.get().then((brightness) => {
                        this.log.debug(brightness);
                        
                        // TO DO: parse get to provide just brightness for this.channel
                        
                        this.log.info('Get brightness: ' + brightness + '%');
                        callback(null, brightness);
                    }).catch(this.log.error);
                } else {
                    // dac is offline, return null
                    this.log.error('Unable to get brightness, MCP4827 is not accessible.');
                    callback(null, null);
                }
            })
            .on("set", (value, callback) => {
                this.lampStates.Brightness = value;
                if (this.dac.initialized) {
                    this.dac.set(value, this.channel, true).then((r) => {
                        this.log.debug(r);
                        this.log.info('Set brightness: ' + value + '%');
                    }).catch(this.log.error);
                } else {
                    // dac is offline, return null
                    this.log.error('Unable to set brightness, MCP4827 is not accessible.');
                }
                
                // you must call the callback function
                callback(null);
            });
  
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

    /*getBrightness(dac, channel, log, callback) {
        if (dac.initialized) {
            dac.get().then((brightness) => {
                log.info(brightness);
                
                // TO DO: parse get to provide just brightness for this.channel
                
                log.info('Get brightness: ' + brightness + '%');
                setTimeout(setBrightness, 500);
                callback(null, brightness);
            }).catch(log.error);
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
    }*/
}