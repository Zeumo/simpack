#!/usr/bin/env ruby

require 'pathname'
require 'fileutils'

class Installer
  attr_accessor :root_path, :path, :archive, :xcode_version

  def initialize
    @root_path = root_path
    @path      = File.dirname __FILE__
    @archive   = "#{@path}/app.zip"

    remove_existing_apps!
    unpack_to_root_path
    done
  end

  def remove_existing_apps!
    existing_apps.each do |path|
      FileUtils.rm_rf Pathname.new(path).dirname
    end
  end

  def unpack_to_root_path
    `unzip -o "#{@archive}" -d "#{@root_path}"`
  end

  def done
    puts "{name} installed. You may close this window."
  end

  def existing_apps
    Dir.glob("#{@root_path}/**/Cura.app")
  end

  def root_path
    if xcode5?
      "#{ENV['HOME']}/Library/Application Support/iPhone Simulator/{simulatorVersion}/Applications"
    end

    if xcode6?
      "#{ENV['HOME']}/Library/Developer/CoreSimulator/{UDID}/Data/Applications"
    end
  end

  def xcode5?
    xcode_version[:major_version] == 5
  end

  def xcode6?
    xcode_version[:major_version] == 6
  end

  def xcode_version
    @xcode_version ||= begin
      info    = `xcodebuild -version`.split("\n")
      version = info[0].match(/Xcode (.*)/)[1]
      build   = info[1].match(/Build version (.*)/)[1]

       {
        version: version
        major_version: version.to_i
        build: build
      }
    end
  end
end

Installer.new
