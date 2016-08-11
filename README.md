# stream2tv
Stream any local video file to any UPnP/DLNA MediaRenderer. Supports subtitles too.

## Prerequisites
```
$ npm install upnp-mediarenderer-client nodecast-js xmlbuilder keypress
```
## Configuration
Change the following settings.
```
var settings = { 
	localIP: "192.168.88.250",
	localPort: 8000,
	tvIP: "192.168.88.249"
};
```
## Usage
```
$ node stream2tv.js <a video file>
```
