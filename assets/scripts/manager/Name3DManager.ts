// Name3DManager.ts
import { _decorator, Component, Node, MeshRenderer, Material, Vec3, Prefab, instantiate, Layers, Texture2D, ImageAsset, director, gfx, sys } from 'cc';

const { ccclass, property } = _decorator;

type 名字实例 = { id: number; 锚点: Node; 节点: Node };

@ccclass('Name3DManager')
export class Name3DManager extends Component {
    @property(Material)
    名字材质: Material = null!;

    @property(Prefab)
    头顶名字预制体: Prefab = null!;

    @property
    字体大小: number = 32;

    @property
    纹理宽度: number = 256;

    @property
    纹理高度: number = 64;

    @property
    包围盒半径: number = 100000;

    // 纹理缓存，key 为名字，value 为对应文字贴图
    private 纹理缓存: Map<string, Texture2D> = new Map();

    // 材质缓存，key 为名字，value 为共享材质（同名共享）
    private 材质缓存: Map<string, Material> = new Map();

    // 实例数据，key 为名字，value 为该名字下的所有单位实例
    private 实例数据: Map<string, 名字实例[]> = new Map();

    private 已打印无DOM警告 = false;
    private 已打印硬件Instancing能力 = false;

    private 规范化名字(名字: string): string {
        return (名字 ?? '').trim();
    }

    onDestroy() {
        this.清空所有实例();
    }

    // 添加名字实例（绑定单位 NamePos）
    public 添加名字实例(名字: string, 锚点: Node, 实例ID: number) {
        const 归一化名字 = this.规范化名字(名字);
        console.log('添加名字实例:', 归一化名字, '锚点:', 锚点?.name, '实例ID:', 实例ID);

        if (!归一化名字 || 归一化名字.length === 0) {
            console.log('名字为空，跳过');
            return;
        }
        if (!锚点 || !锚点.isValid) {
            console.warn('名字锚点无效，跳过添加实例', 归一化名字, 实例ID);
            return;
        }

        if (!this.实例数据.has(归一化名字)) {
            this.实例数据.set(归一化名字, []);
        }

        const 实例数组 = this.实例数据.get(归一化名字)!;
        const 已有实例 = 实例数组.find(inst => inst.id === 实例ID);
        if (已有实例) {
            已有实例.锚点 = 锚点;
            if (!已有实例.节点 || !已有实例.节点.isValid) {
                const 新节点 = this.创建名字节点(归一化名字, 锚点);
                if (!新节点) {
                    return;
                }
                已有实例.节点 = 新节点;
            } else {
                已有实例.节点.parent = 锚点;
                已有实例.节点.setPosition(0, 0, 0);
                const 材质 = this.获取或创建材质(归一化名字);
                if (材质) {
                    this.应用材质到节点内渲染器(已有实例.节点, 材质, 归一化名字);
                }
            }
            return;
        }

        const 节点 = this.创建名字节点(归一化名字, 锚点);
        if (!节点) {
            return;
        }

        实例数组.push({ id: 实例ID, 锚点, 节点 });
        console.log('添加实例数据，当前实例数量:', 实例数组.length);
    }

    // 移除名字实例
    public 移除名字实例(名字: string, 实例ID: number) {
        const 归一化名字 = this.规范化名字(名字);
        if (!this.实例数据.has(归一化名字)) {
            return;
        }

        const 实例数组 = this.实例数据.get(归一化名字)!;
        const 索引 = 实例数组.findIndex(inst => inst.id === 实例ID);
        if (索引 === -1) {
            console.log('未找到要移除的名字实例，实例ID:', 实例ID);
            return;
        }

        const 实例 = 实例数组[索引];
        if (实例.节点 && 实例.节点.isValid) {
            实例.节点.destroy();
        }
        实例数组.splice(索引, 1);
        console.log('移除名字实例，当前实例数量:', 实例数组.length);

        if (实例数组.length === 0) {
            this.实例数据.delete(归一化名字);
            this.释放名字资源(归一化名字);
        }
    }

    // 兼容旧调用：现在默认绑定 NamePos，不依赖外部同步位置
    public 更新名字实例位置(名字: string, 实例ID: number, 新位置: Vec3) {
        const 归一化名字 = this.规范化名字(名字);
        if (!this.实例数据.has(归一化名字)) {
            return;
        }
        const 实例 = this.实例数据.get(归一化名字)!.find(inst => inst.id === 实例ID);
        if (!实例 || !实例.节点 || !实例.节点.isValid) {
            return;
        }
        // 兼容历史代码：仍允许强制设置世界坐标
        实例.节点.setWorldPosition(新位置);
    }

    // 清空所有实例
    public 清空所有实例() {
        for (const 实例数组 of this.实例数据.values()) {
            for (const 实例 of 实例数组) {
                if (实例.节点 && 实例.节点.isValid) {
                    实例.节点.destroy();
                }
            }
        }
        this.实例数据.clear();

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
    }

    private 释放名字资源(名字: string) {
        const 材质 = this.材质缓存.get(名字);
        if (材质 && 材质.isValid) {
            材质.destroy();
        }
        this.材质缓存.delete(名字);

        const 纹理 = this.纹理缓存.get(名字);
        if (纹理 && 纹理.isValid) {
            纹理.destroy();
        }
        this.纹理缓存.delete(名字);
    }

    private 创建名字节点(名字: string, 锚点: Node): Node | null {
        if (!this.头顶名字预制体) {
            console.error('头顶名字预制体未设置，无法创建名字节点');
            return null;
        }

        const 材质 = this.获取或创建材质(名字);
        if (!材质) {
            console.error('创建材质失败，无法创建名字节点');
            return null;
        }

        const 节点 = instantiate(this.头顶名字预制体);
        节点.name = `NameRenderer_${名字}`;
        节点.parent = 锚点;
        节点.setPosition(0, 0, 0);
        this.应用纹理宽高比(节点);

        if (!this.应用材质到节点内渲染器(节点, 材质, 名字)) {
            节点.destroy();
            return null;
        }
        return 节点;
    }

    private 应用纹理宽高比(根节点: Node) {
        const 高度 = Math.max(1, this.纹理高度);
        const 比例 = Math.max(0.01, this.纹理宽度 / 高度);
        const 渲染器列表 = 根节点.getComponentsInChildren(MeshRenderer);
        for (const mr of 渲染器列表) {
            const s = mr.node.scale;
            mr.node.setScale(s.x * 比例, s.y, s.z);
        }
    }

    private 应用材质到节点内渲染器(根节点: Node, 材质: Material, 名字: string): boolean {
        const 渲染器列表 = 根节点.getComponentsInChildren(MeshRenderer);
        if (渲染器列表.length === 0) {
            console.error('头顶名字预制体中未找到 MeshRenderer，无法绑定材质');
            return false;
        }

        for (const mr of 渲染器列表) {
            // 防止预制体里 layer/visibility 配置导致主相机不可见
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

            // 只走 sharedMaterial，避免为每个渲染器生成独立材质实例，打散同名合批
            mr.sharedMaterials = [材质];
            mr.setSharedMaterial(材质, 0);

            this.扩展模型包围盒(mr);
            const m0 = mr.getSharedMaterial(0);
            console.log(`[Name3D] 绑定材质 名字=${名字} 节点=${mr.node.name} shared0=${m0 ? 'OK' : 'EMPTY'} 同对象=${m0 === 材质}`);
            console.log(`[Name3D] 渲染状态 名字=${名字} 节点=${mr.node.name} receiveShadow=${anyMr.receiveShadow} useLightProbe=${anyMr.useLightProbe ?? anyMr.bakeSettings?.useLightProbe} reflectionProbe=${anyMr.reflectionProbe ?? anyMr.bakeSettings?.reflectionProbe}`);
        }
        return true;
    }

    private 扩展模型包围盒(渲染器: MeshRenderer) {
        const model = 渲染器.model;
        if (!model) {
            return;
        }

        const r = Math.max(1, this.包围盒半径);
        const min = new Vec3(-r, -r, -r);
        const max = new Vec3(r, r, r);
        model.createBoundingShape(min, max);
        model.updateWorldBound();
    }

    // 获取或创建材质（同名共享）
    private 获取或创建材质(名字: string): Material | null {
        if (this.材质缓存.has(名字)) {
            return this.材质缓存.get(名字)!;
        }

        if (!this.名字材质) {
            console.error('名字材质未设置');
            return null;
        }

        const 纹理 = this.获取或创建纹理(名字);
        const 新材质 = new Material();
        新材质.copy(this.名字材质);
        try {
            新材质.recompileShaders({ USE_INSTANCING: true });
        } catch (e) {
            console.warn('名字材质重编译 instancing 变体失败，继续使用默认变体:', e);
        }
        新材质.setProperty('mainTexture', 纹理);
        this.打印Instancing信息(新材质, 名字);

        this.材质缓存.set(名字, 新材质);
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

    // 获取或创建名字纹理（同名共享）
    private 获取或创建纹理(名字: string): Texture2D {
        if (this.纹理缓存.has(名字)) {
            return this.纹理缓存.get(名字)!;
        }

        const 纹理 = this.使用Canvas绘制纹理(名字);
        this.纹理缓存.set(名字, 纹理);
        return 纹理;
    }

    // 使用 CPU Canvas 直接生成文字纹理，避免离屏相机同帧覆盖导致的脏图问题
    private 使用Canvas绘制纹理(名字: string): Texture2D {
        const g = globalThis as any;
        const doc = g?.document;
        let canvas: any = null;
        if (doc && typeof doc.createElement === 'function') {
            canvas = doc.createElement('canvas');
        } else if (g?.__globalAdapter?.createCanvas) {
            canvas = g.__globalAdapter.createCanvas();
        } else if (g?.wx?.createOffscreenCanvas) {
            canvas = g.wx.createOffscreenCanvas();
        }

        if (!canvas) {
            if (!this.已打印无DOM警告) {
                this.已打印无DOM警告 = true;
                console.warn('[Name3D] 无法创建 Canvas，无法生成文字贴图，名字将不可见');
            }
            return new Texture2D();
        }

        canvas.width = Math.max(2, this.纹理宽度);
        canvas.height = Math.max(2, this.纹理高度);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('[Name3D] 创建 2D 上下文失败，名字将不可见:', 名字);
            return new Texture2D();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = `bold ${Math.max(8, this.字体大小)}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
        ctx.fillText(名字, canvas.width * 0.5, canvas.height * 0.5);

        const imageAsset = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = imageAsset;

        return texture;
    }
}
