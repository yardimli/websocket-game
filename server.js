// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var hellocode = 2015;

/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];

var hellocodes = [];

var clienttype = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
	// Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
var wsServer = new webSocketServer({		httpServer: server});



// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	var connection = request.accept(null, request.origin);

//	console.log(connection);

	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = false;
	var localhellocode = 0;

	console.log((new Date()) + ' Connection accepted.');

	// send back chat history
	if (history.length > 0) {
		connection.sendUTF(JSON.stringify({
			type: 'history',
			data: history
		}));
	}

	// user sent some message
	connection.on('message', function(message) {
		if (message.type === 'utf8') { // accept only text
			if (userName === false) { // first message sent by user is their name
				// remember user name
				console.log(message);

				if (message.utf8Data=="Desktop Connection")
				{
					console.log("Desktop client connected.");

					hellocodes[index] = localhellocode;
					clienttype[index] = "desktop";

				} else
				if (message.utf8Data=="Mobile Connection")
				{
					hellocode++;
					localhellocode=hellocode;

					console.log("Mobile client connected.");
					console.log("sending hello code: "+localhellocode);

					var json = JSON.stringify({
						type: 'hellocode',
						hellocode : hellocode
					});

					hellocodes[index] = localhellocode;
					clienttype[index] = "mobile";

					connection.sendUTF(json);

				} else {
					var tempstring = htmlEntities(message.utf8Data);
					var temparray = tempstring.split("_");

					if (temparray[0]=="register")
					{
						if (temparray[1] == "desktoplogin")
						{

							console.log("got "+temparray[2]+" code from desktop, looking for unpaired mobile connection with it.");
							var foundUnpaired = -1;
							for (var i=0; i<hellocodes.length; i++ )
							{
								if hellocodes[i] == temparray[2])
								{
									foundUnpaired=i;
								}
							}
							if (foundUnpaired==-1)
							{
								console.log("cant find pair");
							} else {
								console.log("found pair");
							}

							/*
							userName = temparray[1];
							userColor = temparray[2];

							connection.sendUTF(JSON.stringify({
								type: 'color',
								username: userName,
								data: userColor
							}));

							console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.');
							*/
						}
					}
				}

			} else { // log and broadcast the message

				// we want to keep history of all sent messages
				var xmsg = htmlEntities(message.utf8Data);
				if (xmsg.indexOf("xy_")==0)
				{
					console.log("coordinate message from " + userName + " " +xmsg);
					var xmsgarray = xmsg.split("_");
					var obj = {
						time: (new Date()).getTime(),
						xpos: xmsgarray[1],
						ypos: xmsgarray[2],
						author: userName,
						color: userColor
					};

					var json = JSON.stringify({
						type: 'position',
						data: obj
					});

				} else {
					console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
					var obj = {
						time: (new Date()).getTime(),
						text: htmlEntities(message.utf8Data),
						author: userName,
						color: userColor
					};

					var json = JSON.stringify({
						type: 'message',
						data: obj
					});

					history.push(obj);
					history = history.slice(-100);
				}


				// broadcast message to all connected clients
				for (var i = 0; i < clients.length; i++) {
					clients[i].sendUTF(json);
				}
			}
		}
	});

	// user disconnected
	connection.on('close', function(connection) {
		if (userName !== false && userColor !== false) {
			console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
			// remove user from the list of connected clients
			clients.splice(index, 1);
		}
	});

});
