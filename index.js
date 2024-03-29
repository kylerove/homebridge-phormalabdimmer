"use strict";

// require these libraries
var comms = require('ncd-red-comm');
var MCP4728 = require('ncd-red-mcp4728');
const PhormalabLamp = require('./phormalab-lamp')

// platform plugin naming
const PLATFORM_NAME = "PhormalabDimmer";
const PLUGIN_NAME = "homebridge-phormalabdimmer";
let hap;

// implement the platform plugin class
class PhormalabDimmerPlatform  {

    constructor(log, config, api) {
        this.log = log;
        log.info('PhormalabDimmer plugin initializing...');
        this.config = config;
        this.api = api;
        this.name = config.name;
        this.i2c_address = this.config.i2c_address || 0x60;
        this.i2c_device = this.config.i2c_device || '/dev/i2c-1';
        this.lampNames = this.config.lamp_names || ['Phormalab'];

        // check if required config elements exist
        if (this.lampNames.length == 0) {
            log.error("Phormalab Dimmer configuration requires `lamp_names` to specify an array of at least one lamp name connected to the first MCP4728 DAC output.")
        } else if (this.lampNames.length > 4) {
            log.error("Phormalab Dimmer configuration only supports up to four `lamp_names` connected to the four MCP4728 DAC outputs.")
        }

        // initialize communications stack and dac object to communicate with mcp4728
        log.info(`Expecting MCP4728 I²C DAC at address 0x${this.i2c_address.toString(16)} on bus ${this.i2c_device}`);
        this.comm = new comms.NcdI2C(1);
        this.dac = new MCP4728(this.i2c_address, this.comm, {
            vr_1: 0,
            eeprom_persist_1: true,
			eeprom_vr_1: 0,
			eeprom_dac_1: 0,
            
            vr_2: 0,
            eeprom_persist_2: true,
			eeprom_vr_2: 0,
			eeprom_dac_2: 0,
            
            vr_3: 0,
            eeprom_persist_3: true,
			eeprom_vr_3: 0,
			eeprom_dac_3: 0,
            
            vr_4: 0,
            eeprom_persist_4: true,
			eeprom_vr_4: 0,
			eeprom_dac_4: 0,
        });
        
        // this initializes the dac
    	this.dac.get().then((r) => {
            // check if dac initialized
            if (!this.dac.initialized) {
                // tell user we could not initialize the dac
                log.debug(this.dac);
                log.error('MCP4728 was not reachable on the I²C bus. Check to make sure it is connected.');
            }
            else {
                // tell user we have initialized the dac
                log.debug(this.dac);
                log.info('Connected to MCP4728 via the I²C bus!');
            }
            
            // tell user whether we are done loading the plugin
            log.info('PhormalabDimmer plugin finished initializing');
    	});
    }

    // retrieve all accessories exposed by the platform
    accessories(callback) {
        if (this.lampNames.length == 1) {
            callback([
                new PhormalabLamp(this.api.hap, this.log, this.dac, 1, this.lampNames[0])
            ]);
        }
        else if (this.lampNames.length == 2) {
            callback([
                new PhormalabLamp(this.api.hap, this.log, this.dac, 1, this.lampNames[0]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 2, this.lampNames[1])
            ]);
        }
        else if (this.lampNames.length == 3) {
            callback([
                new PhormalabLamp(this.api.hap, this.log, this.dac, 1, this.lampNames[0]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 2, this.lampNames[1]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 3, this.lampNames[2])
            ]);
        }
        else if (this.lampNames.length == 4) {
            callback([
                new PhormalabLamp(this.api.hap, this.log, this.dac, 1, this.lampNames[0]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 2, this.lampNames[1]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 3, this.lampNames[2]),
                new PhormalabLamp(this.api.hap, this.log, this.dac, 4, this.lampNames[3])
            ]);
        }
    }
}

// initialize and register the platform
module.exports = function(api) {
    // save hap
    hap = api.hap;

    // register platform
    api.registerPlatform(PLATFORM_NAME, PhormalabDimmerPlatform);
};