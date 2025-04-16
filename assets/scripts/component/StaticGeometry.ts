import { Vec3, primitives } from "cc";
import { MeshCreator } from "./MeshCreator";
import { gfx } from "cc";


export class StaticGeometry implements primitives.IGeometry {
    positions: number[];
    normals?: number[];
    colors?: number[];
    uvs?: number[];
    minPos?: { x: number; y: number; z: number; };
    maxPos?: { x: number; y: number; z: number; };
    indices?: number[];
    primitiveMode: gfx.PrimitiveMode = gfx.PrimitiveMode.TRIANGLE_FAN
    attributes: gfx.Attribute[] = [new gfx.Attribute(gfx.AttributeName.ATTR_NORMAL,gfx.Format.RGB32F)];
    constructor(mesh: MeshCreator) {
        this.positions = [];
        this.normals = [];
        this.colors = [];
        this.uvs = [];
        this.indices = [];
        this.minPos = { x: Infinity, y: Infinity, z: Infinity };
        this.maxPos = { x: -Infinity, y: -Infinity, z: -Infinity };

        for (let i = 0; i < mesh.verticles.length; i++) {
            const p = mesh.verticles[i];
            this.positions.push(p.x, p.y, p.z);
            if (mesh.normals.length > i) {
                const n = mesh.normals[i];
                this.normals.push(n.x, n.y, n.z);
            } else {
                this.normals.push(mesh.normal.x, mesh.normal.y, mesh.normal.z);
            }
            if (mesh.colors.length > i) {
                const c = mesh.colors[i];
                this.colors.push(c.r, c.g, c.b, c.a);
            } else {
                this.colors.push(mesh.color.r, mesh.color.g, mesh.color.b, mesh.color.a);
            }
            const uv = mesh.uvs[i];
            this.uvs.push(uv.x, uv.y);

            Vec3.min(this.minPos, p, this.minPos);
            Vec3.max(this.maxPos, p, this.maxPos);
        }
        this.indices.push(...mesh.indices);
    }
} 