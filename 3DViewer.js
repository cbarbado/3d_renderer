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
		this.vertices           = geometryData.vertices;
		this.faces              = geometryData.faces;
		this.transformRotate    = 0;
		this.transformScale     = 1;
		this.transformedVertices = new Array();
	}

	/* TEMPORARY CODE TO CONVERT FROM BOOK C FORMAT TO JAVASCRIPT JSON FORMAT */
	/* DONE: subtract 1 from the vertices indexes in the data files */
	/* DONE: remove headers from data files. they are not necessary in json format. */
	/* DONE: scale down vertices (0.0075) */
	/*
	convert() {
		var g = new Object();
		g.vertices = new Array();
		g.faces    = new Array();
		this.vertices.forEach((v) => {
			g.vertices.push(new Array(v[0] * 0.0075, v[1] * 0.0075, v[2] * 0.0075));
		});
		this.faces.forEach((f) => {
			var tmp = new Array(f[0] - 1, f[1] - 1, f[2] - 1);
			if(f.length > 3) {
				tmp.push(f[3] - 1);
			}			
			g.faces.push(tmp);
		});
		console.log(JSON.stringify(g));
	}
	*/	

	transformVertices(s = this.transformScale, r = this.transformRotate) {
		r = (r / 180) * 3.1415;
		this.transformedVertices = new Array();
		this.vertices.forEach((v) => {
			this.transformedVertices.push(new Point((v[0]*Math.cos(r)-v[1]*Math.sin(r))*s, (v[0]*Math.sin(r)+v[1]*Math.cos(r))*s, v[2]*s));
		});
	}

	calcFacelightening(face) {
		var v1 = this.transformedVertices[face[0]].getSubtraction(this.transformedVertices[face[1]]); // first edge of this face
		var v2 = this.transformedVertices[face[2]].getSubtraction(this.transformedVertices[face[1]]); // second edge of this face

		var vCross = new Point((v1.y * v2.z - v1.z * v2.y), (v1.z * v2.x - v1.x * v2.z), (v1.x * v2.y - v1.y * v2.x)); // face normal vector
		vCross.normalize(); // unity face normal vector

		return (vCross.x + vCross.y + vCross.z) * -0.57735; // simplification of normal and view vectors dot product (cos of the angle between normal and view (1, 1, -1) vectors)
	}

	/* TODO: convert the data files from multiple edges polygons to tryangles meshes */
	render(context, width = 0, height = 0, flagShading = false) {
		var coords = new Array();
		var offsetX = width / 2;
		var offsetY = height / 2;
		this.transformedVertices.forEach((v) => {
			// TODO: add Z projection formula to enable ZBuffer implementation -- maybe just keep v.z value would work???
			coords.push(new Point(v.x * 0.707 + v.y * -0.707 + offsetX, v.x * 0.409 + v.y * 0.409 - v.z * 0.816 + offsetY, v.z));
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
				faceLightening = Math.floor(255 * faceLightening);
				polyfill(v, faceLightening);
	    	}
		});
		if(flagShading) {
			context.putImageData(canvasBuffer, 0, 0);
		}
	}
}

function setPixel (x,y,r=0,g=0,b=0,a=255) {
    x = Math.round(x);
    y = Math.round(y);

	if((x < 0) || (y < 0) || (x >= canvasBuffer.width) || (y >= canvasBuffer.height)) {
		return;
	}

	var offset = (y * canvasBuffer.width + x) * 4;
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

  	/* TOP -> MID */
  	var delta1 = vertexes[top].getSubtraction(vertexes[bot]);
  	var delta2 = vertexes[top].getSubtraction(vertexes[mid]);
  	var delta3 = vertexes[mid].getSubtraction(vertexes[bot]);

    for (var y = vertexes[top].y; y <= vertexes[mid].y; y++) {
    	var pos_x1 = vertexes[top].x + (delta1.x * ((y-vertexes[top].y)/delta1.y));
    	var pos_x2 = vertexes[mid].x + (delta2.x * ((y-vertexes[mid].y)/delta2.y));

	    if(pos_x2 > pos_x1) {
	    	for(var x = pos_x1; x <= pos_x2; x++) {
			    setPixel(x,y,color, color, color);
	    	}
	    }
	    else {
	    	for(var x = pos_x2; x <= pos_x1; x++) {
			    setPixel(x,y,color,color,color);
	    	}
	    }
    }

    /* MID -> BOT */
    for (var y = vertexes[mid].y; y <= vertexes[bot].y; y++) {
    	var pos_x1 = vertexes[top].x + (delta1.x * ((y-vertexes[top].y)/delta1.y));
    	var pos_x2 = vertexes[mid].x + (delta3.x * ((y-vertexes[mid].y)/delta3.y));

	    if(pos_x2 > pos_x1) {
	    	for(var x = pos_x1; x <= pos_x2; x++) {
			    setPixel(x,y,color,color,color);
	    	}
	    }
	    else {
	    	for(var x = pos_x2; x <= pos_x1; x++) {
			    setPixel(x,y,color,color,color);
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

var angle = 0;
function animationLoop() {
	if(currentGeometry == null) return;

	currentGeometry.transformVertices(1, angle);
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
	canvasBuffer = context.getImageData(0,0,canvasHeight,canvasHeight);	
}