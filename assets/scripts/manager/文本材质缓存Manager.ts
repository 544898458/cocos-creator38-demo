// Name3DManager.ts
import { _decorator, Component, Material, Prefab, Texture2D, director, gfx, sys, Color, Vec4, Node, MeshRenderer, Layers, instantiate } from 'cc';
import { Label3D } from '../component/Label3D';

const { ccclass, property } = _decorator;

@ccclass('文本材质缓存Manager')
export class 文本材质缓存Manager extends Component {
    @property(Material)名字材质模板: Material = null!;
    @property(Prefab)条片段预制体: Prefab = null!;
    @property(Texture2D)血条背景纹理: Texture2D = null!;
    @property(Texture2D)血条前景纹理: Texture2D = null!;
    @property(Texture2D)能量条背景纹理: Texture2D = null!;
    @property(Texture2D)能量条前景纹理: Texture2D = null!;

    private 纹理缓存: Map<string, Texture2D> = new Map();
    private 材质缓存: Map<string, Material> = new Map();
    private 血条背景材质缓存: Material | null = null;
    private 血条前景材质缓存: Material | null = null;
    private 能量条背景材质缓存: Material | null = null;
    private 能量条前景材质缓存: Material | null = null;
    private 已打印状态条Instancing = false;

    private 已打印硬件Instancing能力 = false;
    public readonly 血条厚度 = 0.2;
    public readonly 能量条厚度 = 0.3;

    private 颜色转键(颜色: Color): string {
        return `${颜色.r},${颜色.g},${颜色.b},${颜色.a}`;
    }

    private 组键(名字: string, 颜色键: string): string {
        return `${名字}||${颜色键}`;
    }

    onDestroy() {
        this.清空缓存();
    }

    public 清空缓存() {
        for (const 材质 of this.材质缓存.values()) {
            if (材质 && 材质.isValid) {
                材质.destroy();
            }
        }
        this.材质缓存.clear();

        for (const 纹理 of this.纹理缓存.values()) {
            if (纹理 && 纹理.isValid) {
                纹理.destroy();
            }
        }
        this.纹理缓存.clear();

        const 状态条材质列表 = [this.血条背景材质缓存, this.血条前景材质缓存, this.能量条背景材质缓存, this.能量条前景材质缓存];
        for (const 材质 of 状态条材质列表) {
            if (材质 && 材质.isValid) {
                材质.destroy();
            }
        }
        this.血条背景材质缓存 = null;
        this.血条前景材质缓存 = null;
        this.能量条背景材质缓存 = null;
        this.能量条前景材质缓存 = null;
    }
    
    public 获取或创建材质(名字: string, 颜色: Color): Material | null {
        const 颜色键 = this.颜色转键(颜色);
        const 组键 = this.组键(名字, 颜色键);
        if (this.材质缓存.has(组键)) 
            return this.材质缓存.get(组键)!;


        const 纹理 = this.获取或创建纹理(名字);
        const 新材质 = new Material()
        新材质.copy(this.名字材质模板)
        try {
            新材质.recompileShaders({ USE_INSTANCING: true });
        } catch (e) {
            console.warn('名字材质重编译 instancing 变体失败，继续使用默认变体:', e);
        }
        新材质.setProperty('mainTexture', 纹理);
        新材质.setProperty('color', new Vec4(颜色.r / 255, 颜色.g / 255, 颜色.b / 255, 颜色.a / 255));
        this.打印Instancing信息(新材质, `${名字}@${颜色键}`);

        this.材质缓存.set(组键, 新材质);
        return 新材质;
    }

    private 打印Instancing信息(材质: Material, 名字: string) {
        if (!this.已打印硬件Instancing能力) {
            this.已打印硬件Instancing能力 = true;
            const device = director.root?.device;
            const 设备支持 = !!device?.hasFeature(gfx.Feature.INSTANCED_ARRAYS);
            const gfxApi = (device as any)?.gfxAPI;
            console.log(`[Name3D] 设备 Instancing 支持=${设备支持} platform=${sys.platform} os=${sys.os} gfxAPI=${gfxApi}`);
        }

        const pass = 材质.passes?.[0] as any;
        const useInstancing = pass?.defines?.USE_INSTANCING ?? pass?.getDefine?.('USE_INSTANCING');
        const batchingScheme = pass?.batchingScheme;
        const effectName = (材质.effectAsset as any)?.name ?? 材质.effectName ?? 'unknown';
        console.log(`[Name3D] 材质Instancing 名字=${名字} effect=${effectName} batchingScheme=${batchingScheme} USE_INSTANCING=${useInstancing}`);
    }

    private 获取或创建纹理(名字: string): Texture2D {
        if (this.纹理缓存.has(名字)) {
            return this.纹理缓存.get(名字)!;
        }

        const 纹理 = Label3D.生成文字纹理(名字);
        this.纹理缓存.set(名字, 纹理);
        return 纹理;
    }

    private 创建状态条Instancing材质(基础材质: Material): Material {
        const 新材质 = new Material();
        新材质.copy(基础材质);
        try {
            新材质.recompileShaders({ USE_INSTANCING: true });
        } catch (e) {
            console.warn('[HeadBar3D] 重编译 instancing 变体失败，继续使用默认变体:', e);
        }
        return 新材质;
    }

    public 准备状态条资源(): boolean {
        if (this.条片段预制体 && this.血条背景材质缓存 && this.血条前景材质缓存 && this.能量条背景材质缓存 && this.能量条前景材质缓存) {
            return true;
        }
        if (!this.条片段预制体 || !this.名字材质模板) {
            console.warn('[HeadBar3D] 缺少条片段预制体或名字材质模板，无法创建3D状态条');
            return false;
        }

        this.血条背景材质缓存 = this.创建状态条Instancing材质(this.名字材质模板);
        this.血条前景材质缓存 = this.创建状态条Instancing材质(this.名字材质模板);
        this.能量条背景材质缓存 = this.创建状态条Instancing材质(this.名字材质模板);
        this.能量条前景材质缓存 = this.创建状态条Instancing材质(this.名字材质模板);

        this.血条背景材质缓存.setProperty('color', new Vec4(1, 1, 1, 0.5));
        this.能量条背景材质缓存.setProperty('color', new Vec4(1, 1, 1, 0.5));
        this.血条背景材质缓存.setProperty('barUseFill', 1.0);
        this.血条前景材质缓存.setProperty('barUseFill', 1.0);
        this.能量条背景材质缓存.setProperty('barUseFill', 1.0);
        this.能量条前景材质缓存.setProperty('barUseFill', 1.0);

        if (this.血条背景纹理) {
            this.血条背景材质缓存.setProperty('mainTexture', this.血条背景纹理);
        }
        if (this.血条前景纹理) {
            this.血条前景材质缓存.setProperty('mainTexture', this.血条前景纹理);
        }
        if (!this.血条背景纹理 || !this.血条前景纹理) {
            console.warn('[HeadBar3D] 未配置血条贴图(背景/前景)，将使用材质默认贴图');
        }
        if (this.能量条背景纹理) {
            this.能量条背景材质缓存.setProperty('mainTexture', this.能量条背景纹理);
        }
        if (this.能量条前景纹理) {
            this.能量条前景材质缓存.setProperty('mainTexture', this.能量条前景纹理);
        }
        if (!this.能量条背景纹理 || !this.能量条前景纹理) {
            console.warn('[HeadBar3D] 未完整配置能量条贴图(背景/前景)，将使用材质默认贴图');
        }

        if (!this.已打印状态条Instancing) {
            this.已打印状态条Instancing = true;
            const pass = (this.血条前景材质缓存.passes?.[0] as any);
            const useInstancing = pass?.defines?.USE_INSTANCING ?? pass?.getDefine?.('USE_INSTANCING');
            const batchingScheme = pass?.batchingScheme;
            console.log(`[HeadBar3D] 材质Instancing batchingScheme=${batchingScheme} USE_INSTANCING=${useInstancing}`);
        }

        return true;
    }

    public 设置状态条实例填充(rootNode: Node | null, fill: number): void {
        if (!rootNode?.isValid) return;
        const normalizedFill = Number.isFinite(fill) ? Math.max(0, Math.min(1, fill)) : 0;
        const renderers = rootNode.getComponentsInChildren(MeshRenderer);
        for (const mr of renderers) {
            mr.setInstancedAttribute('a_barFill', [normalizedFill]);
        }
    }

}
