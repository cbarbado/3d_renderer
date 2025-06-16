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

