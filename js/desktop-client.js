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


var UsersLastX = [];
var UsersLastY = [];

var ShowCircle = 10;

var ReloadPageOnMessageClose = false;
var UnhideLoginModal = false;

$(document).ready(function() {

	// for better performance - to avoid searching in DOM
	var content = $('#content');
	var input = $('#input');
	var status = $('#status');

	$('#LoginModal').modal('show');

	$('#MessageModal').on('hidden.bs.modal', function () {
		if (ReloadPageOnMessageClose) {
			window.location.replace("http://localhost/websocket-game/index-desktop.html");
		}
		if (UnhideLoginModal) {
			$('#LoginModal').modal('show');
			UnhideLoginModal = false;
		}
	})

	$('#LoginModal').on('submit', function(e) { //use on if jQuery 1.7+
        e.preventDefault();  //prevent form from submitting
		  var mobilecodeinput = $("#inputCode").val();
		  var usernameinput = $("#inputName").val();

		  connection.send(JSON.stringify({ msgtype: 'login', device : 'desktop', hellocode : mobilecodeinput, username : usernameinput }));
    });

	 $('#ChatRoomLink').on('click', function() {
		 $("#RoomsMenu").fadeOut('fast');
		 $("#ChatRoom").fadeIn('fast');
	 });

	 //Send mesage when user presses Enter key
 	input.keydown(function(e) {
 		if (e.keyCode === 13) {
 			var msg = $(this).val();
 			if (!msg) {
 				return;
 			}

 			connection.send(msg);
 			$(this).val('');
 			input.attr('disabled', 'disabled');

 			// we know that the first message sent from a user their name
 			if (myName === false) {	myName = msg; }
 		}
 	});


	var myName = false; //from server

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
		connection.send(JSON.stringify({ msgtype: 'connection', device : 'desktop' }));
	};

	connection.onerror = function(error) {
		$("#MessageModalTitle").html("Error");
		$("#MessageModalBody").html('Sorry, but there\'s some problem with your connection or the server is down.');
		$("#MessageModal").modal('show');
	};

	// most important part - incoming messages
	connection.onmessage = function(message) {
		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}

		if (json.msgtype=='error')
		{
			if (($("#LoginModal").data('bs.modal') || {}).isShown) {
				$('#LoginModal').modal('hide');
				UnhideLoginModal = true;
			}

			$("#MessageModalTitle").html("Error");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');
		} else

		if (json.msgtype=='disconnected')
		{
			$("#MessageModalTitle").html("Warning");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');
			ReloadPageOnMessageClose = true;
		} else

		if (json.msgtype === 'paired') {
			$('#LoginModal').modal('hide');

			$("#MessageModalTitle").html("Info");
			$("#MessageModalBody").html(json.msgstring);
			$("#MessageModal").modal('show');
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
			addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
		} else

		if (json.msgtype === 'position') { // it's a position
				input.removeAttr('disabled'); // let the user write another message
				addCoordinate(json.data.author, json.data.xpos, json.data.ypos, json.data.color);
		} else
		{
			console.log('Hmm..., I\'ve never seen JSON like this: ', json);
		}
	};

	//If the server wasn't able to respond to the 3 seconds then show some error message to notify the user that something is wrong.
	setInterval(function() {
		if (connection.readyState !== 1) {
			status.text('Error');
			input.attr('disabled', 'disabled').val('Unable to comminucate ' + 'with the WebSocket server.');
		}
	}, 3000);

	//------------------------------------------------------------------------------------------------
	function addMessage(author, message, color, dt) {

		content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
			+(dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ': ' + message + '</p>');
	}

	//------------------------------------------------------------------------------------------------
	function addCoordinate(author, xpos, ypos, color)
	{
		if(typeof UsersLastX[author] === 'undefined') {
		    UsersLastX[author] = parseInt(xpos,10);
			 UsersLastY[author] = parseInt(ypos,10);
		}

		UsersLastX[author] = parseInt(xpos,10);
		UsersLastY[author] = parseInt(ypos,10);
	}

});
