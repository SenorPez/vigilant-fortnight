//Inspired by
//http://nbodyphysics.com/blog/2016/05/29/planetary-orbits-in-javascript/

var zoomlevel = 5;
var speed = -15;

var canvas = document.getElementById("canvas");
canvas.setAttribute("width", window.innerWidth*0.90);
canvas.setAttribute("height", window.innerHeight*0.90);
var ctx = canvas.getContext("2d");
var time = 0;

var LOOP_LIMIT = 10;

var center_x = canvas.width / 2;
var center_y = canvas.height / 2;

document.addEventListener("keydown", function(event) {
  if (event.code === "KeyW") {
    center_y -= canvas.height * 0.10;
  }
  if (event.code === "KeyS") {
    center_y += canvas.height * 0.10;
  }
  if (event.code === "KeyA") {
    center_x -= canvas.width * 0.10;
  }
  if (event.code === "KeyD") {
    center_x += canvas.width * 0.10;
  }
  if (event.code === "KeyQ") {
    zoomlevel -= 1;
  }
  if (event.code === "KeyE") {
    zoomlevel += 1;
  }
  if (event.code === "KeyZ") {
    speed -= 1;
  }
  if (event.code === "KeyX") {
    speed += 1;
  }
});

function Orbiter(a, e, orbitPeriod, orbitAngle, epochAngle, color) {
  this.a = a; // Average orbit radius (AU)
  this.e = e; // Orbital eccentricity
  this.orbitPeriod = orbitPeriod; // Orbit period (Earth years)
  this.orbitAngle = orbitAngle; // Orbit angle (radians)
  this.epochAngle = epochAngle;
  this.color = color;

  this.last_x = 0;
  this.last_y = 0;
  this.focus_x = 0;
  this.focus_y = 0;
  this.orbiters = [];
}

function AsteroidBelt(a, e, orbitAngle) {
  this.a = a; // Average orbit radius (AU)
  this.e = e; // Orbital eccentricity
  this.orbitAngle = orbitAngle; // Orbit angle (radians)
}

var star1 = new Orbiter(0, 0, 1, 0, 0, "orange");
var star2 = new Orbiter(70, 0.5, 478.191, Math.PI, 0, "orange");

var star1planet1 = new Orbiter(0.092051, 0, Math.sqrt(Math.pow(0.092051, 3)/0.75), 0, 0, "gray");
var star1planet2 = new Orbiter(0.312973, 0, Math.sqrt(Math.pow(0.312973, 3)/0.75), 0, 0, "gray");
var star1planet3 = new Orbiter(0.500757, 0.05, 0.409176, 0, 0, "green");
var star1planet4 = new Orbiter(0.801212, 0.05, 0.82811478, Math.PI*2*0.535421, 0, "gray");
var transfer50 = new Orbiter(0.9443027729810705, 0.833149264281515, 1.0595861326330258, 2.0618325709004184, 4.221352736279168, "purple")
var transfer100 = new Orbiter(0.4912844903881217, 0.6880143517358794, 0.39762066666901474, 2.295574434215324, 3.9876108729642623, "purple")
//var transferreturn = new Orbiter(0.9443027729810697, 0.8331492642815146, 1.059529036539555, 2.061832570900418, 4.221352736279169, "red")
var star1planet5 = new Orbiter(1.36206, 0, Math.sqrt(Math.pow(1.36206, 3)/0.75), 0, 0, "gray");
var star1planet6 = new AsteroidBelt(2.315503, 0, 0);
var star1planet7 = new Orbiter(3.704804, 0, Math.sqrt(Math.pow(3.704804, 3)/0.75), 0, 0, "blue");
var star1planet8;
var star1planet9 = new Orbiter(10.66984, 0, Math.sqrt(Math.pow(10.66984, 3)/0.75), 0, 0, "blue");

var star2planet1 = new Orbiter(0.11262, 0, Math.sqrt(Math.pow(0.11262, 3)/0.75), 0, 0, "gray");
var star2planet2 = new Orbiter(0.306328, 0, Math.sqrt(Math.pow(0.306328, 3)/0.75), 0, 0, "gray");
var star2planet3 = new Orbiter(0.520757, 0, Math.sqrt(Math.pow(0.520757, 3)/0.75), 0, 0, "gray");
var star2planet4;
var star2planet5 = new Orbiter(1.504988, 0, Math.sqrt(Math.pow(1.504988, 3)/0.75), 0, 0, "gray");
var star2planet6 = new Orbiter(2.55848, 0, Math.sqrt(Math.pow(2.55848, 3)/0.75), 0, 0, "gray");
var star2planet7 = new Orbiter(5.116959, 0, Math.sqrt(Math.pow(5.116959, 3)/0.75), 0, 0, "red");

star1.orbiters.push(star2);

star1.orbiters.push(star1planet1);
star1.orbiters.push(star1planet2);
star1.orbiters.push(star1planet3);
star1.orbiters.push(star1planet4);
star1.orbiters.push(transfer50);
star1.orbiters.push(transfer100);
//star1.orbiters.push(transferreturn);
star1.orbiters.push(star1planet5);
star1.orbiters.push(star1planet7);
star1.orbiters.push(star1planet9);

star2.orbiters.push(star2planet1);
star2.orbiters.push(star2planet2);
star2.orbiters.push(star2planet3);
star2.orbiters.push(star2planet5);
star2.orbiters.push(star2planet6);
star2.orbiters.push(star2planet7);

function orbitBody(orbiter) {
  var epoch_E = Math.atan2(Math.sqrt(1 - orbiter.e*orbiter.e)*Math.sin(orbiter.epochAngle), orbiter.e + Math.cos(orbiter.epochAngle))
  var M = 2.0*Math.PI*time/orbiter.orbitPeriod + epoch_E - orbiter.e*Math.sin(epoch_E)
  var u = M;
  var u_next = 0;
  var loopCount = 0;
  while (loopCount++ < LOOP_LIMIT) {
    u_next = u + (M - (u - orbiter.e*Math.sin(u)))/(1 - orbiter.e*Math.cos(u));
    if (Math.abs(u_next - u) < 1E-6) {
      break;
    }
    u = u_next;
  }

  var cos_f = (Math.cos(u) - orbiter.e)/(1 - orbiter.e*Math.cos(u));
  var sin_f = (Math.sqrt(1 - orbiter.e*orbiter.e) 
    * Math.sin(u))/(1 - orbiter.e*Math.cos(u));
  var r = orbiter.a*(1 - orbiter.e*orbiter.e)/(1 + orbiter.e * cos_f);

  var position_x = r*cos_f;
  var position_y = r*sin_f;
  var angle = Math.atan(position_y/position_x);
  if (position_x == 0) {
    angle = 0;
  } else if (position_x < 0) {
    angle += Math.PI;
  } else if (position_y < 0) {
    angle += 2*Math.PI;
  }
  angle += orbiter.orbitAngle;

  orbiter.last_x = r*Math.cos(angle);
  orbiter.last_y = r*Math.sin(angle);

  drawBody(orbiter);
}

function drawBody(body) {
  position_x = body.last_x * Math.pow(2, zoomlevel);
  position_y = body.last_y * Math.pow(2, zoomlevel);

  ctx.beginPath();
  ctx.arc(position_x, position_y, 2, 0, 2*Math.PI);
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.fillStyle = body.color;
  ctx.fill();
}

function drawSystem(object) {
  orbitBody(object);
  drawBody(object);
  ctx.translate(object.last_x * Math.pow(2, zoomlevel),
    object.last_y * Math.pow(2, zoomlevel));
  object.orbiters.forEach(function(orbiter) {
    ctx.strokeStyle = "gray";
    ctx.lineWidth=1;
    ctx.beginPath();
    a = orbiter.a * Math.pow(2, zoomlevel);
    b = a * Math.sqrt(1-Math.pow(orbiter.e, 2));
    c = a * orbiter.e;
    ctx.ellipse(
      0-Math.cos(orbiter.orbitAngle) * c,
      0-Math.sin(orbiter.orbitAngle) * c, 
      a, 
      b, 
      orbiter.orbitAngle, 0, 2 * Math.PI);
    ctx.stroke();
    drawSystem(orbiter);
  });
  ctx.translate(-object.last_x * Math.pow(2, zoomlevel), 
    -object.last_y * Math.pow(2, zoomlevel));
}

function drawNextFrame(object) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  time += 0.03 * Math.pow(2, speed);
  ctx.translate(center_x, center_y);

  drawSystem(object);
  drawCaption();
}

function drawCaption() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "black";
  ctx.font = "10px sans-serif";
  var timescale;
  if (speed > 0) {
    timescale = Math.pow(2, speed) + " years : 1 second";
  } else if (speed == 0) {
    timescale = "1 year : 1 second";
  } else {
    timescale = "1 year : " + 1 / Math.pow(2, speed) + " seconds";
  }
  ctx.fillText(timescale, 10, 10);
  ctx.fillText("Day: " + Math.floor(time*365.26), 10, 30);
}

drawNextFrame(star1);
setInterval(drawNextFrame, 30, star1);
