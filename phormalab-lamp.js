"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhormalabLamp = PhormalabLamp;
class PhormalabLamp {
    
    constructor(hap, log, dac, channel, name) {
        this.log = log;
        this.dac = dac;
        this.channel = channel;
        this.name = name;
    
        this.lampService = new hap.Service.Lightbulb(name);
        this.lampService.getCharacteristic(hap.Characteristic.On)
            .on("get", (callback) => {
                this.getBrightness(function(err, brightness) {
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
                    this.setBrightness(100, function(err) {
                        if (err) {
                            log.info('Error (setPowerState): '+err);
                            callback(err);
                        } else {
                            log.info('setPowerState: on (100%)');
                            callback();
                        }
                    }.bind(this));
                } else if (!this.lampStates.On) {
                    this.setBrightness(0, function(err) {
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
            .setCharacteristic(hap.Characteristic.SerialNumber, hostname + "-" + this.name + "-" + this.channel)
            .setCharacteristic(hap.Characteristic.FirmwareRevision, "MCP4728")   
         
        log.info("Phormalab lamp '%s' created!", name);
    }

    // optional, can be used to help identify the accessory
    identify() {
        this.log("Identify!");
    }      

    // called after accessory instantiation, returns all services that are associated with the accessory
    getServices() {
        return 
            this.informationService,
            this.lampService
        ];
    }

    readBrightness(callback) {
        dac.get().then((r) => {
            log.info(r);
            log.info('Get brightness: ' + brightness + '%');
            setTimeout(setBrightness, 500);
        }).catch(console.log);

        // you must call the callback function
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, brightness);
    }
        
    setBrightness(value, callback) {
        this.lampStates.Brightness = value;
        dac.set(value, this.lampID, true).then((r) => {
            log.info(r);
            log.info('Set brightness: ' + brightness + '%');
            setTimeout(readBrightness, 500);
        }).catch(console.log);
        
        // you must call the callback function
        callback(null);
    }
}