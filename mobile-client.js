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

var delay = 50;

var alpha = 0;
var beta = 0;
var gamma = 0;

$(document).ready(function() {
	if (window.DeviceMotionEvent == undefined) {
		//		$("#no").show();
		//		$("#yes").hide();
	} else {
		$("#no").hide();
		$("#yes").show();

	}

	//$(window).bind("devicemotion", function(event) {
	window.ondevicemotion = function(event) {
			//	$("#test-div").text("hello "+event.accelerationIncludingGravity.x);

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
				DrawX = 0;
				ctx.moveTo(DrawX, DrawY);
			}
		} else {
			DrawX -= ((beta * (-1)) / 10);
			if (DrawX < 0) {
				DrawX = 600;
				ctx.moveTo(DrawX, DrawY);
			}
		}

		if (gamma > 0) {
			DrawY -= (gamma / 10);
			if (DrawY < 0) {
				DrawY = 300;
				ctx.moveTo(DrawX, DrawY);
			}
		} else {
			DrawY += ((gamma * (-1)) / 10);
			if (DrawY > 300) {
				DrawY = 0;
				ctx.moveTo(DrawX, DrawY);
			}
		}
	}, delay);
});
