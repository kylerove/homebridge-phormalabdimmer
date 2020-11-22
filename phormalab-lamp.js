import {
  AccessoryPlugin,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
  CharacteristicEventTypes
} from "homebridge";

export class PhormalabLamp implements AccessoryPlugin {

    private lampStates = {
                            On: false,
                            Brightness:0
                         };
  
    // This property must exist
    name: string;
  
    private readonly lampService: Service;
    private readonly informationService: Service;
  
    constructor(hap, log, dac, channel, name) {
        this.log = log;
        this.dac = dac;
        this.channel = channel;
        this.name = name;
    
        this.lampService = new hap.Service.Lightbulb(name);
        this.lampService.getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                this.getBrightness(function(err, brightness) {
                    if (err) {
                        this.log('Error (getPowerState): '+err);
                        callback(err);
                        return;
                    }
                    if (brightness == 0) {
                        this.log('getPowerState: off');
                        callback(null, false);
                    } else {
                        this.log('getPowerState: on ('+brightness+'%)');
                        callback(null, true);
                    }
                }.bind(this));
            })
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                this.lampStates.On = value as boolean;
                log.info("Lamp state was set to: " + (this.lampStates.On? "on": "off"));
                
                if (this.lampStates.On) {
                    this.setBrightness(100, function(err) {
                        if (err) {
                            log.info('Error (setPowerState): '+err);
                            callback(err);
                        } else {
                            log.info('setPowerState: on');
                            callback();
                        }
                    }.bind(this));
                } else if (!this.lampStates.On) {
                    this.setBrightness(0, function(err) {
                        if (err) {
                            log.info('Error (setPowerState): '+err);
                            callback(err);
                        } else {
                            log.info('setPowerState: off');
                            callback();
                        }
                    }.bind(this));
                } else {
                    this.log('Error (setPowerState): unexpected no action taken');
                    callback();
                }
            });
        
            // this.addOptionalCharacteristic(Characteristic.Brightness);
        this.lampService.addCharacteristic(new Characteristic.Brightness())
            .on(CharacteristicEventTypes.GET, this.getBrightness.bind(this.lampService))
            .on(CharacteristicEventTypes.SET, this.setBrightness.bind(this.lampService));
  
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "Phormalab")
            .setCharacteristic(hap.Characteristic.Model, "Hotdoor")
            .setCharacteristic(hap.Characteristic.SerialNumber, hostname + "-" + this.name + "-" + this.channel)
            .setCharacteristic(hap.Characteristic.FirmwareRevision, "MCP4728")   
         
        log.info("Phormalab lamp '%s' created!", name);
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log("Identify!");
    }      

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices(): Service[] {
        return [
            this.informationService,
            this.lampService
        ];
    }

    readBrightness(callback: CharacteristicGetCallback) {
        dac.get().then((r) => {
            log.info(r);
            log.info('Get brightness: ' + brightness);
            setTimeout(setBrightness, 500);
        }).catch(console.log);

        // you must call the callback function
        // the first argument should be null if there were no errors
        // the second argument should be the value to return
        callback(null, brightness);
    }
        
    setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.lampStates.Brightness = value as number;
        dac.set(value, this.lampID, true).then((r) => {
            log.info(r);
            log.info('Set brightness: ' + brightness);
            setTimeout(readBrightness, 500);
        }).catch(console.log);
        
        // you must call the callback function
        callback(null);
    }
}