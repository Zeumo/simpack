#!/usr/bin/env ruby

require 'pathname'
require 'fileutils'
require 'tmpdir'

class Installer
  attr_accessor :path, :xcode_version, :tmp

  def initialize
    @path = File.dirname __FILE__
    @tmp  = Dir.mktmpdir

    remove_existing_apps!
    extract_archive
    copy_to_devices
    done
  end

  def remove_existing_apps!
    existing_apps.each do |path|
      FileUtils.rm_rf Pathname.new(path).dirname
    end
  end

  def extract_archive
    `unzip -o "#{@path}/app.zip" -d #{@tmp}`
  end

  def copy_to_devices
    devices.each do |dir|
      FileUtils.cp_r Dir.glob("#{@tmp}/*"), application_path(dir)
    end
  end

  def done
    FileUtils.remove_entry @tmp
  end

  def existing_apps
    Dir.glob("#{devices_path}/**/Cura.app")
  end

  def application_path(device_path)
    path =  if xcode5?
              '/Applications'
            elsif xcode6?
              '/Data/Applications'
            end

    device_path << path
  end

  def devices_path
    if xcode5?
      "#{Dir.home}/Library/Application\\ Support/iPhone\\ Simulator"
    elsif xcode6?
      "#{Dir.home}/Library/Developer/CoreSimulator/Devices"
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
        version: version,
        major_version: version.to_i,
        build: build
      }
    end
  end

  def devices
    Dir.glob("#{devices_path}/*")
  end
end

Installer.new
