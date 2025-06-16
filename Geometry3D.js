class Geometry3D {
   constructor(gd) { // geometry data
      if(gd.file) {
         this.loadModelFromFile(gd.file);
      }
      else {
         this.vertices = gd.vertices.map((v) => ({ x: v[0], y: v[1], z: v[2] }));
         this.faces = gd.faces;
      }
      this.color = gd.color ? gd.color : "#969696";
      this.scale = gd.scale ? {x: gd.scale[0], y: gd.scale[1], z: gd.scale[2]} : {x: 1, y: 1, z: 1};
      this.translate = gd.translate ? {x: gd.translate[0], y: gd.translate[1], z: gd.translate[2]} : {x: 0, y: 0, z: 0};
      this.rotate = 0;
      this.transformedVertices = [];
   }

   // Add this method to handle async loading
   async loadModelFromFile(filePath) {
      const modelData = await threeDSLoader.loadFile(filePath);
      this.vertices = modelData.vertices.map(v => ({x: v[0], y: v[1], z: v[2]}));
      this.faces = modelData.faces;
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
      return (faceNormalVector.getDotProduct(cameraVector) > 0);
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