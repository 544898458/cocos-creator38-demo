import { primitives } from 'cc';
import { gfx } from 'cc';
import { utils } from 'cc';
import { _decorator, Component, Node, Mesh, Vec3, Vec2, Material, geometry, MeshRenderer, PhysicsSystem, PhysicsRayResult } from 'cc';
import { 地面碰撞Component } from './地面碰撞Component';
import { MeshCreator } from './MeshCreator';
import { vec2Pool, vec3Pool } from './MathUtils';
import { Texture } from '../../../extensions/extensions_mesh/@types/packages/engine-extends/@types/glTF';
import { assetManager } from 'cc';
import { Texture2D } from 'cc';
import { ImageAsset } from 'cc';
import { host静态 } from '../配置/此游戏专用配置';
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

    /**
     * 从高处向下射线, 采样地图地面的高度(含 2cm 防 z-fighting 偏移)
     * 未命中地面时返回 null
     */
    private 采样地面高度(worldX: number, worldZ: number): number {
        const startY = this.node.worldPosition.y + 10;
        const ray = new geometry.Ray(worldX, startY, worldZ, 0, -1, 0);
        if (!PhysicsSystem.instance.raycast(ray)) {
            return null;
        }
        let 高度: number = null;
        PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
            if (!item.collider.node.getComponent(地面碰撞Component))
                return
            if (高度 === null || item.hitPoint.y > 高度)
                高度 = item.hitPoint.y;
        });
        return 高度 === null ? null : 高度 + 0.02;
    }

    start() {
        this.createCircleMesh();

    }

    createCircleMesh() {
        const vertices2: number[] = [];
        const uvs: Vec2[] = [];
        const indices: number[] = [];
        this._meshCreator.reset();

        // 中心点
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
            const posWorld节点 = this.node.getWorldPosition();
            const posWorld顶点 = new Vec3(x, 0, z).add(posWorld节点);

            // vertices.push(.add3f(posWorld.x, 0, posWorld.z));
            let 地板半边长 = 100
            let uv = new Vec2(0.5 + posWorld顶点.x / (2 * 地板半边长), 0.5 + posWorld顶点.z / (2 * 地板半边长))
            uvs.push(uv);
            // 射线采样地面高度, 让苔蔓跟随地面起伏; 未命中保持水平
            const 高度 = this.采样地面高度(posWorld顶点.x, posWorld顶点.z);
            const y = 高度 !== null ? 高度 - posWorld节点.y : 0;
            vertices2.push(x, y, z);
            // console.log('点', x, z);
            let p = vec3Pool.alloc().set(x, y, z);
            this._meshCreator.verticles.push(p);
            this._meshCreator.uvs.push(uv);
        }

        // 索引
        for (let i = 1; i < this.segments - 1; i++) {
            indices.push(0, i + 1, i);
            this._meshCreator.indices.push(0, i + 1, i);
        }
        
        let p0 = vec3Pool.alloc().set(0, 0, 0);
        let p1 = vec3Pool.alloc().set(1, 0, 0);
        let p2 = vec3Pool.alloc().set(1, 0, 1);
        let p3 = vec3Pool.alloc().set(0, 0, 1);
        let p4 = vec3Pool.alloc().set(-1, 0, 0);

        let uv0 = vec2Pool.alloc().set(0, 0);
        let uv1 = vec2Pool.alloc().set(1, 0);
        let uv2 = vec2Pool.alloc().set(1, 1);
        let uv3 = vec2Pool.alloc().set(0, 1);
        let uv4 = vec2Pool.alloc().set(0.5, 1);

        let mesh: Mesh = this._meshCreator.buildMesh();

        const meshRenderer = this.node.getComponent(MeshRenderer);
        // if (meshRenderer) 
        {
            meshRenderer.mesh = mesh;
            meshRenderer.material = this.material;
        }
        
        assetManager.loadRemote(encodeURI(host静态 + '图片/苔蔓1536.png'), (err, imageAsset: ImageAsset) => {
            console.log('苔蔓贴图resources.load callback:', err, imageAsset)
            // console.log(this.material.getProperty('albedoMap'))
            // console.log(this.material.getProperty('mainTexture'))
            let texture:Texture2D = this.material.getProperty('mainTexture') as Texture2D
            texture.image = imageAsset;
            console.log(texture)
            this.material.setProperty('mainTexture', texture);

        })

        assetManager.loadRemote(encodeURI(host静态 + '图片/苔蔓法线贴图1536.png'), (err, imageAsset: ImageAsset) => {
            console.log('苔蔓法线贴图resources.load callback:', err, imageAsset)
            // console.log(this.material.getProperty('albedoMap'))
            // console.log(this.material.getProperty('mainTexture'))
            let texture:Texture2D = this.material.getProperty('normalMap') as Texture2D
            texture.image = imageAsset;
            console.log(texture)
            this.material.setProperty('normalMap', texture);

        })
    }

    Set半径(半径: number) {
        this.radius = 半径
        this.createCircleMesh()
    }

}