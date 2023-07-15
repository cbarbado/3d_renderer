// TODOS:
// - add translation to objects
// - add light vector
// - add ambient and difuse lighting
// - add camera position
// - add scenes with multiple objects
// - convert objects from vertices & faces to triangle meshes
// - read .3ds file formats

class Graphics {
   constructor(divID, elementID, width, height, updateLoop, refreshRate = 50) {
      this.canvas = document.createElement(elementID);
      this.canvas.setAttribute("width", width);
      this.canvas.setAttribute("height", height);
      this.canvas.setAttribute("id", elementID);
      document.getElementById(divID).appendChild(this.canvas);
      if(typeof G_vmlCanvasManager != "undefined") {
         this.canvas = G_vmlCanvasManager.initElement(canvas);
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
      for(let i = 0; i< this.zBuffer.length; i++) {
         this.zBuffer[i] = -3.40282347e+38;  // Z axis decreases with distance.
      }   
   }

   drawPoligon(vertexes, color) {
      this.context.beginPath();
      this.context.moveTo(vertexes[0].x,vertexes[0].y);
      for(let i = (vertexes.length - 1); i >= 0; i--) {
         this.context.lineTo(vertexes[i].x,vertexes[i].y);
      }
      this.context.closePath();
      this.context.strokeStyle = color;
      this.context.stroke();
   }

   fillHalf(v1, v2, v3, c) {
      let point = new Element3D();

      v1 = v1.getRounded();
      v2 = v2.getRounded();
      v3 = v3.getRounded();

      let d1 = v2.getSubtraction(v1);
      let d2 = v3.getSubtraction(v1);

      if(d1.y == 0 || d2.y == 0) {
         return;
      }

      let stepY = (v1.y > v2.y) ? -1 : 1;
      for (point.y = v1.y; point.y != (v2.y + stepY); point.y += stepY) {
         let pos_x1 = Math.round(v1.x + (d1.x * ((point.y-v1.y)/d2.y)));
         let pos_x2 = Math.round(v1.x + (d2.x * ((point.y-v1.y)/d2.y)));

         let pos_z1 = v1.z + (d1.z * ((point.y-v1.y)/d1.y));
         let pos_z2 = v1.z + (d2.z * ((point.y-v1.y)/d2.y));

         let stepX = (pos_x1 > pos_x2) ? -1 : 1;
         let ratio = (pos_x2 == pos_x1) ? 0 : 1 / (pos_x2 - pos_x1);
         for(point.x = pos_x1; point.x != (pos_x2 + stepX); point.x += stepX) {
            point.z = pos_z1 + (pos_z2 - pos_z1) * ((point.x - pos_x1) * ratio);
            this.setPixel(point,c);
         }
      }
   }   

   fillPolygon(vertexes, color) // 3 or 4 vertexes only
   {
      let top = 0;
      let bot = 0;
      let mid = 0;
   
      for(let i = 1; i < 3; i++) {
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
   
      let delta1 = vertexes[top].getSubtraction(vertexes[bot]);
      let delta2 = vertexes[top].getSubtraction(vertexes[mid]);
      let delta3 = vertexes[mid].getSubtraction(vertexes[bot]);

      let v3_x = Math.round(vertexes[top].x + (delta1.x * ((vertexes[mid].y-vertexes[top].y)/delta1.y)));
      let v3_z = Math.round(vertexes[top].z + (delta1.z * ((vertexes[mid].y-vertexes[top].y)/delta1.y)));

      this.fillHalf(vertexes[top], vertexes[mid], new Element3D(v3_x, vertexes[mid].y, v3_z), color);
      this.fillHalf(vertexes[bot], vertexes[mid], new Element3D(v3_x, vertexes[mid].y, v3_z), color);
  
      if(vertexes.length === 4) {
         this.fillPolygon(new Array(vertexes[2], vertexes[3], vertexes[0]), color);
      }
   }

   setPixel (point,color) {
      point = point.getRounded();

      if((point.x < 0) || (point.y < 0) || (point.x >= this.canvas.width) || (point.y >= this.canvas.height)) {
         return;
      }

      let offset = (point.y * this.canvas.width + point.x);

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

      let teta = 60 * (Math.PI / 180); // tilt angle
      let cos_teta = Math.cos(teta);
      let sin_teta = Math.sin(teta);

      let cos_alpha = Math.cos(r);
      let sin_alpha = Math.sin(r);

      // TODO: use transform matrix here instead of sepparate transformations, to increase performance
      this.vertices.forEach((v) => {
         let p = new Element3D( // ROTATE ON Z - AZIMUTH
            (v.x * cos_alpha - v.y * sin_alpha) * s.x,
            (v.x * sin_alpha + v.y * cos_alpha) * s.y,
            v.z * s.z
         );

         let p2 = new Element3D( // ROTATE ON X - CAMERA TILT ANGLE
            p.x,
            p.y * cos_teta + p.z * sin_teta,
            p.z * cos_teta - p.y * sin_teta // FASTER p.y * -sin_teta + p.z * cos_teta;
         );

         this.transformedVertices.push(p2.getSubtraction(camera));         
      });
   }

   calcFacelightening(face) {
      let v1 = this.transformedVertices[face[0]].getSubtraction(this.transformedVertices[face[1]]); // first edge of this face
      let v2 = this.transformedVertices[face[2]].getSubtraction(this.transformedVertices[face[1]]); // second edge of this face

      let vCross = v1.getCrossProduct(v2); // face normal vector
      vCross.normalize(); // unity face normal vector

      return -vCross.z; // simplification of normal and view vectors dot product (cos of the angle between normal and view (1, 1, -1) vectors)
   }

   getColorRGB() {
      const tmp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.color);
      return {r: parseInt(tmp[1], 16), g: parseInt(tmp[2], 16), b: parseInt(tmp[3], 16)};
   }

   /* TODO: convert the data files from multiple edges polygons to tryangles meshes */
   render(graphics, flagShading = false) {
      let coords    = [];
      const offsetX = graphics.canvas.width  / 2;
      const offsetY = graphics.canvas.height / 2;
      let rgbColor  = this.getColorRGB();

      this.transformedVertices.forEach((v) => {
         coords.push(new Element3D(1000 * v.x / v.z + offsetX, 1000 * v.y / v.z + offsetY, 1000 * v.z)); // TODO: recall why I am multiplying vertexes by 1000. Maybe camera distance/projection?
      });

      this.faces.forEach((f) => {
         let v = [];

         for(const vertice of f) {
            v.push(coords[vertice]);
         }

         if(!flagShading) { // wireframes only
            graphics.drawPoligon(v, "#00cc00");
            return;
         }

         let faceLightening = this.calcFacelightening(f);
         if(faceLightening > 0) {
            let faceColor = new Array();
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
   high_poly: [cube, cutcube, pyramid, chesspawn, cylinder, funnels, beads, cone, sphere, toroid, lgbeads, mechpart, rocket, grid].map((g) => (
      new Geometry3D(JSON.parse(g))
   )),
   low_poly: [cube_low, cutcube_low, pyramid_low, chesspawn_low, cylinder_low, funnels_low, beads_low, cone_low, sphere_low, toroid_low, lgbeads_low, mechpart_low, rocket_low, grid_low].map((g) => (
      new Geometry3D(JSON.parse(g))
   )),
};

let shapeIndex      = null;
let flagShading     = true;
let shapeResolution = "high_poly";
let graphics = null;

let angle = 0;
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