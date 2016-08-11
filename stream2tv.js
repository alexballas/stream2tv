var fs = require("fs"),
	http = require("http"),
	url = require("url"),
	Browser = require('nodecast-js'),
	MediaRendererClient = require('upnp-mediarenderer-client'),
	keypress = require('keypress');

var settings = { 
	localIP: "192.168.88.250",
	localPort: 8000,
	tvIP: "192.168.88.249"
};

var filename_o = process.argv[2];
var filename  = encodeURIComponent(filename_o);

var url_video = 'http://' + settings.localIP + ':' + settings.localPort +'/' + filename;
var url_subtitle = 'http://' + settings.localIP + ':' + settings.localPort + '/' + filename.replace(/\.[^/.]+$/, ".srt");

keypress(process.stdin);

console.log(url_subtitle);
console.log(url_video);

var streamserver = http.createServer();

streamserver.on('request', function (req, res) {
	if (req.url.indexOf(".srt") != -1) {
		res.writeHead(200, { "Content-Type": "text/html" });
		var fileS = filename_o.replace(/\.[^/.]+$/, ".srt");
		fs.readFile(fileS, "binary", function(err, fileS) {
			if(err) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(err + "\n");
				res.end();
				return;
			}
			res.writeHead(200);
			res.write(fileS, "binary");
			res.end();
		});
	}

	if (req.url.indexOf(".srt") == -1 && req.url.indexOf(".ico") == -1) {
		var path = filename_o;
		var stat = fs.statSync(filename_o);
		var total = stat.size;
		if (req.headers['range']) {
			var range = req.headers.range;
			var parts = range.replace(/bytes=/, "").split("-");
			var partialstart = parts[0];
			var partialend = parts[1];
			var start = parseInt(partialstart, 10);
			var end = partialend ? parseInt(partialend, 10) : total-1;
			var chunksize = (end-start)+1;
			var file = fs.createReadStream(path, {start: start, end: end});
			res.writeHead(206, {
				'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Type': 'video/mp4',
				"transferMode.dlna.org": "Streaming",
				"contentFeatures.dlna.org": "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=017000 00000000000000000000000000",
				"CaptionInfo.sec": url_subtitle
			});
			file.pipe(res);
		} else {
			res.writeHead(200, {
				'Content-Length': 1,
				'Content-Type': 'video/mp4',
				"transferMode.dlna.org": "Streaming",
				"contentFeatures.dlna.org": "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=017000 00000000000000000000000000",
				"CaptionInfo.sec": url_subtitle
			});
			fs.createReadStream(path, {start: 0, end: 1}).pipe(res);
		}
	}
});

streamserver.on('connection', function (socket) {
	socket.setTimeout(36000000)
})

streamserver.listen(settings.localPort);

var options = { 
	autoplay: true,
	metadata: {
		subtitlesUrl: url_subtitle,
		url: url_video,
		type: "video",
		title: 'Stream2TV'
	},
	contentType: "video/mp4"
};

var browser = new Browser();

browser.onDevice(function (device) {
	console.log(device);
	if (device.host == settings.tvIP && device.type == 'upnp') {
		//var client = new MediaRendererClient('http://192.168.88.249:9197/dmr');
		var client = new MediaRendererClient(device.xml);
		var playback_status = null;
		client.load(url_video, options, function(err, result) {
			console.log('Starting ...');
		});
		client.on('status', function(status) {
		  // Reports the full state of the AVTransport service the first time it fires, 
		  // then reports diffs. Can be used to maintain a reliable copy of the 
		  // service internal state. 
		  // console.log(status);
		});
		 
		client.on('loading', function() {
		  //console.log('loading');
		});
		 
		client.on('playing', function() {
		  console.log('Playing ...');
		  playback_status = "playing";
		  client.getPosition(function(err, position) {
			//console.log(position); // Current position in seconds 
		  });
		 
		  client.getDuration(function(err, duration) {
			//console.log(duration); // Media duration in seconds 
		  });
		});
		 
		client.on('paused', function() {
		  console.log('paused');
		  playback_status = "paused";
		});
		 
		client.on('stopped', function() {
		  console.log('stopped');
		  process.exit();
		});
		 
		client.on('speedChanged', function(speed) {
		  console.log('speedChanged', speed);
		});

		// listen for the "keypress" event
		process.stdin.on('keypress', function (ch, key) {
  			try {
				if (key.name == 'p') {
					if (playback_status == "playing") {
						client.pause();
					} else {
						client.play();
					}
				}
				if (key.name == 'f') { 
					client.getPosition(function(err, position) {
						client.seek(Math.round(position + 60)); // Media duration in seconds 
				});
				}
				if (key.name == 'b') {
					client.getPosition(function(err, position) {
						client.seek(-60);
				});
				}
				if (key.ctrl && key.name == 'c') {
					client.stop();
					setTimeout(function(){ process.exit() }, 3000);
				}
			} catch(e){
				console.log("Error during keypress: ",e)
			}
		});
	}
	device.onError(function (err) {
		console.log(err);
	});
});

browser.start();
process.stdin.setRawMode(true);
