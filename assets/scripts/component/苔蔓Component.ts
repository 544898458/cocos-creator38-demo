import { primitives } from 'cc';
import { gfx } from 'cc';
import { utils } from 'cc';
import { _decorator, Component, Node, Mesh, Vec3, Vec2, Material, geometry, MeshRenderer } from 'cc';
import { MeshCreator } from './MeshCreator';
import { vec2Pool, vec3Pool } from './MathUtils';
import { Texture } from '../../../extensions/extensions_mesh/@types/packages/engine-extends/@types/glTF';
import { assetManager } from 'cc';
import { Texture2D } from 'cc';
import { ImageAsset } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('苔蔓Component')
export class 苔蔓Component extends Component {
    @property({ type: Material })
    material: Material = null;

    @property
    radius: number = 1; // 圆的半径

    @property
    segments: number = 6; // 圆的分割段数，影响圆的平滑度

    _meshCreator: MeshCreator = new MeshCreator(false);
    start() {
        this.createCircleMesh();

    }

    createCircleMesh() {
        // const vertices: Vec3[] = [];
        const vertices2: number[] = [];
        const uvs: Vec2[] = [];
        const indices: number[] = [];
        this._meshCreator.reset();

        // 中心点
        // vertices.push(new Vec3(0, 0, 0))//, new Vec2(0.5, 0.5));
        uvs.push(new Vec2(0.5, 0.5));
        vertices2.push(0, 0, 0);
        {
            let p = vec3Pool.alloc().set(0, 0, 0);
            // this._meshCreator.verticles.push(p);
        }
        // 圆周上的顶点
        for (let i = 0; i < this.segments; i++) {
            const angle = (i / this.segments) * Math.PI * 2;
            const x = Math.cos(angle) * this.radius;
            const z = Math.sin(angle) * this.radius;
            const posWorld节点 = this.node.getWorldPosition(this.node.position);
            const posWorld顶点 = new Vec3(x, 0, z).add(posWorld节点);

            // vertices.push(.add3f(posWorld.x, 0, posWorld.z));
            let 地板半边长 = 100
            let uv = new Vec2(0.5 + posWorld顶点.x / (2 * 地板半边长), 0.5 + posWorld顶点.z / (2 * 地板半边长))
            uvs.push(uv);
            vertices2.push(x, 0, z);
            // console.log('点', x, z);
            let p = vec3Pool.alloc().set(x, 0, z);
            this._meshCreator.verticles.push(p);
            this._meshCreator.uvs.push(uv);
        }

        // 索引
        for (let i = 1; i < this.segments - 1; i++) {
            indices.push(0, i + 1, i);
            this._meshCreator.indices.push(0, i + 1, i);
            // this._meshCreator.indices.push(i-1);    
        }
        // let config: primitives.IGeometry = { positions: vertices2,indices:indices, uvs: uvs.map(v => [v.x, v.y]).flat(),  primitiveMode: gfx.PrimitiveMode.TRIANGLE_FAN }
        // let config: primitives.IGeometry = { positions: vertices2}
        // let mesh: Mesh = utils.MeshUtils.createMesh(config)
        // console.log("mesh", mesh);
        // mesh.setVertices(vertices);
        // mesh.setIndices(indices);
        // mesh.setPrimitiveType(geometry.PrimitiveMode.TRIANGLE_FAN);


        let p0 = vec3Pool.alloc().set(0, 0, 0);

        let p1 = vec3Pool.alloc().set(1, 0, 0);

        let p2 = vec3Pool.alloc().set(1, 0, 1);

        let p3 = vec3Pool.alloc().set(0, 0, 1);
        let p4 = vec3Pool.alloc().set(-1, 0, 0);

        // this._meshCreator.verticles.push(p0, p1, p2, p3, p4);

        let uv0 = vec2Pool.alloc().set(0, 0);

        let uv1 = vec2Pool.alloc().set(1, 0);

        let uv2 = vec2Pool.alloc().set(1, 1);

        let uv3 = vec2Pool.alloc().set(0, 1);
        let uv4 = vec2Pool.alloc().set(0.5, 1);

        // this._meshCreator.uvs.push(uv0, uv1, uv2, uv3, uv4);



        // this._meshCreator.indices.push(0, 2, 1, 0, 3, 2, 0, 4, 3);    

        let mesh: Mesh = this._meshCreator.buildMesh();

        const meshRenderer = this.node.getComponent(MeshRenderer);
        // if (meshRenderer) 
        {
            meshRenderer.mesh = mesh;
            meshRenderer.material = this.material;
        }
        assetManager.loadRemote('https://www.rtsgame.online/图片/苔蔓1024.png', (err, imageAsset: ImageAsset) => {
            console.log('苔蔓贴图resources.load callback:', err, imageAsset)
            // console.log(this.material.getProperty('albedoMap'))
            // console.log(this.material.getProperty('mainTexture'))
            let texture:Texture2D = this.material.getProperty('mainTexture') as Texture2D
            texture.image = imageAsset;
            console.log(texture)
            this.material.setProperty('mainTexture', texture);

        })
    }

    Set半径(半径: number) {
        this.radius = 半径
        this.createCircleMesh()
    }

}