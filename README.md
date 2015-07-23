# Repro app for litehelpers/cordova-sqlite-storage#299

This is a small Cordova app which exhibits the problem reported as [litehelpers/cordova-sqlite-storage#299][299].

The problem is at the intersection of cordova-sqlite-storage and PouchDB; it's
not clear where it lies exactly except that it does not happen with PouchDB and
native WebSQL.

[299]: https://github.com/litehelpers/cordova-sqlite-storage/issues/299

## Run

* Clone this project
* `cordova prepare`
* `open platforms/ios/SqliteCordovaIssue299.xcodeproj`
* Run on a device or in the simulator
* Tap "start" in the app
* Observe memory use in Xcode

## What is it doing?

* It bulk loads 8000 records into a PouchDB database backed by the PouchDB
  websql adapter and cordova-sqlite-storage.
* It defines 8 map-reduce indexes with various levels of complexity in the
  same database.
* It triggers building each of the indexes in turn.

## Observations

You will see a spike in memory use when the 8th index starts building.
Curiously, it appears to be dependent on both the number of indexes before it
and the content of the index itself. Remove the other indexes and there's no
spike. Move the 8th index earlier in the process and there is no spike (or at
least a less visible one).

## Running with more or less data

In order to be runnable either with or without the plugin, this app uses 8k
records by default. You can add more like so:

* Edit `data/generate_data.rb`.
* Change the constant `LIMIT=8_000` to another number. There is raw data
  included for up to 30000 records.
* Run `data/generate_data.rb`. (It should work fine with the OS X system ruby.)
* Run `cordova prepare`
* Run via Xcode as above.

The spikes are more visible with more data, though I have not yet seen the OS
kill this app for excess memory use in the way I have seen with my real app.

## Running with native WebSQL

* `cordova plugin remote cordova-sqlite-storage`
* `cordova prepare`
* With via Xcode as above

With native WebSQL, there is less overall memory use and the use curve appears
less spiky.
