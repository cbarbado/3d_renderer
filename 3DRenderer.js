// TODOS:
// - add transform matrix
// - add ambient and difuse lighting
// - add camera position
// - add scenes with multiple objects
// - convert objects from vertices & faces to triangle meshes
// ✓ read .3ds file formats
// ✓ extend the JSON geometry format to point to external 3DS files for vertices and faces

const shapes = { // TODO: Change from 2 shapes arrays to a single array of shapes, putting high and low inside shape object!!!
   high_poly: [cube, cutcube, pyramid, chesspawn, cylinder, funnels, beads, cone, sphere, toroid, lgbeads, mechpart, rocket, grid, dragon].map((g) => (
      new Geometry3D(JSON.parse(g))
   )),
   low_poly: [cube_low, cutcube_low, pyramid_low, chesspawn_low, cylinder_low, funnels_low, beads_low, cone_low, sphere_low, toroid_low, lgbeads_low, mechpart_low, rocket_low, grid_low, dragon_low].map((g) => (
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

   let currentShape;
   currentShape = shapes[shapeResolution][shapeIndex];

   if (currentShape) {
      currentShape.transformVertices(null, null, angle);
      graphics.clearCanvas();
      graphics.clearZbuffer();
      currentShape.render(graphics, flagShading);
   }

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
      return null;
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



