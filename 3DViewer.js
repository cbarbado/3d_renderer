class Point {
	constructor(x = 0.0, y = 0.0, z = 0.0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	subtract(p) {
		return new Point(this.x - p.x, this.y - p.y, this.z - p.z);
	}
}

class Geometry3D {
	constructor(geometryData) {
		var tmp                 = JSON.parse(geometryData);
		this.vertices           = tmp.vertices;
		this.faces              = tmp.faces;
		this.transformRotate    = 0;
		this.transformScale     = 1;
		this.transformedVertices = new Array();
	}

	transformVertices(s = this.transformScale, r = this.transformRotate) {
		r = (r / 180) * 3.1415;
		this.transformedVertices = new Array();
		this.vertices.forEach((v) => {
			this.transformedVertices.push(new Point((v[0]*Math.cos(r)-v[1]*Math.sin(r))*s, (v[0]*Math.sin(r)+v[1]*Math.cos(r))*s, v[2]*s));
		});
	}

	isFaceVisible(face) {
		var v1 = this.transformedVertices[face[0]-1].subtract(this.transformedVertices[face[1]-1]);
		var v2 = this.transformedVertices[face[2]-1].subtract(this.transformedVertices[face[1]-1]);

		return (/* vCrossX */ (v1.y * v2.z - v1.z * v2.y) + /* vCrossY */ (v1.z * v2.x - v1.x * v2.z) - /* vCrossZ */ (v1.x * v2.y - v1.y * v2.x) > 0);
	}

	/* TODO: convert the data files from multiple edges polygons to tryangles meshes */
	/* TODO: subtract 1 from the vertices indexes in the data files */
	drawWireframe(context, offsetX = 0, offsetY = 0, culling = false) {
		var coords = new Array();
		this.transformedVertices.forEach((v) => {
			coords.push(new Point(v.x * 0.707 + v.y * -0.707 + offsetX, v.x * 0.409 + v.y * 0.409 + v.z * 0.816 + offsetY, 0.0));
		});
		this.faces.forEach((f) => {
			if(!culling || this.isFaceVisible(f)) {
				context.beginPath();
				context.moveTo(coords[f[0]-1].x,coords[f[0]-1].y);
				context.lineTo(coords[f[1]-1].x,coords[f[1]-1].y);
				context.lineTo(coords[f[2]-1].x,coords[f[2]-1].y);
				context.lineTo(coords[f[3]-1].x,coords[f[3]-1].y);
				context.lineTo(coords[f[0]-1].x,coords[f[0]-1].y);
				context.closePath();
				context.stroke();
			}
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
var culling = false;

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transformVertices(-0.0075, angle); /* TODO: normalize objetcs size in data files to remove this arbitrary scale factor */
	clearCanvas();
	currentGeometry.drawWireframe(context, canvasWidth / 2, canvasHeight / 2, culling);
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

function toogleCulling() {
	culling = !culling;
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