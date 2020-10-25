[Install Homebridge]: https://github.com/nfarina/homebridge#installation
[Configuration]: #Configuration

# Homebridge-PhormalabDimmer

[Homebridge](https://homebridge.io) accessory plugin for [Phormalab infrared lamps](https://www.phormalab.it) that are connected to an I2C-capable device like a [Raspberry Pi](https://www.raspberrypi.org) connected to an [I2C board capable of 10 volt output](https://www.tindie.com/products/chathura/aptinex-i2c-dac-module-0-10v-mcp4725/#specs). This in turn, will provide input into a [proportional output solid state relay](http://www.crydom.com/en/products/control-relays/pcv-series/10pcv2415/).

[![NPM](https://nodei.co/npm/homebridge-phormalabdimmer.png?compact=true)](https://npmjs.org/package/homebridge-phormalabdimmer)

[![Phormalab Hotdoor Infrared Heating Lamp](images/hotdoor.png)](https://www.phormalab.it)

# Features
* Control the infrared heat output from a lamp via dimmer function
* Setup automations in [HomeKit](https://www.apple.com/ios/home/)
* Ask [Siri](https://support.apple.com/siri) to control your devices

# Setup / Installation
1. [Install Homebridge]
2. `npm install homebridge-phormalabdimmer`
3. Edit `config.json` and configure accessory. See [Configuration](#configuration) section.
4. Start Homebridge

# Configuration

To configure the plugin, add the following to the accessories section in `config.json` of Homebridge. The `i2c_address` must be in hexadecimal format, preceded by `0x`.

```json
    {
        "accessory": "PhormalabDimmer",
        "name": "Phormalab South",
        "i2c_device": "/dev/i2c-1",
        "i2c_address": "0x2c"
    }
```

# Help
If you have any questions or help please open an issue on the GitHub project page.

# Changelog

# 0.0.1
 * Initial version

# License
The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](LICENSE).
