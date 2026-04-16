// Name3DManager.ts
import { _decorator, Component, Node, MeshRenderer, Material, Vec3, Prefab, Layers, Texture2D, director, gfx, sys, Color, Vec4 } from 'cc';
import { Lable3D } from '../component/Lable3D';

const { ccclass, property } = _decorator;

type 文本实例 = { id: string; 锚点: Node; 节点: Node; 文本: string; 颜色键: string };

@ccclass('Name3DManager')
export class Name3DManager extends Component {
    @property(Material)
    名字材质模板: Material = null!;

    @property(Prefab)
    条片段预制体: Prefab = null!;

    private 纹理缓存: Map<string, Texture2D> = new Map();
    private 材质缓存: Map<string, Material> = new Map();
    private 实例数据: Map<string, 文本实例[]> = new Map();
    private 实例索引: Map<string, string> = new Map();

    private 已打印硬件Instancing能力 = false;

    private 规范化名字(名字: string): string {
        return (名字 ?? '').trim();
    }

    private 规范化颜色(颜色?: Color): Color {
        if (!颜色) return new Color(255, 255, 255, 255);
        return new Color(颜色.r, 颜色.g, 颜色.b, 颜色.a);
    }

    private 颜色转键(颜色: Color): string {
        return `${颜色.r},${颜色.g},${颜色.b},${颜色.a}`;
    }

    private 拆组键(组键: string): { 名字: string; 颜色键: string } {
        const idx = 组键.lastIndexOf('||');
        if (idx < 0) return { 名字: 组键, 颜色键: '255,255,255,255' };
        return {
            名字: 组键.slice(0, idx),
            颜色键: 组键.slice(idx + 2),
        };
    }

    private 组键(名字: string, 颜色键: string): string {
        return `${名字}||${颜色键}`;
    }

    private 规范化实例键(id: number | string): string {
        return `${id}`;
    }

    private 查找实例(id: number | string): { 组键: string; 实例: 文本实例 } | null {
        const 实例键 = this.规范化实例键(id);
        const 已知组键 = this.实例索引.get(实例键);
        if (已知组键) {
            const arr = this.实例数据.get(已知组键);
            const inst = arr?.find((v) => v.id === 实例键);
            if (inst) return { 组键: 已知组键, 实例: inst };
            this.实例索引.delete(实例键);
        }

        for (const [组键, arr] of this.实例数据.entries()) {
            const inst = arr.find((v) => v.id === 实例键);
            if (inst) {
                this.实例索引.set(实例键, 组键);
                return { 组键, 实例: inst };
            }
        }
        return null;
    }

    onDestroy() {
        this.清空所有实例();
    }

    public 添加文本实例(文本: string, node文本: Node, 实例ID: number | string, 颜色?: Color) {
        const 归一化文本 = this.规范化名字(文本);
        const 归一化颜色 = this.规范化颜色(颜色);
        const 颜色键 = this.颜色转键(归一化颜色);
        const 实例键 = this.规范化实例键(实例ID);
        const 文本节点 = node文本;
        const 目标组键 = this.组键(归一化文本, 颜色键);
        console.log('添加文本实例:', 归一化文本, '锚点:', 文本节点?.name, '实例ID:', 实例键, '颜色:', 颜色键);

        if (!归一化文本) {
            console.log('文本为空，跳过');
            return;
        }
        if (!文本节点 || !文本节点.isValid) {
            console.warn('文本锚点无效，跳过添加实例', 归一化文本, 实例键);
            return;
        }

        const 已有 = this.查找实例(实例键);
        if (已有) {
            const oldGroup = 已有.组键;
            const 实例 = 已有.实例;
            实例.锚点 = 文本节点;

            if (oldGroup !== 目标组键) {
                const oldArr = this.实例数据.get(oldGroup);
                if (oldArr) {
                    const idx = oldArr.findIndex((v) => v.id === 实例键);
                    if (idx >= 0) oldArr.splice(idx, 1);
                    if (oldArr.length === 0) {
                        this.实例数据.delete(oldGroup);
                        this.释放组资源(oldGroup);
                    }
                }
            }

            实例.节点 = 文本节点;
            const 材质 = this.获取或创建材质(归一化文本, 归一化颜色);
            if (材质) {
                文本节点.active = true;
                this.应用材质到节点内渲染器(文本节点, 材质, `${归一化文本}@${颜色键}`);
            }

            实例.文本 = 归一化文本;
            实例.颜色键 = 颜色键;
            if (!this.实例数据.has(目标组键)) this.实例数据.set(目标组键, []);
            const 目标数组 = this.实例数据.get(目标组键)!;
            if (!目标数组.some((v) => v.id === 实例键)) 目标数组.push(实例);
            this.实例索引.set(实例键, 目标组键);
            return;
        }

        const 节点 = this.初始化名字节点(归一化文本, 文本节点, 归一化颜色);
        if (!节点) return;

        if (!this.实例数据.has(目标组键)) this.实例数据.set(目标组键, []);
        const 实例数组 = this.实例数据.get(目标组键)!;
        实例数组.push({ id: 实例键, 锚点: 文本节点, 节点, 文本: 归一化文本, 颜色键 });
        this.实例索引.set(实例键, 目标组键);
        console.log('添加实例数据，当前实例数量:', 实例数组.length);
    }

    public 添加名字实例(名字: string, node名字: Node, 实例ID: number, 颜色?: Color) {
        this.添加文本实例(名字, node名字, `名字:${实例ID}`, 颜色);
    }

    public 移除文本实例(实例ID: number | string) {
        const 命中 = this.查找实例(实例ID);
        if (!命中) {
            console.log('未找到要移除的文本实例，实例ID:', this.规范化实例键(实例ID));
            return;
        }

        const 组键 = 命中.组键;
        const 实例数组 = this.实例数据.get(组键);
        if (!实例数组) return;
        const 实例键 = this.规范化实例键(实例ID);
        const 索引 = 实例数组.findIndex((inst) => inst.id === 实例键);
        if (索引 < 0) return;
        const 实例 = 实例数组[索引];
        if (实例.节点 && 实例.节点.isValid) {
            实例.节点.active = false;
        }
        实例数组.splice(索引, 1);
        this.实例索引.delete(实例键);
        console.log('移除文本实例，当前实例数量:', 实例数组.length);

        if (实例数组.length === 0) {
            this.实例数据.delete(组键);
            this.释放组资源(组键);
        }
    }

    public 移除名字实例(_名字: string, 实例ID: number) {
        this.移除文本实例(`名字:${实例ID}`);
    }

    public 更新文本实例位置(实例ID: number | string, 新位置: Vec3) {
        const 命中 = this.查找实例(实例ID);
        if (!命中 || !命中.实例.节点 || !命中.实例.节点.isValid) {
            return;
        }
        命中.实例.节点.setWorldPosition(新位置);
    }

    public 更新名字实例位置(_名字: string, 实例ID: number, 新位置: Vec3) {
        this.更新文本实例位置(`名字:${实例ID}`, 新位置);
    }

    public 更新文本实例颜色(文本: string, 实例ID: number | string, 颜色: Color) {
        const 命中 = this.查找实例(实例ID);
        if (!命中) return;
        this.添加文本实例(文本 || 命中.实例.文本, 命中.实例.锚点, 实例ID, 颜色);
    }

    public 更新名字实例颜色(名字: string, 实例ID: number, 颜色: Color) {
        this.更新文本实例颜色(名字, `名字:${实例ID}`, 颜色);
    }

    public 清空所有实例() {
        for (const 实例数组 of this.实例数据.values()) {
            for (const 实例 of 实例数组) {
                if (实例.节点 && 实例.节点.isValid) {
                    实例.节点.active = false;
                }
            }
        }
        this.实例数据.clear();
        this.实例索引.clear();

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

    private 释放组资源(组键: string) {
        const 材质 = this.材质缓存.get(组键);
        if (材质 && 材质.isValid) {
            材质.destroy();
        }
        this.材质缓存.delete(组键);

        const { 名字 } = this.拆组键(组键);
        const 仍在使用该名字 = Array.from(this.实例数据.keys()).some((k) => this.拆组键(k).名字 === 名字);
        if (仍在使用该名字) return;

        const 纹理 = this.纹理缓存.get(名字);
        if (纹理 && 纹理.isValid) 纹理.destroy();
        this.纹理缓存.delete(名字);
    }

    private 初始化名字节点(名字: string, 名字节点: Node, 颜色: Color): Node | null {
        const 材质 = this.获取或创建材质(名字, 颜色);
        if (!材质) {
            console.error('创建材质失败，无法初始化名字节点');
            return null;
        }

        名字节点.active = true;

        if (!this.应用材质到节点内渲染器(名字节点, 材质, 名字)) {
            return null;
        }
        return 名字节点;
    }

    private 应用材质到节点内渲染器(根节点: Node, 材质: Material, str调试文本: string): boolean {
        const 渲染器列表 = 根节点.getComponentsInChildren(MeshRenderer);
        if (渲染器列表.length === 0) {
            console.error('名字节点中未找到 MeshRenderer，无法绑定材质:', 根节点.name);
            return false;
        }

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

            const m0 = mr.getSharedMaterial(0);
            console.log(`[Name3D] 绑定材质 名字=${str调试文本} 节点=${mr.node.name} shared0=${m0 ? 'OK' : 'EMPTY'} 同对象=${m0 === 材质}`);
            console.log(`[Name3D] 渲染状态 名字=${str调试文本} 节点=${mr.node.name} receiveShadow=${anyMr.receiveShadow} useLightProbe=${anyMr.useLightProbe ?? anyMr.bakeSettings?.useLightProbe} reflectionProbe=${anyMr.reflectionProbe ?? anyMr.bakeSettings?.reflectionProbe}`);
        }
        return true;
    }

    private 获取或创建材质(名字: string, 颜色: Color): Material | null {
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

        const 纹理 = Lable3D.生成文字纹理(名字);
        this.纹理缓存.set(名字, 纹理);
        return 纹理;
    }
}
