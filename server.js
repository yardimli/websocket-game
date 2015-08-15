// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');


// Global variables


// latest 100 messages
var history = [];

// list of currently connected clients (users)
var clients = [];
var clientsData = [];

var hellocode = 2015;


//--------------------------------------------------------------------------------
// Helper function for escaping input strings
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

//--------------------------------------------------------------------------------
// HTTP server
var server = http.createServer(function(request, response) {
	// Not important for us. We're writing WebSocket server, not HTTP server
});

//--------------------------------------------------------------------------------
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});






//--------------------------------------------------------------------------------
var wsServer = new webSocketServer({httpServer: server});


//--------------------------------------------------------------------------------
// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function(request) {

	//--------------------------------------------------------------------------------
	// this part will run only once for each connection and the variables here will be recreated for each user
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	var connection = request.accept(null, request.origin);

//	console.log(connection);
	clients.push(connection);

	var index = clients.length - 1;

	var isPaired = false;
	var localhellocode = -1;

	console.log((new Date()) + ' Connection accepted. User index: '+index);

	//--------------------------------------------------------------------------------
	// send back chat history
	if (history.length > 0) {
		connection.sendUTF(JSON.stringify({
			type: 'history',
			data: history
		}));
	}

	//--------------------------------------------------------------------------------
	// message from connected clients
	connection.on('message', function(message) {
		if (message.type === 'utf8') { // accept only text
			console.log(message);

			try {
				var messagedata = JSON.parse( message.utf8Data );
			} catch (e) {
				console.log('This doesn\'t look like a valid JSON: ', message.utf8Data);
				return;
			}
			//if part of message has html should use htmlEntities() on those parameters of the messagedata
			console.log(messagedata);

			//--------------------------------------------------------------------------------
			if (messagedata.msgtype=="connection") {
				if (messagedata.device=="desktop")
				{
					console.log("Desktop client connected.");

					clientsData[index] = {hellocode : "-1", clienttype : "desktop", username: "", pairIndex : -1, isOnline : true};
				} else
				if (messagedata.device=="mobile")
				{
					hellocode++;
					localhellocode=hellocode;

					clientsData[index] = {hellocode : localhellocode, clienttype : "mobile", username: "", pairIndex : -1, isOnline : true};

					console.log("Mobile client connected.");
					console.log("sending hello code: "+localhellocode);

					connection.sendUTF(JSON.stringify({ msgtype: 'hellocode', hellocode : hellocode }));

				}
			} else

			if ( (messagedata.msgtype=="login") && (messagedata.device=="desktop") )
			{
				if ( (messagedata.hellocode!="") && (messagedata.username!="") )
				{
					console.log("Got "+messagedata.hellocode+" code from desktop with username " + messagedata.username);
					console.log("Looking for unpaired mobile connection with it.");

					var foundUnpaired = -1;
					var foundPairedError = false;
					for (var i=0; i<clientsData.length; i++ )
					{
						if ( (clientsData[i].hellocode == messagedata.hellocode) && (clientsData[i].isOnline) )  {
							if (clientsData[i].pairIndex == -1) { foundUnpaired=i;  } else { foundPairedError = true; }

						}
					}

					if (foundUnpaired==-1)
					{
						console.log("Can't find pair");
						if (foundPairedError) {
							connection.sendUTF(JSON.stringify({
								msgtype: 'error',
								msgstring: "Error. Code is already paired with another user."
							}));
						} else {
							connection.sendUTF(JSON.stringify({
								msgtype: 'error',
								msgstring: "Error. Can't find code. Please verify it is the same as on your phone."
							}));
						}
					} else {
						console.log("Found pair on index: "+foundUnpaired);
						clientsData[foundUnpaired].username = messagedata.username;

						clientsData[foundUnpaired].pairIndex = index;
						clientsData[index].pairIndex = foundUnpaired;

						connection.sendUTF(JSON.stringify({ msgtype: 'paired', msgstring: "Pairing complete." }));

						clients[foundUnpaired].sendUTF(JSON.stringify({ msgtype: 'paired', msgstring: "Pairing complete." }));
						clients[foundUnpaired].sendUTF(JSON.stringify({ msgtype: 'updatename', msgstring: messagedata.username }));

						console.log((new Date()) + ' User is known as: ' + clientsData[foundUnpaired].username);
					}
				} else {
					connection.sendUTF(JSON.stringify({
						msgtype: 'error',
						msgstring: "Error. Please type in both code and username."
					}));
				}
			} else
			//--------------------------------------------------------------------------------
			// username is set
			{ // log and broadcast the message

				//coordinate messages will not be added to history
				var xmsg = htmlEntities(message.utf8Data);
				if (xmsg.indexOf("xy_")==0)
				{
					console.log("coordinate message from " + userName + " " +xmsg);
					var xmsgarray = xmsg.split("_");
					var obj = {
						time: (new Date()).getTime(),
						xpos: xmsgarray[1],
						ypos: xmsgarray[2],
						author: userName
					};

					var json = JSON.stringify({
						type: 'position',
						data: obj
					});

				} else
				//keep history of all sent messages
				{
					console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
					var obj = {
						time: (new Date()).getTime(),
						text: htmlEntities(message.utf8Data),
						author: userName
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

	//--------------------------------------------------------------------------------
	// user disconnected
	connection.on('close', function(connection) {
		console.log((new Date()) + " Peer " +  connection.remoteAddress + " with index "+ index +" disconnected.");

		clientsData[index].isOnline = false;
		var pairIndex = clientsData[index].pairIndex;
		console.log("pair index: "+ pairIndex );

		if (pairIndex!=-1)
		{
			clientsData[ pairIndex ].isOnline = false;
			clients[ pairIndex ].sendUTF(JSON.stringify({ msgtype: 'disconnected', msgstring: "Pair disconnected." }));
		}
		/*
		if (userName !== false) {
			console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
			// remove user from the list of connected clients
			clients.splice(index, 1);
		}
		*/
	});

});
