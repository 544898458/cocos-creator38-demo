import { Vec3, primitives } from "cc";
import { MeshCreator } from "./MeshCreator";

export class DynamicGeometry implements primitives.IDynamicGeometry {
    positions: Float32Array;
    normals?: Float32Array;
    colors?: Float32Array;
    uvs?: Float32Array;
    minPos?: { x: number; y: number; z: number; };
    maxPos?: { x: number; y: number; z: number; };
    indices?: Uint32Array;

    constructor(mesh: MeshCreator) {
        this.positions = new Float32Array(mesh.verticles.length * 3);
        this.normals = new Float32Array(mesh.verticles.length * 3);
        this.colors = new Float32Array(mesh.verticles.length * 4);
        this.uvs = new Float32Array(mesh.verticles.length * 2);
        this.indices = new Uint32Array(mesh.indices);

        this.minPos = {x: Infinity, y: Infinity, z: Infinity};
        this.maxPos = {x: -Infinity, y: -Infinity, z: -Infinity};

        for (let i = 0; i < mesh.verticles.length; i++) {
            const p = mesh.verticles[i];
            this.positions[i * 3] = p.x;
            this.positions[i * 3 + 1] = p.y;
            this.positions[i * 3 + 2] = p.z;
            if(mesh.normals.length > i) {
                const n = mesh.normals[i];
                this.normals[i * 3] = n.x;
                this.normals[i * 3 + 1] = n.y;
                this.normals[i * 3 + 2] = n.z;
            }else{
                this.normals[i * 3] = mesh.normal.x;
                this.normals[i * 3 + 1] = mesh.normal.y;
                this.normals[i * 3 + 2] = mesh.normal.z;
            }
            if(mesh.colors.length > i) {
                const c = mesh.colors[i];
                this.colors[i * 4] = c.r;
                this.colors[i * 4 + 1] = c.g;
                this.colors[i * 4 + 2] = c.b;
                this.colors[i * 4 + 3] = c.a;
            }else{
                this.colors[i * 4] = mesh.color.r;
                this.colors[i * 4 + 1] = mesh.color.g;
                this.colors[i * 4 + 2] = mesh.color.b;
                this.colors[i * 4 + 3] = mesh.color.a;
            }
            const uv = mesh.uvs[i];
            this.uvs[i * 2] = uv.x;
            this.uvs[i * 2 + 1] = uv.y;
            
            Vec3.min(this.minPos, p, this.minPos);
            Vec3.max(this.maxPos, p, this.maxPos);
        }
    }
}