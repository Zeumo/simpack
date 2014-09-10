var _ = require('lodash'),
  fs = require('fs');

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
      sdk: 'iphonesimulator7.1'
    }, options);

    this.app = this._appData();
    this.app.simulatorVersion = this.options.simulatorVersion;

    this.cwd     = pwd();
    this.version = _.compact([this.app.version, this.app.build]).join('-');
    this.appName = this.app.display_name.replace(' ', '-').toLowerCase();
    this.target  = [this.appName, this.version].join('-') + '.zip';
    this.uuid = this._uuid();

    if (!this.uuid) {
      throw "Could not find UUID. Try building the app with XCode first.";
    }
  };

  Simpack.prototype = {

    pack: function() {
      var compile = this.compile();

      if (compile.code === 0) {
        this.zip();
      }
    },

    zip: function() {
      var tmpDir = '/tmp/' + this.uuid;

      // Make a tmp dir to work in
      mkdir('-p', tmpDir);

      // Copy the app bits to tmp
      cp('-r', '/tmp/' + this.app.name + '/Applications/*', tmpDir);
      this._writeInstaller();
      cd('/tmp');

      // Zip up the tmp dir and put the package in the original cwd
      exec('zip -r app.zip "' + this.uuid + '"');

      // Zip up the app and the bash installer
      exec('zip -rj ' + this.target + ' install.command' + ' app.zip');

      // Cleanup
      mv(this.target, this.options.dest);
      rm('-rf', tmpDir, '/tmp/' + this.app.name);
      cd(this.cwd);
    },

    compile: function() {
      var command = '' +
        'xcodebuild' +
          ' -configuration Debug' +
          ' -target ' + this.app.name +
          ' -scheme ' + this.app.name +
          ' -arch i386' +
          ' -sdk ' + this.options.sdk +
          ' DSTROOT=/tmp/' + this.app.name + ' clean install';

      cd('platforms/ios');
      return exec(command);
    },

    _rootPath: function() {
      return '$HOME/Library/Application\\ Support/iPhone\\ Simulator/' + this.options.simulatorVersion + '/Applications/';
    },

    _appData: function() {
      return JSON.parse(fs.readFileSync(this.options.app, 'utf8'));
    },

    _uuid: function() {
      var path = exec('find ' + this._rootPath() + ' -iname "' + this.app.name + '.app"', {
        silent: true
      });
      var match = path.output.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/);

      if (match) {
        return match[0];
      }
    },

    _writeInstaller: function() {
      var input     = 'install.command';
      var content   = fs.readFileSync([__dirname, input].join('/'), 'utf8');
      var installer = ['/tmp', input].join('/');

      content = this._template(content, this.app);
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
