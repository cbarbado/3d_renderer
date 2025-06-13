class ThreeDSLoader {
    constructor() {
        // 3DS file format chunk IDs
        this.MAIN3DS = 0x4D4D;
        this.EDIT3DS = 0x3D3D;
        this.EDIT_OBJECT = 0x4000;
        this.OBJ_TRIMESH = 0x4100;
        this.TRI_VERTEXL = 0x4110;
        this.TRI_FACEL1 = 0x4120;
    }

    async loadFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load 3DS file: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return this.parse3DS(arrayBuffer);
        } catch (error) {
            console.error('Error loading 3DS file:', error);
            throw error;
        }
    }

    parse3DS(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        let offset = 0;
        
        // Read main chunk header
        const chunkId = dataView.getUint16(offset, true); // little endian
        const chunkLength = dataView.getUint32(offset + 2, true);
        
        if (chunkId !== this.MAIN3DS) {
            throw new Error('Invalid 3DS file: Missing main chunk');
        }
        
        offset += 6; // Skip chunk header
        
        const objects = [];
        
        // Parse chunks within main chunk
        while (offset < chunkLength) {
            const subChunkId = dataView.getUint16(offset, true);
            const subChunkLength = dataView.getUint32(offset + 2, true);
            
            if (subChunkId === this.EDIT3DS) {
                // Parse editor chunk
                const editorObjects = this.parseEditorChunk(dataView, offset + 6, offset + subChunkLength);
                objects.push(...editorObjects);
            }
            
            offset += subChunkLength;
        }
        
        // Return the first object found (assuming single object file)
        if (objects.length > 0) {
            return this.convertToGeometryFormat(objects[0]);
        } else {
            throw new Error('No 3D objects found in file');
        }
    }

    parseEditorChunk(dataView, startOffset, endOffset) {
        let offset = startOffset;
        const objects = [];
        
        while (offset < endOffset) {
            const chunkId = dataView.getUint16(offset, true);
            const chunkLength = dataView.getUint32(offset + 2, true);
            
            if (chunkId === this.EDIT_OBJECT) {
                // Parse object chunk
                const object = this.parseObjectChunk(dataView, offset + 6, offset + chunkLength);
                if (object) {
                    objects.push(object);
                }
            }
            
            offset += chunkLength;
        }
        
        return objects;
    }

    parseObjectChunk(dataView, startOffset, endOffset) {
        let offset = startOffset;
        
        // Read object name (ASCIIZ string)
        let objectName = '';
        while (offset < endOffset && dataView.getUint8(offset) !== 0) {
            objectName += String.fromCharCode(dataView.getUint8(offset));
            offset++;
        }
        offset++; // Skip null terminator
        
        const object = {
            name: objectName,
            vertices: [],
            faces: []
        };
        
        // Parse sub-chunks
        while (offset < endOffset) {
            const chunkId = dataView.getUint16(offset, true);
            const chunkLength = dataView.getUint32(offset + 2, true);
            
            if (chunkId === this.OBJ_TRIMESH) {
                // Parse triangular mesh
                this.parseTriMeshChunk(dataView, offset + 6, offset + chunkLength, object);
            }
            
            offset += chunkLength;
        }
        
        return object.vertices.length > 0 ? object : null;
    }

    parseTriMeshChunk(dataView, startOffset, endOffset, object) {
        let offset = startOffset;
        
        while (offset < endOffset) {
            const chunkId = dataView.getUint16(offset, true);
            const chunkLength = dataView.getUint32(offset + 2, true);
            
            if (chunkId === this.TRI_VERTEXL) {
                // Parse vertex list
                this.parseVertexList(dataView, offset + 6, object);
            } else if (chunkId === this.TRI_FACEL1) {
                // Parse face list
                this.parseFaceList(dataView, offset + 6, object);
            }
            
            offset += chunkLength;
        }
    }

    parseVertexList(dataView, offset, object) {
        const vertexCount = dataView.getUint16(offset, true);
        offset += 2;
        
        for (let i = 0; i < vertexCount; i++) {
            const x = dataView.getFloat32(offset, true);
            const y = dataView.getFloat32(offset + 4, true);
            const z = dataView.getFloat32(offset + 8, true);
            
            object.vertices.push([x, y, z]);
            offset += 12;
        }
    }

    parseFaceList(dataView, offset, object) {
        const faceCount = dataView.getUint16(offset, true);
        offset += 2;
        
        for (let i = 0; i < faceCount; i++) {
            const a = dataView.getUint16(offset, true);
            const b = dataView.getUint16(offset + 2, true);
            const c = dataView.getUint16(offset + 4, true);
            dataView.getUint16(offset + 6, true); // Face info flags (skip)
            
            object.faces.push([a, b, c]);
            offset += 8;
        }
    }

    convertToGeometryFormat(object) {
        // Convert to the format expected by Geometry3D class
        return {
            vertices: object.vertices,
            faces: object.faces,
            color: "#FF6B35", // Orange color for the dragon
            // scale: [5.3, 5.3, 5.3], // Scale up the model 3x (0.1 * 3 = 0.3)
            scale: [10, 10, 10], // Scale up the model 3x (0.1 * 3 = 0.3)
            translate: [0, -80, 0]
        };
    }
}

// Global instance for easy access
const threeDSLoader = new ThreeDSLoader();
