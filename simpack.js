var _     = require('lodash'),
  Promise = require("bluebird"),
  fs      = Promise.promisifyAll(require('fs')),
  glob    = Promise.promisifyAll(require('glob')),
  xml2js  = Promise.promisifyAll(require('xml2js'));

require('shelljs/global');

(function() {
  var Simpack;

  Simpack = function(options) {
    if (!(this instanceof Simpack)) {
      return new Simpack(options);
    }

    this.options = _.extend({
      app: 'app.json',
      dest: pwd(),
      simulatorVersion: '7.1',
      device: 'iPhone 5'
    }, options);

    this.app = this._appData();

    this.cwd     = pwd();
    this.version = _.compact([this.app.version, this.app.build]).join('-');
    this.appName = this.app.display_name.replace(/\s/g, '-').toLowerCase();
    this.target  = [this.appName, this.version].join('-') + '.zip';
    this.xcodeVersion = this._xcodeVersion();

    return this._device()
      .then(function(device) {
        this.device   = device;
        this.app.UUID = this._appUUID();

        if (!this.app.UUID) {
          throw "Could not find app UUID. Try building the app with XCode first.";
        }
      });
  };

  Simpack.prototype = {

    pack: function() {
      this.clean();
      var compile = this.compile();

      if (compile.code === 0) {
        this.zip();
      }
    },

    zip: function() {
      var tmpDir = '/tmp/' + this.app.UUID;

      // Make a tmp dir to work in
      mkdir('-p', tmpDir);

      // Copy the app bits to tmp
      this._writeInstaller();
      cp('-r', '/tmp/' + this.app.name + '/Applications/*', tmpDir);
      cd('/tmp');

      // Zip up the tmp dir and put the package in the original cwd
      exec('zip -r app.zip "' + this.app.UUID + '"');

      // Zip up the app and the bash installer
      exec('zip -rj ' + this.target + ' install.command' + ' app.zip');

      // Cleanup
      mv(this.target, this.options.dest);
      rm('-rf', tmpDir, '/tmp/' + this.app.name);
      rm('-rf', 'app.zip', 'install.command');
      cd(this.cwd);
    },

    clean: function() {
      rm('-rf', env.HOME + '/Library/Developer/Xcode/DerivedData');
    },

    compile: function() {
      var command = '' +
        'xcodebuild' +
          ' -configuration Debug' +
          ' -target ' + this.app.name +
          ' -scheme ' + this.app.name +
          ' -arch i386' +
          ' -sdk iphonesimulator' + this.options.simulatorVersion +
          ' DSTROOT=/tmp/' + this.app.name + ' clean install';

      cd('platforms/ios');
      return exec(command);
    },

    _rootPath: function() {
      if (this._isXcode5()) {
        return '$HOME/Library/Application\\ Support/iPhone\\ Simulator/' +
          this.options.simulatorVersion +
          '/Applications';
      }

      if (this._isXcode6()) {
        return '$HOME/Library/Developer/CoreSimulator/Devices/' +
          this.device.UDID +
          '/Data/Applications';
      }
    },

    _appData: function() {
      return JSON.parse(fs.readFileSync(this.options.app, 'utf8'));
    },

    _xcodeVersion: function() {
      var cmd  = exec('xcodebuild -version', {
            silent: true
          }),
          info    = cmd.output.split('\n'),
          version = info[0].match(/Xcode (.*)/)[1];
          build   = info[1].match(/Build version (.*)/)[1];

      return {
        version: version,
        majorVersion: parseInt(version, 10),
        build: build
      };
    },

    _isXcode5: function() {
      return this.xcodeVersion.majorVersion === 5;
    },

    _isXcode6: function() {
      return this.xcodeVersion.majorVersion === 6;
    },

    _appUUID: function() {
      var path = exec('find ' + this._rootPath() + ' -iname "' + this.app.name + '.app"', {
        silent: true
      });

      var regex = /Applications\/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/;
      var match = path.output.match(regex);

      if (match) {
        return match[1];
      }
    },

    _device: function(device) {
      device          = device || this.options.device;
      var self        = this;
      var devicesPath = env.HOME + "/Library/Developer/CoreSimulator/Devices/*";
      var parser      = new xml2js.Parser();

      return new Promise(function(resolve, reject) {
        if (self._isXcode5()) return resolve();

        glob(devicesPath, function(err, dirs) {
          _.each(dirs, function(dir) {
            fs.readFile(dir + '/device.plist', function(err, file) {
              parser.parseString(file, function (err, result) {
                var dict = result.plist.dict,
                    obj  = _.object(dict[0].key, dict[0].string),
                    runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-' +
                      self.options.simulatorVersion.replace('.', '-');

                if (obj.name === device && obj.runtime === runtime) {
                  return resolve(obj);
                }
              });
            });
          });
        });
      }).bind(this);
    },

    _writeInstaller: function() {
      var input     = 'install.command';
      var content   = fs.readFileSync([__dirname, input].join('/'), 'utf8');
      var installer = ['/tmp', input].join('/');

      content = this._template(content, _.merge({},
        this.options, this.device, this.app));

      fs.writeFileSync(installer, content);
      fs.chmodSync(installer, '755');
    },

    _template: function(s, d) {
      for (var p in d)
         s = s.replace(new RegExp('{'+p+'}','g'), d[p]);
       return s;
    }
  };

  module.exports = Simpack;

}).call(this);
