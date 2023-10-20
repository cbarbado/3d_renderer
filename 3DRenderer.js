// TODOS:
// - add transform matrix
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

      this.lightVector = new Element3D(-1, -1, -1);

      setInterval(updateLoop,1000/refreshRate); // interval = 1000ms / refreshRate
   }

   updateCanvas() {
      this.context.putImageData(this.buffer, 0, 0);
   }

   setLightVector(p) {
      this.lightVector = p;
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
   
      let delta = vertexes[top].getSubtraction(vertexes[bot]);

      let v3_x = Math.round(vertexes[top].x + (delta.x * ((vertexes[mid].y-vertexes[top].y)/delta.y)));
      let v3_z = Math.round(vertexes[top].z + (delta.z * ((vertexes[mid].y-vertexes[top].y)/delta.y)));
      let midVertex = new Element3D(v3_x, vertexes[mid].y, v3_z);

      this.fillHalf(vertexes[top], vertexes[mid], midVertex, color);
      this.fillHalf(vertexes[bot], vertexes[mid], midVertex, color);
  
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

   getAddition(p) {
      return new Element3D(this.x + p.x, this.y + p.y, this.z + p.z);
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

   getDotProduct (v) {
      return ((this.x * v.x + this.y * v.y + this.z * v.z) / (this.getModule() * v.getModule()));
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
      this.translate           = gd.translate ? {x: gd.translate[0], y: gd.translate[1], z: gd.translate[2]} : {x: 0, y: 0, z: 0};
      this.rotate     = 0;
      this.transformedVertices = [];
   }

   transformVertices(t = this.translate, s = this.scale, r = this.rotate) {
      r = r * (Math.PI / 180); // azimuth angle
      s = (null == s) ? this.scale : s;
      t = (null == t) ? this.translate : t;
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

         let p3 = p2.getAddition(t);

         this.transformedVertices.push(p3.getSubtraction(camera));         
      });
   }

   getFaceNormalVector(face) {
      let v1 = this.transformedVertices[face[0]].getSubtraction(this.transformedVertices[face[1]]); // first edge of this face
      let v2 = this.transformedVertices[face[2]].getSubtraction(this.transformedVertices[face[1]]); // second edge of this face

      return (v1.getCrossProduct(v2));
   }

   checkBackFaceCulling(faceNormalVector, cameraVector) {
      return (faceNormalVector.getDotProduct(cameraVector) > 0 ? true : false);
   }

   calcFacelightening(faceNormalVector, lightVector) {
      return faceNormalVector.getDotProduct(lightVector);
   }

   getColorRGB() {
      let rgb = parseInt(this.color.substring(1), 16);
      return {r: (rgb >> 16) & 255, g: (rgb >> 8) & 255, b: rgb & 255};      
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

         let cameraVector = new Element3D(0, 0, -1); // TODO: Move cameraVector to Graphics class
         let faceNormalVector = this.getFaceNormalVector(f);

         if(this.checkBackFaceCulling(faceNormalVector, cameraVector)) {
            let faceLightening = this.calcFacelightening(faceNormalVector,graphics.lightVector);

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

   shapes[shapeResolution][shapeIndex].transformVertices(null, null, angle);
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

function setLightVector(x, y, z) {
   graphics.setLightVector (new Element3D(x,y,z));
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