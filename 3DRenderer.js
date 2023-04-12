class Element3D {
   constructor(x = 0.0, y = 0.0, z = 0.0) {
      this.x = x;
      this.y = y;
      this.z = z;
   }

   getSubtraction(p) {
      return new Element3D(this.x - p.x, this.y - p.y, this.z - p.z);
   }

   getRounded(){
      return new Element3D(Math.round(this.x), Math.round(this.y), Math.round(this.z));
   }

   getModule() {
      return(Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
   }

   getCrossProduct (v) {
      return new Element3D((this.y * v.z - this.z * v.y), (this.z * v.x - this.x * v.z), (this.x * v.y - this.y * v.x));
   }

   normalize() {
      const inv_module = 1 / this.getModule();
      this.x *= inv_module;
      this.y *= inv_module;
      this.z *= inv_module;
   }
}

class Geometry3D {
   constructor(gd) { // geometry data
      this.vertices            = gd.vertices.map((v) => ({ x: v[0], y: v[1], z: v[2] }));
      this.faces               = gd.faces;
      this.color               = gd.color ? gd.color : "#969696";
      this.transformRotate     = 0;
      this.scale               = gd.scale ? {x: gd.scale[0], y: gd.scale[1], z: gd.scale[2]} : {x: 1, y: 1, z: 1};
      this.transformedVertices = [];
   }

   transformVertices(s = this.transformScale, r = this.transformRotate) {
      r = r * (Math.PI / 180); // azimuth angle
      s = (null == s) ? this.scale : s;
      this.transformedVertices = [];

      const camera = new Element3D(0,0,1500);

      var teta = 60 * (Math.PI / 180); // tilt angle
      var cos_teta = Math.cos(teta);
      var sin_teta = Math.sin(teta);

      var cos_alpha = Math.cos(r);
      var sin_alpha = Math.sin(r);

      // TODO: use transform matrix here instead of sepparate transformations, to increase performance
      this.vertices.forEach((v) => {
         // ROTATE ON Z - AZIMUTH
         var p = new Element3D(
            (v.x * cos_alpha - v.y * sin_alpha) * s.x,
            (v.x * sin_alpha + v.y * cos_alpha) * s.y,
            v.z * s.z
         );

         // ROTATE ON X - CAMERA TILT ANGLE
         var p2 = new Element3D(
            p.x,
            p.y * cos_teta + p.z * sin_teta,
            p.z * cos_teta - p.y * sin_teta // FASTER p.y * -sin_teta + p.z * cos_teta;
         );

         p2 = p2.getSubtraction(camera);
         
         this.transformedVertices.push(p2);         
      });
   }

   // BUG: Check why culling is glitching on cube and pyramid
   calcFacelightening(face) {
      var v1 = this.transformedVertices[face[0]].getSubtraction(this.transformedVertices[face[1]]); // first edge of this face
      var v2 = this.transformedVertices[face[2]].getSubtraction(this.transformedVertices[face[1]]); // second edge of this face

      var vCross = v1.getCrossProduct(v2); // face normal vector
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
         coords.push(new Element3D(1000 * v.x / v.z + offsetX, 1000 * v.y / v.z + offsetY, 1000 * v.z)); // TODO: recall why I am multiplying vertexes by 1000. Maybe camera distance/projection?
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
            faceColor.r = Math.floor(rgbColor.r * faceLightening);
            faceColor.g = Math.floor(rgbColor.g * faceLightening);
            faceColor.b = Math.floor(rgbColor.b * faceLightening);
            polyfill(v, faceColor);
          }
      });
      if(flagShading) {
         context.putImageData(canvasBuffer, 0, 0);
      }
   }
}

// BUG: zbuffer still glithching for minor distances (remove culling to see it better)
function setPixel (Element3D,color) {
    Element3D = Element3D.getRounded();

   if((Element3D.x < 0) || (Element3D.y < 0) || (Element3D.x >= canvasBuffer.width) || (Element3D.y >= canvasBuffer.height)) {
      return;
   }

   var offset = (Element3D.y * canvasBuffer.width + Element3D.x);

   if(zBuffer[offset] >= Element3D.z) {
      return;
   }
   zBuffer[offset] = Element3D.z;

   offset *= 4;

   canvasBuffer.data[offset]   = color.r;
   canvasBuffer.data[offset+1] = color.g;
   canvasBuffer.data[offset+2] = color.b;
   canvasBuffer.data[offset+3] = 255; // full opaque alpha
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

   // DEBUG ZBUFFER ---> contar o numero de faces e linhas pra pintar de vermelho linha que eu quero debugar !!!

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

      var pos_z1 = vertexes[top].z + (delta1.z * ((y-vertexes[top].y)/delta1.y));
      var pos_z2 = vertexes[mid].z + (delta2.z * ((y-vertexes[mid].y)/delta2.y));

      if(pos_x2 > pos_x1) {
         var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x2 - pos_x1);
         for(var x = pos_x1; x <= pos_x2; x++) {
            var z = pos_z1 + (pos_z2 - pos_z1) * ((x - pos_x1) * ratio);
            setPixel(new Element3D(x,y,z),color);
         }
      }
      else {
         var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x1 - pos_x2);
         for(var x = pos_x2; x <= pos_x1; x++) {
            var z = pos_z1 + (pos_z1 - pos_z2) * ((x - pos_x2) * ratio);
             setPixel(new Element3D(x,y,z),color);
         }
      }
   }

   /* MID -> BOT */
   for (var y = vertexes[mid].y; y <= vertexes[bot].y; y++) {
      var pos_x1 = vertexes[top].x + (delta1.x * ((y-vertexes[top].y)/delta1.y));
      var pos_x2 = vertexes[mid].x + (delta3.x * ((y-vertexes[mid].y)/delta3.y));

      var pos_z1 = vertexes[top].z + (delta1.z * ((y-vertexes[top].y)/delta1.y));
      var pos_z2 = vertexes[mid].z + (delta3.z * ((y-vertexes[mid].y)/delta3.y));

      if(pos_x2 > pos_x1) {
         var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x2 - pos_x1);
         for(var x = pos_x1; x <= pos_x2; x++) {
            var z = pos_z1 + (pos_z2 - pos_z1) * ((x - pos_x1) * ratio);            
            setPixel(new Element3D(x,y,z),color);
         }
      }
      else {
         var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x1 - pos_x2);
         for(var x = pos_x2; x <= pos_x1; x++) {
            var z = pos_z1 + (pos_z1 - pos_z2) * ((x - pos_x2) * ratio);
            setPixel(new Element3D(x,y,z),color);
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
var flagShading     = true;
var canvasBuffer;
const zBuffer = new Float32Array(new ArrayBuffer(32 * canvasWidth * canvasHeight));

// DEBUG var angle = 273;
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
   var canvasDiv = document.getElementById("canvasDiv");
   canvas = document.createElement("canvas");
   canvas.setAttribute("width", canvasWidth);
   canvas.setAttribute("height", canvasHeight);
   canvas.setAttribute("id", "canvas");
   canvasDiv.appendChild(canvas);
   if(typeof G_vmlCanvasManager != "undefined") {
      canvas = G_vmlCanvasManager.initElement(canvas);
   }

   context = document.getElementById("canvas").getContext("2d");

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
      zBuffer[i] = -3.40282347e+38;  // Z axis decreases with distance.
   }   
}