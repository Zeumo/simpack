# simpack

Package iOS simulator builds easily

## Usage

    var simpack = require('simpack')();
    simpack.pack()

    // Usage with options
    var simpack = require('simpack')({
      app: 'app.json'
      dest: '$HOME/Desktop'
    });

## Options

**app** *String* Default: `app.json`

Path to `app.json`.

**dist** *String* Default: `pwd`

Directory where zip archive will be saved.

## Example app.json

    {
      "name": "MyApp",
      "display_name": "Appy",
      "id": "com.myapp.appy",
      "version": "1.3.1",
      "build": "1"
    }
