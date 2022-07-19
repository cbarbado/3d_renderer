class Point {
	constructor(x = 0.0, y = 0.0, z = 0.0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	getSubtract(p) {
		return new Point(this.x - p.x, this.y - p.y, this.z - p.z);
	}

	getModule() {
		return(Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
	}

	normalize() {
		var m = this.getModule();
		this.x = this.x / m;
		this.y = this.y / m;
		this.z = this.z / m;
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

	calcFacelightening(face) {
		var v1 = this.transformedVertices[face[0]-1].getSubtract(this.transformedVertices[face[1]-1]); // first edge of this face
		var v2 = this.transformedVertices[face[2]-1].getSubtract(this.transformedVertices[face[1]-1]); // second edge of this face

		var vCross = new Point((v1.y * v2.z - v1.z * v2.y), (v1.z * v2.x - v1.x * v2.z), (v1.x * v2.y - v1.y * v2.x)); // face normal vector
		vCross.normalize(); // unity face normal vector

		return (vCross.x + vCross.y - vCross.z) * 0.57735; // simplification of normal and view vectors dot product (cos of the angle between normal and view (1, 1, -1) vectors)
	}

	/* TODO: convert the data files from multiple edges polygons to tryangles meshes */
	/* TODO: subtract 1 from the vertices indexes in the data files */
	render(context, width = 0, height = 0, flagShading = false) {
		var coords = new Array();
		var offsetX = width / 2;
		var offsetY = height / 2;
		this.transformedVertices.forEach((v) => {
			// TODO: add Z projection formula to enable ZBuffer implementation -- maybe just keep v.z value would work???
			coords.push(new Point(v.x * 0.707 + v.y * -0.707 + offsetX, v.x * 0.409 + v.y * 0.409 + v.z * 0.816 + offsetY, v.z));
		});
		this.faces.forEach((f) => {
			var faceLightening = this.calcFacelightening(f);

			if(!flagShading || faceLightening > 0) {
				context.beginPath();
				context.moveTo(coords[f[0]-1].x,coords[f[0]-1].y);
				context.lineTo(coords[f[1]-1].x,coords[f[1]-1].y);
				context.lineTo(coords[f[2]-1].x,coords[f[2]-1].y);
				context.lineTo(coords[f[3]-1].x,coords[f[3]-1].y);
				context.lineTo(coords[f[0]-1].x,coords[f[0]-1].y);
				context.closePath();

				if(flagShading) {
					faceLightening = Math.floor(255 * faceLightening);
					faceLightening = `rgb(${faceLightening}, ${faceLightening}, ${faceLightening})`;
	
					context.fillStyle = faceLightening;
					// TODO: Implement my own polygon fill routine with ZBuffer
					context.fill();
				}
				else {
					faceLightening = "#00cc00";
				}

				context.strokeStyle = faceLightening;
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
var flagShading     = false;

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transformVertices(-0.0075, angle); /* TODO: normalize objetcs size in data files to remove this arbitrary scale factor */
	clearCanvas();
	currentGeometry.render(context, canvasWidth, canvasHeight, flagShading);
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

	geometriesData.forEach((gd) => {
		geometries.push(new Geometry3D(gd));
	});

	setInterval(animationLoop,20);
}

function toogleShading() {
	flagShading = !flagShading;
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