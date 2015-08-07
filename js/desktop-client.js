// Position Variables
var x = 0;
var y = 0;
var z = 0;

var DrawX = 100;
var DrawY = 100;

// Speed - Velocity
var vx = 0;
var vy = 0;
var vz = 0;

// Acceleration
var ax = 0;
var ay = 0;
var az = 0;
var ai = 0;

var arAlpha = 0;
var arBeta = 0;
var arGamma = 0;

var delay = 100;
var vMultiplier = 0.01;

var alpha = 0;
var beta = 0;
var gamma = 0;

var UsersLastX = [];
var UsersLastY = [];

var ShowCircle = 10;

$(document).ready(function() {


	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");

	var c2 = document.getElementById("myCanvasBlink");
	var ctx2 = c2.getContext("2d");
	/*
	ctx.moveTo(0, 0);
	ctx.lineTo(150, 150);
	ctx.stroke();
	*/

	// for better performance - to avoid searching in DOM
	var content = $('#content');
	var input = $('#input');
	var status = $('#status');

	// my color assigned by the server
	var myColor = false;
	// my name sent to the server
	var myName = false;

	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

	// if browser doesn't support WebSocket, just show some notification and exit
	if (!window.WebSocket) {
		content.html($('<p>', {
			text: 'Sorry, but your browser doesn\'t ' + 'support WebSockets.'
		}));
		input.hide();
		$('span').hide();
		return;
	}

	// open connection
	var connection = new WebSocket('ws://game.elooi.com:1337');

	connection.onopen = function() {
		// first we want users to enter their names
		input.removeAttr('disabled');
		status.text('Choose name:');
	};

	connection.onerror = function(error) {
		// just in there were some problems with conenction...
		content.html($('<p>', {
			text: 'Sorry, but there\'s some problem with your ' + 'connection or the server is down.'
		}));
	};

	// most important part - incoming messages
	connection.onmessage = function(message) {
		// try to parse JSON message. Because we know that the server always returns
		// JSON this should work without any problem but we should make sure that
		// the massage is not chunked or otherwise damaged.
		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}

		// NOTE: if you're not sure about the JSON structure
		// check the server source code above
		if (json.type === 'color') { // first response from the server with user's color
			myColor = json.data;
			status.text(myName + ': ').css('color', myColor);
			input.removeAttr('disabled').focus();
			// from now user can start sending messages
		} else if (json.type === 'history') { // entire message history
			// insert every single message to the chat window
			for (var i = 0; i < json.data.length; i++) {
				addMessage(json.data[i].author, json.data[i].text,
					json.data[i].color, new Date(json.data[i].time));
			}
		} else if (json.type === 'message') { // it's a single message
			input.removeAttr('disabled'); // let the user write another message
			addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
		} else if (json.type === 'position') { // it's a position
				input.removeAttr('disabled'); // let the user write another message
				addCoordinate(json.data.author, json.data.xpos, json.data.ypos, json.data.color);
		} else {
			console.log('Hmm..., I\'ve never seen JSON like this: ', json);
		}
	};

	/**
	 * Send mesage when user presses Enter key
	 */
	input.keydown(function(e) {
		if (e.keyCode === 13) {
			var msg = $(this).val();
			if (!msg) {
				return;
			}
			// send the message as an ordinary text
			connection.send(msg);
			$(this).val('');
			// disable the input field to make the user wait until server
			// sends back response
			input.attr('disabled', 'disabled');

			// we know that the first message sent from a user their name
			if (myName === false) {
				myName = msg;
			}
		}
	});

	/**
	 * This method is optional. If the server wasn't able to respond to the
	 * in 3 seconds then show some error message to notify the user that
	 * something is wrong.
	 */
	setInterval(function() {
		if (connection.readyState !== 1) {
			status.text('Error');
			input.attr('disabled', 'disabled').val('Unable to comminucate ' + 'with the WebSocket server.');
		}
	}, 3000);

	/**
	 * Add message to the chat window
	 */
	function addMessage(author, message, color, dt) {

		content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
			+(dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ': ' + message + '</p>');
	}

	function addCoordinate(author, xpos, ypos, color)
	{
		if(typeof UsersLastX[author] === 'undefined') {
		    UsersLastX[author] = parseInt(xpos,10);
			 UsersLastY[author] = parseInt(ypos,10);
		}

//		console.log(xpos+" "+ypos);
		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.moveTo(UsersLastX[author],UsersLastY[author]);
		ctx.lineTo(parseInt(xpos,10),parseInt(ypos,10));
		ctx.stroke();

		ctx2.clearRect(parseInt(xpos,10)-10,parseInt(ypos,10)-10,parseInt(xpos,10)+10,parseInt(ypos,10)+10);

		ctx2.beginPath();
		ctx2.strokeStyle = color;
		ctx2.arc(parseInt(xpos,10),parseInt(ypos,10),5,0,2*Math.PI);
		ctx2.stroke();

		UsersLastX[author] = parseInt(xpos,10);
		UsersLastY[author] = parseInt(ypos,10);
	}




});
