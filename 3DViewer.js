class Point3D {
	constructor(x,y,z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	draw(context) {
		context.fillRect(point.x, point.y,3,3);
	}
}

class Geometry3D {
	constructor(geometryData) {
		var tmp = JSON.parse(geometryData);
		this.vertices = tmp.vertices;
		this.faces    = tmp.faces;
	}

	normalize(sizeLimit) {
		var maxSize = this.vertices[0][0];
		var minSize = this.vertices[0][0];
		this.vertices.forEach((v) => {
			if(maxSize > v[0]) maxSize = v[0];
			if(maxSize > v[1]) maxSize = v[1];
			if(maxSize > v[2]) maxSize = v[2];
			if(minSize < v[0]) minSize = v[0];
			if(minSize < v[1]) minSize = v[1];
			if(minSize < v[2]) minSize = v[2];
		});
		var scale = sizeLimit / (maxSize - minSize);
		this.vertices.forEach((v) => {
			v[0] = (v[0] * scale);
			v[1] = (v[1] * scale);
			v[2] = (v[2] * scale);
		});
		return this;
	}

	drawVertices(context) {
		this.vertices.forEach((v) => {
			// context.fillRect(v[0], v[1],3,3)
			context.fillRect(v[0]*0.707 + v[1]*-0.707 + 400, v[0]*0.409+v[1]*0.409+v[2]*0.816 + 300,3,3)
		});
		/*
		context.beginPath();
		context.moveTo(this.vertexes[0].x,this.vertexes[0].y);
		context.lineTo(this.vertexes[1].x,this.vertexes[1].y);
		context.lineTo(this.vertexes[2].x,this.vertexes[2].y);
		context.lineTo(this.vertexes[0].x,this.vertexes[0].y);
		context.closePath();
		context.stroke();
		*/
	}

	drawWireframe(context) {
		var coords = new Array();
		this.vertices.forEach((v) => {
			var tmp = new Array;
			tmp.push(v[0]*0.707 + v[1]*-0.707 + 400);
			tmp.push(v[0]*0.409+v[1]*0.409+v[2]*0.816 + 300);
			coords.push(tmp);
		});
		this.faces.forEach((f) => {
			context.beginPath();
			context.moveTo(coords[f[0]-1][0],coords[f[0]-1][1]);
			context.lineTo(coords[f[1]-1][0],coords[f[1]-1][1]);
			context.lineTo(coords[f[2]-1][0],coords[f[2]-1][1]);
			context.lineTo(coords[f[3]-1][0],coords[f[3]-1][1]);
			context.lineTo(coords[f[0]-1][0],coords[f[0]-1][1]);
			context.closePath();
			context.stroke();
		});
		/*
		context.beginPath();
		context.moveTo(this.vertexes[0].x,this.vertexes[0].y);
		context.lineTo(this.vertexes[1].x,this.vertexes[1].y);
		context.lineTo(this.vertexes[2].x,this.vertexes[2].y);
		context.lineTo(this.vertexes[0].x,this.vertexes[0].y);
		context.closePath();
		context.stroke();
		*/
	}
}

var canvas;
var context;
const canvasWidth  = 800;
const canvasHeight = 600;
var cube    = new Geometry3D(cubeData);
var pyramid = new Geometry3D(pyramidData);
var chesspawn = new Geometry3D(chesspawnData);
var cylinder = new Geometry3D(cylinderData);
var funnels = new Geometry3D(funnelsData);
var beads = new Geometry3D(beadsData);
var cone = new Geometry3D(coneData);
var sphere = new Geometry3D(sphereData);
var toroid = new Geometry3D(toroidData);

function prepareCanvas()
{
	var canvasDiv = document.getElementById('canvasDiv');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', canvasWidth);
	canvas.setAttribute('height', canvasHeight);
	canvas.setAttribute('id', 'canvas');
	canvasDiv.appendChild(canvas);
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}

	context = document.getElementById('canvas').getContext("2d");

	context.strokeStyle = "#00ff00";
	context.fillStyle   = "#00ff00";
    context.lineWidth   = 1;

	cube.normalize(canvasHeight*0.5);
	pyramid.normalize(canvasHeight*0.5);
	chesspawn.normalize(canvasHeight*0.5);
	cylinder.normalize(canvasHeight*0.5);
	funnels.normalize(canvasHeight*0.5);
	beads.normalize(canvasHeight*0.5);
	cone.normalize(canvasHeight*0.5);
	sphere.normalize(canvasHeight*0.5);
	toroid.normalize(canvasHeight*0.5);

	$('#canvas').mousedown(function(e)
	{
		// redraw();
  	});
}

function drawPawn() {
	clearCanvas();
	chesspawn.drawWireframe(context)
}

function drawCube() {
	clearCanvas();
	cube.drawWireframe(context)
}

function drawPyramid() {
	clearCanvas();
	pyramid.drawWireframe(context)
}

function drawCylinder() {
	clearCanvas();
	cylinder.drawWireframe(context)
}

function drawFunnels() {
	clearCanvas();
	funnels.drawWireframe(context)
}

function drawBeads() {
	clearCanvas();
	beads.drawWireframe(context)
}

function drawCone() {
	clearCanvas();
	cone.drawWireframe(context)
}

function drawSphere() {
	clearCanvas();
	sphere.drawWireframe(context)
}

function drawToroid() {
	clearCanvas();
	toroid.drawWireframe(context)
}

function clearCanvas()
{
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function redraw()
{
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}