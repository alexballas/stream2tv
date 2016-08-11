# stream2tv
Stream any local video file to any UPnP/DLNA MediaRenderer. Supports subtitles too.

## Prerequisites
```
$ sudo npm install -g https://github.com/alexballas/stream2tv.git
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
$ stream2tv <a video file>
```
