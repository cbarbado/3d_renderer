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
