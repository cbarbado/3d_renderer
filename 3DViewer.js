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

	/* TODO: convert the data files from multiple edges polygons to tryangles meshes */
	/* TODO: subtract 1 from the vertices indexes in the data files */
	drawWireframe(context, offsetX = 0, offsetY = 0) {
		var coords = new Array();
		this.transformedVertices.forEach((v) => {
			var tmp = new Array;
			tmp.push(v[0]*0.707 + v[1]*-0.707 + offsetX);
			tmp.push(v[0]*0.409+v[1]*0.409+v[2]*0.816 + offsetY);
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

const canvasWidth  = 600;
const canvasHeight = 600;
var canvas;
var context;
var geometriesData  = [cubeData, pyramidData, chesspawnData, cylinderData, funnelsData, beadsData, coneData, sphereData, toroidData, lgbeadsData, mechpartData, rocketData];
var geometries      = new Array();
var currentGeometry = null;

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transform(-0.0075, angle); /* TODO: normalize objetcs size in data files to remove this arbitrary scale factor */
	clearCanvas();
	currentGeometry.drawWireframe(context, canvasWidth / 2, canvasHeight / 2);
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

	geometriesData.forEach((gd) => {
		geometries.push(new Geometry3D(gd));
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