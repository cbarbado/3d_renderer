class ThreeDSLoader {
    constructor() {
        // 3DS file format chunk IDs
        this.MAIN3DS     = 0x4D4D;
        this.EDIT3DS     = 0x3D3D;
        this.EDIT_OBJECT = 0x4000;
        this.OBJ_TRIMESH = 0x4100;
        this.TRI_VERTEXL = 0x4110;
        this.TRI_FACEL1  = 0x4120;
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
            const subChunkId     = dataView.getUint16(offset, true);
            const subChunkLength = dataView.getUint32(offset + 2, true);
            
            if (subChunkId === this.EDIT3DS) {
                // Parse editor chunk
                const editorObjects = this.parseEditorChunk(dataView, offset + 6, offset + subChunkLength);
                objects.push(...editorObjects);
            }
            
            offset += subChunkLength;
        }

        if (objects.length <= 0) {
            throw new Error('No 3D objects found in file');
        }

        return this.convertToGeometryFormat(objects[0]);
    }

    parseEditorChunk(dataView, startOffset, endOffset) {
        let offset = startOffset;
        const objects = [];
        
        while (offset < endOffset) {
            const chunkId     = dataView.getUint16(offset, true);
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
            const chunkId     = dataView.getUint16(offset, true);
            const chunkLength = dataView.getUint32(offset + 2, true);
            
            if (chunkId === this.OBJ_TRIMESH) {
                this.parseTriMeshChunk(dataView, offset + 6, offset + chunkLength, object); // Parse triangular mesh
            }
            
            offset += chunkLength;
        }
        
        return object.vertices.length > 0 ? object : null;
    }

    parseTriMeshChunk(dataView, startOffset, endOffset, object) {
        let offset = startOffset;
        
        while (offset < endOffset) {
            const chunkId     = dataView.getUint16(offset, true);
            const chunkLength = dataView.getUint32(offset + 2, true);
            
            if (chunkId === this.TRI_VERTEXL) {
                this.parseVertexList(dataView, offset + 6, object); // Parse vertex list
            } else if (chunkId === this.TRI_FACEL1) {
                this.parseFaceList(dataView, offset + 6, object);   // Parse face list
            }
            
            offset += chunkLength;
        }
    }

    parseVertexList(dataView, offset, object) {
        const vertexCount = dataView.getUint16(offset, true);
        offset += 2;
        
        for (let i = 0; i < vertexCount; i++) {
            object.vertices.push([dataView.getFloat32(offset, true), dataView.getFloat32(offset + 4, true), dataView.getFloat32(offset + 8, true)]);
            offset += 12;
        }
    }

    parseFaceList(dataView, offset, object) {
        const faceCount = dataView.getUint16(offset, true);
        offset += 2;
        
        for (let i = 0; i < faceCount; i++) {
            object.faces.push([dataView.getUint16(offset, true), dataView.getUint16(offset + 2, true), dataView.getUint16(offset + 4, true)]);
            dataView.getUint16(offset + 6, true); // Face info flags (skip)
            offset += 8;
        }
    }

    convertToGeometryFormat(object) {
        // Convert to the format expected by Geometry3D class
        return {
            vertices: object.vertices,
            faces: object.faces,
        };
    }
}

// Global instance for easy access
const threeDSLoader = new ThreeDSLoader();

