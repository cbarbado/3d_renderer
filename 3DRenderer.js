class Graphics {
   constructor(divID, elementID, width, height, updateLoop, refreshRate = 50) {
      this.canvas = document.createElement(elementID);
      this.canvas.setAttribute("width", width);
      this.canvas.setAttribute("height", height);
      this.canvas.setAttribute("id", elementID);
      document.getElementById(divID).appendChild(this.canvas);
      if(typeof G_vmlCanvasManager != "undefined") {
         canvas = G_vmlCanvasManager.initElement(canvas);
      }

      this.context = this.canvas.getContext("2d");
      this.buffer  = this.context.getImageData(0,0,width,height);
      this.zBuffer = new Float32Array(new ArrayBuffer(32 * width * height));

      setInterval(updateLoop,1000/refreshRate); // interval = 1000ms / refreshRate
   }

   updateCanvas() {
      this.context.putImageData(this.buffer, 0, 0);
   }

   clearCanvas()
   {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.buffer = this.context.getImageData(0,0,this.canvas.width,this.canvas.height);
   }
   
   clearZbuffer() {
      for(var i = 0; i< this.zBuffer.length; i++) {
         this.zBuffer[i] = -3.40282347e+38;  // Z axis decreases with distance.
      }   
   }

   drawPoligon(vertexes, color) {
      this.context.beginPath();
      this.context.moveTo(vertexes[0].x,vertexes[0].y);
      for(var i = (vertexes.length - 1); i >= 0; i--) {
         this.context.lineTo(vertexes[i].x,vertexes[i].y);
      }
      this.context.closePath();
      this.context.strokeStyle = color;
      this.context.stroke();
   }
   
   // BUG: the junction of the 2 triangles sometimes has a flaw that is not filled, probable related to rounding in the setPixel function
   fillPolygon(vertexes, color) // 3 or 4 vertexes only
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
      var point = new Element3D();
      for (point.y = vertexes[top].y; point.y <= vertexes[mid].y; point.y++) {
         var pos_x1 = vertexes[top].x + (delta1.x * ((point.y-vertexes[top].y)/delta1.y));
         var pos_x2 = vertexes[mid].x + (delta2.x * ((point.y-vertexes[mid].y)/delta2.y));
   
         var pos_z1 = vertexes[top].z + (delta1.z * ((point.y-vertexes[top].y)/delta1.y));
         var pos_z2 = vertexes[mid].z + (delta2.z * ((point.y-vertexes[mid].y)/delta2.y));
   
         if(pos_x2 > pos_x1) {
            var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x2 - pos_x1);
            for(point.x = pos_x1; point.x <= pos_x2; point.x++) {
               point.z = pos_z1 + (pos_z2 - pos_z1) * ((point.x - pos_x1) * ratio);
               this.setPixel(point,color);
            }
         }
         else {
            var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x1 - pos_x2);
            for(point.x = pos_x2; point.x <= pos_x1; point.x++) {
               point.z = pos_z1 + (pos_z1 - pos_z2) * ((point.x - pos_x2) * ratio);
               this.setPixel(point,color);
            }
         }
      }
   
      /* MID -> BOT */
      for (point.y = vertexes[mid].y; point.y <= vertexes[bot].y; point.y++) {
         var pos_x1 = vertexes[top].x + (delta1.x * ((point.y-vertexes[top].y)/delta1.y));
         var pos_x2 = vertexes[mid].x + (delta3.x * ((point.y-vertexes[mid].y)/delta3.y));
   
         var pos_z1 = vertexes[top].z + (delta1.z * ((point.y-vertexes[top].y)/delta1.y));
         var pos_z2 = vertexes[mid].z + (delta3.z * ((point.y-vertexes[mid].y)/delta3.y));
   
         if(pos_x2 > pos_x1) {
            var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x2 - pos_x1);
            for(point.x = pos_x1; point.x <= pos_x2; point.x++) {
               point.z = pos_z1 + (pos_z2 - pos_z1) * ((point.x - pos_x1) * ratio);            
               this.setPixel(point,color);
            }
         }
         else {
            var ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x1 - pos_x2);
            for(point.x = pos_x2; point.x <= pos_x1; point.x++) {
               point.z = pos_z1 + (pos_z1 - pos_z2) * ((point.x - pos_x2) * ratio);
               this.setPixel(point,color);
            }
         }
      }
   
      if(vertexes.length === 4) {
         this.fillPolygon(new Array(vertexes[2], vertexes[3], vertexes[0]), color);
      }
   }

   // BUG: zbuffer still glithching for minor distances (remove culling to see it better) // check cube at 273 degress
   setPixel (point,color) {
      point = point.getRounded();

      if((point.x < 0) || (point.y < 0) || (point.x >= this.canvas.width) || (point.y >= this.canvas.height)) {
         return;
      }

      var offset = (point.y * this.canvas.width + point.x);

      if(this.zBuffer[offset] >= point.z) {
         return;
      }
      this.zBuffer[offset] = point.z;

      offset *= 4;

      this.buffer.data[offset]   = color.r;
      this.buffer.data[offset+1] = color.g;
      this.buffer.data[offset+2] = color.b;
      this.buffer.data[offset+3] = 255; // full opaque alpha
   }
}

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
      this.scale               = gd.scale ? {x: gd.scale[0], y: gd.scale[1], z: gd.scale[2]} : {x: 1, y: 1, z: 1};
      this.transformRotate     = 0;
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
         var p = new Element3D( // ROTATE ON Z - AZIMUTH
            (v.x * cos_alpha - v.y * sin_alpha) * s.x,
            (v.x * sin_alpha + v.y * cos_alpha) * s.y,
            v.z * s.z
         );

         var p2 = new Element3D( // ROTATE ON X - CAMERA TILT ANGLE
            p.x,
            p.y * cos_teta + p.z * sin_teta,
            p.z * cos_teta - p.y * sin_teta // FASTER p.y * -sin_teta + p.z * cos_teta;
         );

         this.transformedVertices.push(p2.getSubtraction(camera));         
      });
   }

   // BUG: Check why zBuffer is glitching on cube and pyramid // Culling is OK. It glitches because of perspective distortion.
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
      const tmp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.color);
      return {r: parseInt(tmp[1], 16), g: parseInt(tmp[2], 16), b: parseInt(tmp[3], 16)};
   }

   /* TODO: convert the data files from multiple edges polygons to tryangles meshes */
   render(graphics, flagShading = false) {
      var coords    = [];
      const offsetX = graphics.canvas.width  / 2;
      const offsetY = graphics.canvas.height / 2;
      var rgbColor  = this.getColorRGB();

      this.transformedVertices.forEach((v) => {
         coords.push(new Element3D(1000 * v.x / v.z + offsetX, 1000 * v.y / v.z + offsetY, 1000 * v.z)); // TODO: recall why I am multiplying vertexes by 1000. Maybe camera distance/projection?
      });

      this.faces.forEach((f) => {
         var v = [];
         for(var i = 0; i < f.length; i++) {
            v.push(coords[f[i]]);
         }

         if(!flagShading) { // wireframes only
            graphics.drawPoligon(v, "#00cc00");
            return;
         }

         var faceLightening = this.calcFacelightening(f);
         if(faceLightening > 0) {
            var faceColor = new Array();
            faceColor.r = Math.floor(rgbColor.r * faceLightening);
            faceColor.g = Math.floor(rgbColor.g * faceLightening);
            faceColor.b = Math.floor(rgbColor.b * faceLightening);
            graphics.fillPolygon(v, faceColor);
          }
      });
      if(flagShading) {
         graphics.updateCanvas();
      }
   }
}

const shapes = { // TODO: Change from 2 shapes arrays to a single array of shapes, putting high and low inside shape object!!!
   high_poly: [cube, pyramid, chesspawn, cylinder, funnels, beads, cone, sphere, toroid, lgbeads, mechpart, rocket, grid].map((g) => (
      new Geometry3D(JSON.parse(g))
   )),
   low_poly: [cube_low, pyramid_low, chesspawn_low, cylinder_low, funnels_low, beads_low, cone_low, sphere_low, toroid_low, lgbeads_low, mechpart_low, rocket_low, grid_low].map((g) => (
      new Geometry3D(JSON.parse(g))
   )),
};

var shapeIndex      = null;
var flagShading     = true;
var shapeResolution = "high_poly";
var graphics = null;

var angle = 0;
// DEBUG var angle = 273;
function animate() { // TODO: pass function pointer as parameter to graphics init?
   if(shapeIndex == null) return;

   shapes[shapeResolution][shapeIndex].transformVertices(null, angle);
   graphics.clearCanvas();
   graphics.clearZbuffer();
   shapes[shapeResolution][shapeIndex].render(graphics, flagShading);

   angle = (angle + 1) % 360;
}

function initGraphics(canvasDiv, canvasElement, width, height, refreshRate)
{
   graphics = new Graphics(canvasDiv, canvasElement, width, height, animate, refreshRate);
}

function toogleShading() {
   flagShading = !flagShading;
}

function toogleShapeResolution() {
   shapeResolution = shapeResolution === "low_poly" ? "high_poly" : "low_poly";
}

function setShape(g) {
   shapeIndex = g;   
   if (null === g) {
      graphics.clearCanvas();
   }
   return shapes[shapeResolution][shapeIndex];
}

function setShapeColor(c) {
   if(null !== shapeIndex)
   {
      shapes["low_poly"][shapeIndex].color  = c;
      shapes["high_poly"][shapeIndex].color = c;
   }
}