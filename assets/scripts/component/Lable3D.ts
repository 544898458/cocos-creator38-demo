import { _decorator, Component, ImageAsset, Texture2D } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Lable3D')
export class Lable3D extends Component {
    public static readonly 字体大小 = 32;
    public static readonly 纹理宽度 = 256;
    public static readonly 纹理高度 = 64;
    public static readonly 字体名称 = 'Microsoft YaHei';

    @property({ tooltip: '仅用于标记 3D 名字节点，运行时由 Name3DManager 覆盖。' })
    文本 = '';

    private static 已打印无Canvas警告 = false;

    public 生成文字纹理(文本: string): Texture2D {
        return Lable3D.生成文字纹理(文本);
    }

    public static 生成文字纹理(文本: string): Texture2D {
        const canvas = Lable3D.创建Canvas();
        if (!canvas) {
            if (!Lable3D.已打印无Canvas警告) {
                Lable3D.已打印无Canvas警告 = true;
                console.warn('[Lable3D] 无法创建 Canvas，名字贴图不可见。');
            }
            return new Texture2D();
        }

        const width = Lable3D.纹理宽度;
        const height = Lable3D.纹理高度;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext?.('2d');
        if (!ctx) {
            console.warn('[Lable3D] 创建 2D 上下文失败，名字贴图不可见:', 文本);
            return new Texture2D();
        }

        const 绘制文本 = (文本 ?? '').toString();
        const font = `${Lable3D.字体大小}px "${Lable3D.字体名称}", "PingFang SC", Arial, sans-serif`;

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
