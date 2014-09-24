# simpack

Package iOS simulator builds easily

## Usage

**/!\\** As of 0.3.0 `simpack` returns a Promise.

    var simpack = require('simpack')();
    simpack.done(function() {
      this.pack();
    });

    // Usage with options
    var simpack = require('simpack')({
      app: 'app.json'
      dest: '$HOME/Desktop'
    });

## Options

**app**

Default: `'app.json'`

Path to `app.json`.

**dist**

Default: `pwd`

Directory where zip archive will be saved.

**simulatorVersion**

Default: `'7.1'`

Matches Simulator SDK.

**device**

Default: `'iPhone 5'`

For Xcode 6. Must be the same as previously used in Xcode.

## Example app.json

    {
      "name": "MyApp",
      "display_name": "Appy",
      "id": "com.myapp.appy",
      "version": "1.3.1",
      "build": "1"
    }
