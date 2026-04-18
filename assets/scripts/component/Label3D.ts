import { _decorator, Color, Component, director, ImageAsset, Layers, MeshRenderer, Texture2D } from 'cc';
import { MainTest } from '../MainTest';
import { 文本材质缓存Manager } from '../manager/文本材质缓存Manager';

const { ccclass, property } = _decorator;

@ccclass('Lable3D')
export class Label3D extends Component {
    public static readonly 字体大小 = 32;
    public static readonly 纹理宽度 = 256;
    public static readonly 纹理高度 = 64;

    @property({ tooltip: '仅用于标记 3D 文本节点，运行时由文本材质缓存提供材质。' })
    get 文本(): string {
        return this._文本;
    }
    set 文本(value: string) {
        this._文本 = value;
        console.log('Label3D 文本:', this._文本);
        this.刷新显示();
    }

    @property({ type: Color, tooltip: '3D 文字颜色。' })
    get 颜色(): Color {
        return this._颜色;
    }
    set 颜色(value: Color) {
        this._颜色 = value;
        this.刷新显示();
    }

    private _文本 = '';
    private _颜色: Color = new Color(255, 255, 255, 255);
    private 文本材质缓存: 文本材质缓存Manager | null = null;
    private static 已打印无Canvas警告 = false;
    onLoad() {
        this.刷新显示();
    }


    private 刷新显示() {
        if (!this.node?.isValid) return;
        if (!this._文本) return;

        const 渲染器列表 = this.node.getComponentsInChildren(MeshRenderer);
        if (渲染器列表.length === 0) {
            console.error('Label3D 节点中未找到 MeshRenderer，无法绑定材质:', this.node.name);
            return;
        }

        const 文本材质缓存 = this.获取文本材质缓存();
        if (!文本材质缓存) {
            console.warn('[Label3D] 未找到文本材质缓存，无法刷新文字:', this.node.name, this._文本);
            return;
        }

        const 材质 = 文本材质缓存.获取或创建材质(this._文本, this._颜色);
        if (!材质) {
            console.warn('[Label3D] 获取材质失败，无法刷新文字:', this.node.name, this._文本);
            return;
        }

        this.node.active = true;
        for (const mr of 渲染器列表) {
            mr.node.layer = Layers.Enum.DEFAULT;
            mr.visibility = Layers.BitMask.DEFAULT;
            mr.priority = 0;
            const anyMr = mr as any;
            if (anyMr.shadowCastingMode !== undefined) {
                anyMr.shadowCastingMode = 0;
            }
            if (anyMr.receiveShadow !== undefined) {
                anyMr.receiveShadow = false;
            }
            if (anyMr.useLightProbe !== undefined) {
                anyMr.useLightProbe = false;
            }
            if (anyMr.bakeSettings) {
                anyMr.bakeSettings.useLightProbe = false;
                anyMr.bakeSettings.reflectionProbe = 0;
                anyMr.bakeSettings.texture = null;
            }
            if (anyMr.reflectionProbeType !== undefined) {
                anyMr.reflectionProbeType = 0;
            } else if (anyMr.reflectionProbe !== undefined) {
                anyMr.reflectionProbe = 0;
            }

            mr.sharedMaterials = [材质];
            mr.setSharedMaterial(材质, 0);
        }
    }

    private 获取文本材质缓存(): 文本材质缓存Manager | null {
        if (this.文本材质缓存?.isValid) {
            return this.文本材质缓存;
        }

        const 文本材质缓存 = MainTest.instance?.文本材质缓存 ?? null;
        if (文本材质缓存?.isValid) {
            this.文本材质缓存 = 文本材质缓存;
            return 文本材质缓存;
        }

        const scene = director.getScene();
        const 兼容旧查找 = scene?.getComponentInChildren(文本材质缓存Manager) ?? null;
        this.文本材质缓存 = 兼容旧查找;
        return 兼容旧查找;
    }

    public static 生成文字纹理(文本: string): Texture2D {
        const canvas = Label3D.创建Canvas();
        if (!canvas) {
            if (!Label3D.已打印无Canvas警告) {
                Label3D.已打印无Canvas警告 = true;
                console.warn('[Lable3D] 无法创建 Canvas，名字贴图不可见。');
            }
            return new Texture2D();
        }

        const width = Label3D.纹理宽度;
        const height = Label3D.纹理高度;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext?.('2d');
        if (!ctx) {
            console.warn('[Lable3D] 创建 2D 上下文失败，名字贴图不可见:', 文本);
            return new Texture2D();
        }

        const 绘制文本 = (文本 ?? '').toString();
        const font = `${Label3D.字体大小}px sans-serif`;

        ctx.clearRect(0, 0, width, height);
        ctx.font = font;
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(绘制文本, width * 0.5, height * 0.5, width);

        const imageAsset = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = imageAsset;
        return texture;
    }

    private static 创建Canvas(): any | null {
        const g = globalThis as any;
        const doc = g?.document;

        if (doc && typeof doc.createElement === 'function') {
            return doc.createElement('canvas');
        }
        if (g?.__globalAdapter?.createCanvas) {
            return g.__globalAdapter.createCanvas();
        }
        if (g?.wx?.createOffscreenCanvas) {
            return g.wx.createOffscreenCanvas();
        }
        return null;
    }
}
