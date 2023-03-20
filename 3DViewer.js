class Point {
	constructor(x = 0.0, y = 0.0, z = 0.0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	getSubtraction(p) {
		return new Point(this.x - p.x, this.y - p.y, this.z - p.z);
	}

	getModule() {
		return(Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
	}

	normalize() {
		var inv_m = 1 / this.getModule();
		this.x = this.x * inv_m;
		this.y = this.y * inv_m;;
		this.z = this.z * inv_m;;
	}
}

class Geometry3D {
	constructor(geometryData) {
		this.vertices            = geometryData.vertices;
		this.faces               = geometryData.faces;
		this.color               = geometryData.color ? geometryData.color : "#969696";
		this.transformRotate     = 0;
		this.scale               = geometryData.scale ? geometryData.scale : [1, 1, 1]; // TODO: convert array to point
		this.transformedVertices = new Array();
	}

	transformVertices(s = this.transformScale, r = this.transformRotate) {
		r = (r / 180) * 3.1415;
		s = (null == s) ? this.scale : s;
		this.transformedVertices = new Array();
		this.vertices.forEach((v) => {
			// ROTATE ON Z
			var p = new Point();
			p.x = (v[0] * Math.cos(r) - v[1] * Math.sin(r)) * s[0];
			p.y = (v[0] * Math.sin(r) + v[1] * Math.cos(r)) * s[1];
			p.z = v[2] * s[2];

			// CHANGE PERPECTIVE ANGLE TO BE DINAMIC
			// ROTATE ON X - PERSPECTIVE
			var p2 = new Point();
			p2.x = p.x;
			p2.y = p.y * 0.707 + p.z * -0.707; // y * cos(45) + z * sin(45)
			p2.z = p.y * 0.707 + p.z * 0.707;  // y * -sin(45) + z * cos (45)

			p2.z = 1000 - p2.z; // view distance // TODO: check why need to invert Z axis???
			
			this.transformedVertices.push(p2);			
		});
	}

	// BUG: Check why culling is glitching on cube and pyramid
	calcFacelightening(face) {
		var v1 = this.transformedVertices[face[0]].getSubtraction(this.transformedVertices[face[1]]); // first edge of this face
		var v2 = this.transformedVertices[face[2]].getSubtraction(this.transformedVertices[face[1]]); // second edge of this face

		var vCross = new Point((v1.y * v2.z - v1.z * v2.y), (v1.z * v2.x - v1.x * v2.z), (v1.x * v2.y - v1.y * v2.x)); // face normal vector
		vCross.normalize(); // unity face normal vector

		// return (vCross.x + vCross.y + vCross.z) * -0.57735; // simplification of normal and view vectors dot product (cos of the angle between normal and view (1, 1, -1) vectors)
		// TODO: FACE CULLING AND FACE LIGHTENING ARE DIFFERENT!!!! 17.03.2023
		return -vCross.z; // simplification of normal and view vectors dot product (cos of the angle between normal and view (1, 1, -1) vectors)
	}

	getColorRGB() {
		var tmp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.color);
		return {r: parseInt(tmp[1], 16), g: parseInt(tmp[2], 16), b: parseInt(tmp[3], 16)};
	}

	/* TODO: convert the data files from multiple edges polygons to tryangles meshes */
	render(context, width = 0, height = 0, flagShading = false) {
		var coords  = new Array();
		var offsetX = width  / 2;
		var offsetY = height / 2;

		var rgbColor = this.getColorRGB();

		this.transformedVertices.forEach((v) => {
			coords.push(new Point(1000 * v.x / v.z + offsetX, 1000 * v.y / v.z + offsetY, 1000 * v.z));
		});

		this.faces.forEach((f) => {
			var v = new Array();
			for(var i = 0; i < f.length; i++) {
				v.push(coords[f[i]]);
			}

			if(!flagShading) { // wireframes only
				polydraw(v, "#00cc00");
				return;
			}

			var faceLightening = this.calcFacelightening(f);
			if(faceLightening > 0) {
				var faceColor = new Array();
				faceColor[0] = Math.floor(rgbColor.r * faceLightening)
				faceColor[1] = Math.floor(rgbColor.g * faceLightening)
				faceColor[2] = Math.floor(rgbColor.b * faceLightening)
				polyfill(v, faceColor);
	    	}
		});
		if(flagShading) {
			context.putImageData(canvasBuffer, 0, 0);
		}
	}
}

function setPixel (x,y,z,r=0,g=0,b=0,a=255) {
    x = Math.round(x);
    y = Math.round(y);
    z = Math.round(z);

	if((x < 0) || (y < 0) || (x >= canvasBuffer.width) || (y >= canvasBuffer.height)) {
		return;
	}

	var offset = (y * canvasBuffer.width + x) * 4;

	var offset = (y * canvasBuffer.width + x);

	if(zBuffer[offset] <= z) {
		return;
	}
	zBuffer[offset] = z;

	offset *= 4;

	canvasBuffer.data[offset]   = r;
	canvasBuffer.data[offset+1] = g;
	canvasBuffer.data[offset+2] = b;
	canvasBuffer.data[offset+3] = a;	
}

function polydraw(vertexes, color) {
	context.beginPath();
	context.moveTo(vertexes[0].x,vertexes[0].y);
	for(var i = (vertexes.length - 1); i >= 0; i--) {
		context.lineTo(vertexes[i].x,vertexes[i].y);
	}
	context.closePath();
	context.strokeStyle = color;
	context.stroke();
}

// BUG: the junction of the 2 triangles sometimes has a flaw that is not filled, probable related to rounding in the setPixel function
async function polyfill(vertexes, color) // 3 or 4 vertexes only
{
	var top = 0;
	var bot = 0;
	var mid = 0;

	for(var i = 1; i < 3; i++) {
		if(vertexes[i].y < vertexes[top].y) {
			top = i;
		}
		if(vertexes[i].y > vertexes[bot].y) {
			bot = i;
		}
	}

	while ((mid == top) || (mid == bot)) {
		mid ++;
	}

  	var delta1 = vertexes[top].getSubtraction(vertexes[bot]);
  	var delta2 = vertexes[top].getSubtraction(vertexes[mid]);
  	var delta3 = vertexes[mid].getSubtraction(vertexes[bot]);

  	/* TOP -> MID */
    for (var y = vertexes[top].y; y <= vertexes[mid].y; y++) {
    	var pos_x1 = vertexes[top].x + (delta1.x * ((y-vertexes[top].y)/delta1.y));
    	var pos_x2 = vertexes[mid].x + (delta2.x * ((y-vertexes[mid].y)/delta2.y));
		//calc pos_z1 and pos_z2 as a function of y here
    	var pos_z1 = vertexes[top].z + (delta1.z * ((y-vertexes[top].y)/delta1.y));
    	var pos_z2 = vertexes[mid].z + (delta2.z * ((y-vertexes[mid].y)/delta2.y));

		// TODO: REMOVE "1 / (pos_x2 - pos_x1)" FROM INSIDE LOOP TO INCREASE PERFORMANCE
	    if(pos_x2 > pos_x1) {
	    	for(var x = pos_x1; x <= pos_x2; x++) {
				// calc z as a function of x here
				var z = (pos_x2 == pos_x1) ? pos_z1 : pos_z1 + (pos_z2 - pos_z1) * ((x - pos_x1) / (pos_x2 - pos_x1));
				// pass z as parameter here
			    setPixel(x,y,z,color[0], color[1], color[2]);
	    	}
	    }
	    else {
	    	for(var x = pos_x2; x <= pos_x1; x++) {
				// calc z as a function of x here
				var z = (pos_x2 == pos_x1) ? pos_z1 : pos_z1 + (pos_z1 - pos_z2) * ((x - pos_x2) / (pos_x1 - pos_x2));
			    setPixel(x,y,z,color[0],color[1],color[2]);
	    	}
	    }
    }

	/* MID -> BOT */
    for (var y = vertexes[mid].y; y <= vertexes[bot].y; y++) {
    	var pos_x1 = vertexes[top].x + (delta1.x * ((y-vertexes[top].y)/delta1.y));
    	var pos_x2 = vertexes[mid].x + (delta3.x * ((y-vertexes[mid].y)/delta3.y));
		//calc pos_z1 and pos_z2 as a function of y here
    	var pos_z1 = vertexes[top].z + (delta1.z * ((y-vertexes[top].y)/delta1.y));
    	var pos_z2 = vertexes[mid].z + (delta3.z * ((y-vertexes[mid].y)/delta3.y));

	    if(pos_x2 > pos_x1) {
	    	for(var x = pos_x1; x <= pos_x2; x++) {
				// calc z as a function of x here
				var z = (pos_x2 == pos_x1) ? pos_z1 : pos_z1 + (pos_z2 - pos_z1) * ((x - pos_x1) / (pos_x2 - pos_x1));				
			    setPixel(x,y,z,color[0],color[1],color[2]);
	    	}
	    }
	    else {
	    	for(var x = pos_x2; x <= pos_x1; x++) {
				// calc z as a function of x here
				var z = (pos_x2 == pos_x1) ? pos_z1 : pos_z1 + (pos_z1 - pos_z2) * ((x - pos_x2) / (pos_x1 - pos_x2));
			    setPixel(x,y,z,color[0],color[1],color[2]);
	    	}
	    }
    }

	if(vertexes.length === 4) {
		polyfill(new Array(vertexes[2], vertexes[3], vertexes[0]), color);
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
var canvasBuffer;
const zBuffer = new Float32Array(new ArrayBuffer(32 * canvasWidth * canvasHeight));

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transformVertices(null, angle);
	clearCanvas();
	clearZbuffer();
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

	canvasBuffer = context.getImageData(0,0,canvasHeight,canvasHeight);

	geometriesData.forEach((gd) => {
		geometries.push(new Geometry3D(JSON.parse(gd)));
	});

	setInterval(animationLoop,20);
}

function toogleShading() {
	flagShading = !flagShading;
}

function setGeometry(g) {
	currentGeometry = (null != g) ? geometries[g] : null;
	if (null == currentGeometry) {
		clearCanvas();
	}
	return currentGeometry;
}

function setGeometryColor(c) {
	if(null != currentGeometry)
	{
		currentGeometry.color = c;
	}
}

function clearCanvas()
{
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	canvasBuffer = context.getImageData(0,0,canvasHeight,canvasHeight);	
}

function clearZbuffer() {
	for(var i = 0; i< zBuffer.length; i++) {
		zBuffer[i] = 3.40282347e+38;  // Z axis increases with distance.
	}	
}