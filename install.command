#!/usr/bin/env ruby

require 'pathname'
require 'fileutils'

class Installer
  attr_accessor :root_path, :path, :archive

  def initialize
    @root_path = "#{ENV['HOME']}/Library/Application Support/iPhone Simulator/{simulatorVersion}/Applications"
    @path       = File.dirname __FILE__
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
end

Installer.new
