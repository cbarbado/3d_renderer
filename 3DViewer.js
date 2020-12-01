const canvasWidth  = 600;
const canvasHeight = 600;

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
		var tmp             = JSON.parse(geometryData);
		this.vertices       = tmp.vertices;
		this.faces          = tmp.faces;
		this.transformedVertices = this.vertices;
		this.transformRotate    = 0;
		this.transformScale     = 1;
	}

	transform(s = this.transformScale, r = this.transformRotate) {
		r = (r / 180) * 3.1415;
		this.transformedVertices = new Array();
		this.vertices.forEach((v) => {
			var tmp = new Array();
			tmp.push((v[0]*Math.cos(r)-v[1]*Math.sin(r))*s);
			tmp.push((v[0]*Math.sin(r)+v[1]*Math.cos(r))*s);
			tmp.push(v[2]*s);
			this.transformedVertices.push(tmp);
		});
	}

	/* TODO: review this method */
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

	/* TODO: subtract 1 from the vertices indexes in the data files */
	drawWireframe(context) {
		var coords = new Array();
		this.transformedVertices.forEach((v) => {
			var tmp = new Array;
			tmp.push(v[0]*0.707 + v[1]*-0.707 + (canvasWidth / 2));
			tmp.push(v[0]*0.409+v[1]*0.409+v[2]*0.816 + (canvasHeight / 2));
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
	}
}

var canvas;
var context;
var geometriesData  = [cubeData, pyramidData, chesspawnData, cylinderData, funnelsData, beadsData, coneData, sphereData, toroidData, lgbeadsData, mechpartData, rocketData];
var geometries      = new Array();
var currentGeometry = null;

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transform(1, angle);
	clearCanvas();
	currentGeometry.drawWireframe(context);
	angle = (angle + 1) % 360;
}

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

	geometriesData.forEach((gd) => {
		geometries.push(new Geometry3D(gd).normalize(canvasHeight*0.5))
	});

	$('#canvas').mousedown(function(e)
	{
		// redraw();
	});
	  
	setInterval(animationLoop,20);
}

function setGeometry(g) {
	if(g == null) {
		currentGeometry = null;	
		clearCanvas();
	}
	else {
		currentGeometry = geometries[g];
	}
}

function clearCanvas()
{
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

/*
function redraw()
{
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
*/