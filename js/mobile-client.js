"use strict";

function positionModals(e) {
	 var $this = $(this).css('display', 'block'),
		  $window = $(window),
		  $dialog = $this.find('.modal-dialog'),
		  offset = ($window.height() - $window.scrollTop() - $dialog.height()) / 2,
		  marginBottom = parseInt($dialog.css('margin-bottom'), 10);

	 $dialog.css('margin-top', offset < marginBottom ? marginBottom : offset);
}

$(document).on('show.bs.modal', '.modal', positionModals);

$(window).on('resize', function(e) {
	 $('.modal:visible').each(positionModals);
});

// Position Variables
var x = 0;
var y = 0;
var z = 0;

var lastx = 0;
var lasty = 0;

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

var delay = 50;
var vMultiplier = 0.01;

var alpha = 0;
var beta = 0;
var gamma = 0;

var ReloadPageOnMessageClose = false;


$(document).ready(function() {

	$('#PassCodeModal').modal('show');

	$('#MessageModal').on('hidden.bs.modal', function () {
		if (ReloadPageOnMessageClose) {
			window.location.replace("http://localhost/websocket-game/index-mobile.html");
		}
	})


	// for better performance - to avoid searching in DOM
	var content = $('#content');
	var input = $('#input');
	var status = $('#status');

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
	//var connection = new WebSocket('ws://game.elooi.com:1337');
	var connection = new WebSocket('ws://192.168.1.109:1337');

	connection.onopen = function() {
		connection.send(JSON.stringify({ msgtype: 'connection', device : 'mobile' }));
	};

	connection.onerror = function(error) {
		// just in there were some problems with conenction...
		$("#MessageModalTitle").html("Warning");
		$("#MessageModalBody").html('Sorry, but there\'s some problem with your connection or the server is down.');
		$("#MessageModal").modal('show');
	};

	connection.onmessage = function(message) {
		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}

		if (json.msgtype=='updatename')
		{
			$("#DesktopName").html(json.msgstring);
		} else

		if (json.msgtype=='error')
		{
			$("#MessageModalTitle").html("Error");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');
		} else

		if (json.msgtype=='disconnected')
		{
			ReloadPageOnMessageClose = true;
			$("#MessageModalTitle").html("Warning");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');
		} else

		if (json.msgtype === 'paired') {
			$('#PassCodeModal').modal('hide');

			$("#MessageModalTitle").html("Info");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');

		} else

		if (json.msgtype === 'hellocode') {
			$("#hellocode").html(json.hellocode);
		} else

		if (json.msgtype === 'color') { // first response from the server with user's color
			myName = json.username;
			status.text(myName + ': ');
			input.removeAttr('disabled').focus();
			input.show();
			$("#ChooseName").hide();

			// from now user can start sending messages
		} else

		if (json.msgtype === 'history') { // entire message history
			// insert every single message to the chat window
			for (var i = 0; i < json.data.length; i++) {
				addMessage(json.data[i].author, json.data[i].text,
					json.data[i].color, new Date(json.data[i].time));
			}
		} else

		if (json.msgtype === 'message') { // it's a single message
			input.removeAttr('disabled'); // let the user write another message
			addMessage(json.data.author, json.data.text,
				json.data.color, new Date(json.data.time));
		} else

		if (json.msgtype === 'position') { // it's a coordinate message
			input.removeAttr('disabled');

		} else {
			console.log('Hmm..., I\'ve never seen JSON like this: ', json);
		}
	};


	$(".myButton").on('click', function() {
		var tempname = $(this).attr("id");
/*		console.log($(this).attr("id"));
		var temparray = tempname.split("_");
		var username = temparray[1];
		var usercolor = temparray[2];*/
		connection.send(tempname);
	});

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
			//if (myName === false) {
			//	myName = msg;
			//}
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


	window.ondevicemotion = function(event) {
		ax = Math.round(Math.abs(event.acceleration.x * 1)); //accelerationIncludingGravity
		ay = Math.round(Math.abs(event.acceleration.y * 1));
		az = Math.round(Math.abs(event.acceleration.z * 1));
		ai = Math.round(event.interval * 100) / 100;
		rR = event.rotationRate;
		if (rR != null) {
			arAlpha = Math.round(rR.alpha);
			arBeta = Math.round(rR.beta);
			arGamma = Math.round(rR.gamma);
		}
	}

	window.ondeviceorientation = function(event) {
		alpha = Math.round(event.alpha);
		beta = Math.round(event.beta);
		gamma = Math.round(event.gamma);
	}

	setInterval(function() {
		$("#xlabel").text("X: " + ax);
		$("#ylabel").text("Y: " + ay);
		$("#zlabel").text("Z: " + az);
		$("#ilabel").text("I: " + ai);
		$("#arAlphaLabel").text("arA: " + arAlpha);
		$("#arBetaLabel").text("arB: " + arBeta);
		$("#arGammaLabel").text("arG: " + arGamma);

		$("#alphalabel").text("Alpha: " + alpha);
		$("#betalabel").text("Beta: " + beta);
		$("#gammalabel").text("Gamma: " + gamma);

		if (beta > 0) {
			DrawX += (beta / 10);
			if (DrawX > 600) {
				DrawX = 600;
			}
		} else {
			DrawX -= ((beta * (-1)) / 10);
			if (DrawX < 0) {
				DrawX = 0;
			}
		}
		if (gamma > 0) {
			DrawY -= (gamma / 10);
			if (DrawY < 0) {
				DrawY = 0;
			}
		} else {
			DrawY += ((gamma * (-1)) / 10);
			if (DrawY > 300) {
				DrawY = 300;
			}
		}

		if (myName === false) {} else {
			if ( (DrawX!=lastx) || (DrawY!=lasty) )
			{
				connection.send("xy_" + DrawX + "_" + DrawY);
			}

			lastx=DrawX;
			lasty=DrawY;
		}
	}, delay);
});
