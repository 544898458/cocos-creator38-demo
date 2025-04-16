import { Color, Mesh, Vec2, Vec3, gfx, primitives, utils } from "cc";
import { StaticGeometry } from "./StaticGeometry";
import { colorPool, vec2Pool, vec3Pool } from "./MathUtils";
import { DynamicGeometry } from "./DynamicGeometry";

export class MeshCreator {
    public verticles: Vec3[] = [];
    public colors: Color[] = [];
    public indices: number[] = [];
    public uvs: Vec2[] = [];
    public normals: Vec3[] = [];

    public normal: Vec3 = new Vec3(0, 1, 0);
    public color: Color = new Color(1, 1, 1, 1);

    public isDynamic = false;
    public meshIndex = 0;
    private _mesh: Mesh = null;

    constructor(isDynamic: boolean, meshIndex: number = 0) {
        this.isDynamic = isDynamic;
        this.meshIndex = meshIndex;
    }

    public reset() {
        for(let i = 0; i < this.verticles.length; i++) {
            vec3Pool.free(this.verticles[i]);
        }
        for(let i = 0; i < this.normals.length; i++) {
            vec3Pool.free(this.normals[i]);
        }
        for(let i = 0; i < this.uvs.length; i++) {
            vec2Pool.free(this.uvs[i]);
        }
        for(let i = 0; i < this.colors.length; i++) {
            colorPool.free(this.colors[i]);
        }

        this.verticles.length = 0;
        this.colors.length = 0;
        this.indices.length = 0;
        this.uvs.length = 0;
        this.normals.length = 0;
    }

    public buildMesh() {
        if(!this.isDynamic) {
            if(this._mesh != null) {
                this._mesh.destroy();
                this._mesh = null;
            }
            this._mesh = new Mesh();
            utils.MeshUtils.createMesh(new StaticGeometry(this), this._mesh);
        }else{
            if(this._mesh == null) {
                this._mesh = new Mesh();
            }
            utils.MeshUtils.createDynamicMesh(this.meshIndex, new DynamicGeometry(this), this._mesh);
        }

        return this._mesh;
    }

    public copyFrom(other: MeshCreator) {
        this.reset();

        other.verticles.forEach(v => {
            this.verticles.push(vec3Pool.alloc().set(v));
        });

        other.colors.forEach(c => {
            this.colors.push(colorPool.alloc().set(c));
        });

        other.indices.forEach(i => {
            this.indices.push(i);
        });

        other.uvs.forEach(uv => {
            this.uvs.push(vec2Pool.alloc().set(uv));
        });

        other.normals.forEach(n => {
            this.normals.push(vec3Pool.alloc().set(n));
        });
    }
}