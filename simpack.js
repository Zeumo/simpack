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
      simulatorVersion: '7.1'
    }, options);

    this.app = this._fetchAppData();
    this.app.simulatorVersion = this.options.simulatorVersion;

    this.cwd = pwd();
    this.version = _.compact([this.app.version, this.app.build]).join('-');
    this.appName = this.app.display_name.replace(' ', '-').toLowerCase();
    this.finalTarget = [this.appName, this.version].join('-') + '.zip';
  };

  Simpack.prototype = {

    pack: function() {
      this.compile();
      this.zip();
    },

    zip: function() {
      var uuid = this._uuid(),
          tmpDir = '/tmp/' + uuid;

      // Make a tmp dir to work in
      mkdir('-p', tmpDir);

      // Copy the app bits to tmp
      cp('-r', '/tmp/' + this.app.name + '/Applications/*', tmpDir);
      this._writeInstaller();
      cd('/tmp');

      // Zip up the tmp dir and put the package in the original cwd
      exec('zip -r app.zip "' + uuid + '"');

      // Zip up the app and the bash installer
      exec('zip -rj ' + this.finalTarget + ' install.command' + ' app.zip');

      // Cleanup
      mv(this.finalTarget, this.options.dest);
      rm('-rf', tmpDir, '/tmp/' + this.app.name);
    },

    compile: function() {
      var commands = [
        'xcodebuild' +
          ' -configuration Release' +
          ' -target ' + this.app.name +
          ' -scheme ' + this.app.name +
          ' -sdk iphonesimulator' +
          ' DSTROOT=/tmp/' + this.app.name + ' install'
      ];
      cd('platforms/ios');
      exec(commands);
    },

    _rootPath: function() {
      return '$HOME/Library/Application\\ Support/iPhone\\ Simulator/' + this.options.simulatorVersion + '/Applications/';
    },

    _fetchAppData: function() {
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
      var input = 'install.command';
      var content = fs.readFileSync([__dirname, input].join('/'), 'utf8');

      content = this._template(content, this.app);
      fs.writeFileSync(['/tmp', input].join('/'), content);
    },

    _template: function(s, d) {
      for (var p in d)
         s = s.replace(new RegExp('{'+p+'}','g'), d[p]);
       return s;
    }
  };

  module.exports = Simpack;

}).call(this);
