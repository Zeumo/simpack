#!/bin/bash

root_path="$HOME/Library/Application Support/iPhone Simulator/7.1/Applications/"
path="`dirname \"$0\"`"
archive="$path/app.zip"

# Find and remove existing app
existing_app=find "$root_path" -iname "{name}.app"
if [[ $existing_app != "" ]]; then
  rm -rf ../$existing_app
fi

# Unpack new app to Simulator location
unzip -o "$archive" -d "$root_path"
