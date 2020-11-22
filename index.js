// require these libraries
var comms = require('ncd-red-comm');
var MCP4728 = require('ncd-red-mcp4728');

// instantiate static platform plugin
//import {AccessoryPlugin, API, HAP, Logging, PlatformConfig, StaticPlatformPlugin} from "homebridge";
//import {AddPhormalabLamp} from "phormalab-lamp.js";
const AddPhormalabLamp = require('./phormalab-lamp.js')
const PLATFORM_NAME = "PhormalabDimmer";
let hap;

// register the platform plugin
export = (api) => {
    hap = api.hap;
    api.registerPlatform(PLATFORM_NAME, PhormalabDimmerPlatform);
};

// implement the platform plugin class
class PhormalabDimmerPlatform implements StaticPlatformPlugin {

    private readonly log;

    constructor(log: Logging, config: PlatformConfig, api: API) {
        this.log = log;
        log.info('PhormalabDimmer plugin initializing...');
        this.config = config;
        this.api = api;
        this.name = config.name;
        this.i2c_address = parseInt(this.config.i2c_address, 16) || 0x60;
        this.i2c_device = this.config.i2c_device || '/dev/i2c-1';
        this.lampNames = this.config.lamp_names || ['Phormalab'];

        // check if required config elements exist
        if (this.lampNames.length == 0) {
            log.error("Phormalab Dimmer configuration requires `lamp_names` to specify an array of at least one lamp name connected to the first MCP4728 DAC output.")
        } else if (this.lampNames.length > 4) {
            log.error("Phormalab Dimmer configuration only supports up to four `lamp_names` connected to the four MCP4728 DAC outputs.")
        }

        this.log(`Expecting MCP4728 I²C DAC at address 0x${this.i2c_address.toString(16)} on bus ${this.i2c_device}`);
        this.comm = new comms.NcdI2C(1);
        this.dac = new MCP4728(this.i2c_address, this.comm, {
            eeprom_persist_1: true,
            eeprom_persist_2: true,
            eeprom_persist_3: true,
            eeprom_persist_4: true,
        });

        log.info('PhormalabDimmer plugin finished initializing');
    }

    /*
     * This method is called to retrieve all accessories exposed by the platform.
     */
    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        callback([
            new PhormalabLamp(hap, this.log, this.dac, 1, this.lampNames[1]),
            new PhormalabLamp(hap, this.log, this.dac, 2, this.lampNames[2]),
            new PhormalabLamp(hap, this.log, this.dac, 3, this.lampNames[3]),
            new PhormalabLamp(hap, this.log, this.dac, 4, this.lampNames[4])
        ]);
    }
}
