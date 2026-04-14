// Name3DManager.ts
import { RenderTexture } from 'cc';
import { Camera } from 'cc';
import { ImageAsset } from 'cc';
import { UITransform } from 'cc';
import { _decorator, Component, Node, MeshRenderer, Material, Mesh, Vec3, Quat, Texture2D, Canvas, Label, Color, Size, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Name3DManager')
export class Name3DManager extends Component {
    @property(Mesh)
    平面网格: Mesh = null!;
    
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
    
    // 纹理缓存，key 为名字，value 为纹理
    private 纹理缓存: Map<string, RenderTexture> = new Map();
    
    // 材质缓存，key 为名字，value 为材质
    private 材质缓存: Map<string, Material> = new Map();
    
    // 渲染器缓存，key 为名字，value 为渲染器
    private 渲染器缓存: Map<string, MeshRenderer> = new Map();
    
    // 实例数据，key 为名字，value 为实例数组
    private 实例数据: Map<string, Array<{id: string | number, 位置: Vec3}>> = new Map();
    
    // 名字节点缓存，key 为单位ID，value 为名字节点
    private 名字节点缓存: Map<string | number, Node> = new Map();
    
    // 画布节点，用于渲染文本
    private 画布节点: Node = null!;
    private 画布组件: Canvas = null!;
    private 文本节点: Node = null!;
    private 文本组件: Label = null!
    
    onLoad() {
        // 创建画布节点用于渲染文本
        this.画布节点 = new Node('NameCanvas');
        this.画布节点.parent = this.node;
        
        this.画布组件 = this.画布节点.addComponent(Canvas);
        // 设置画布大小
        const uiTransform = this.画布节点.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.width = this.纹理宽度;
            uiTransform.height = this.纹理高度;
        }
        
        this.文本节点 = new Node('Text');
        this.文本节点.parent = this.画布节点;
        
        this.文本组件 = this.文本节点.addComponent(Label);
        this.文本组件.fontSize = this.字体大小;
        this.文本组件.color = new Color(255, 255, 255, 255);
        this.文本组件.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.文本组件.verticalAlign = Label.VerticalAlign.CENTER;
        this.文本组件.string = '';
        
        // 隐藏画布节点，只用于离屏渲染
        this.画布节点.active = false;
    }
    

    
    // 添加名字实例
    public 添加名字实例(名字: string, 位置: Vec3, 实例ID: string | number) {
        console.log('添加名字实例:', 名字, '位置:', 位置, '实例ID:', 实例ID);
        
        // 确保名字不为空
        if (!名字 || 名字.length === 0) {
            console.log('名字为空，跳过');
            return;
        }
        
        // 确保位置在单位上方
        const 调整后的位置 = new Vec3(位置.x, 位置.y + 2, 位置.z);
        console.log('调整后的位置:', 调整后的位置);
        
        // 初始化该名字的实例数组
        if (!this.实例数据.has(名字)) {
            this.实例数据.set(名字, []);
            console.log('创建新的名字实例数组:', 名字);
        }
        
        // 添加实例数据
        this.实例数据.get(名字)!.push({id: 实例ID, 位置: 调整后的位置});
        console.log('添加实例数据，当前实例数量:', this.实例数据.get(名字)!.length);
        
        // 更新渲染
        this.更新渲染(名字);
    }
    
    // 移除名字实例
    public 移除名字实例(名字: string, 实例ID: string | number) {
        if (!this.实例数据.has(名字)) {
            return;
        }
        
        const 实例数组 = this.实例数据.get(名字)!;
        const 索引 = 实例数组.findIndex(inst => inst.id === 实例ID);
        
        if (索引 !== -1) {
            实例数组.splice(索引, 1);
            console.log('移除名字实例，当前实例数量:', 实例数组.length);
            this.更新渲染(名字);
        } else {
            console.log('未找到要移除的名字实例，实例ID:', 实例ID);
        }
    }
    
    // 更新名字实例位置
    public 更新名字实例位置(名字: string, 实例ID: string | number, 新位置: Vec3) {
        if (!this.实例数据.has(名字)) {
            return;
        }
        
        // 考虑到添加时位置的调整
        const 调整后的新位置 = new Vec3(新位置.x, 新位置.y + 2, 新位置.z);
        
        const 实例数组 = this.实例数据.get(名字)!;
        const 实例 = 实例数组.find(inst => inst.id === 实例ID);
        
        if (实例) {
            实例.位置 = 调整后的新位置;
            console.log('更新名字实例位置，实例ID:', 实例ID, '新位置:', 调整后的新位置);
            this.更新渲染(名字);
        } else {
            console.log('未找到要更新的名字实例，实例ID:', 实例ID);
        }
    }
    
    // 清空所有实例
    public 清空所有实例() {
        // 销毁所有渲染器
        for (const [名字, 渲染器] of this.渲染器缓存) {
            渲染器.node.destroy();
        }
        
        // 清空缓存
        this.纹理缓存.clear();
        this.材质缓存.clear();
        this.渲染器缓存.clear();
        this.实例数据.clear();
    }
    
    // 更新渲染
    private 更新渲染(名字: string) {
        console.log('更新渲染:', 名字);
        
        const 实例数组 = this.实例数据.get(名字)!;
        console.log('实例数量:', 实例数组.length);
        
        // 如果没有实例，销毁渲染器
        if (实例数组.length === 0) {
            console.log('实例数量为0，销毁渲染器');
            if (this.渲染器缓存.has(名字)) {
                this.渲染器缓存.get(名字)!.node.destroy();
                this.渲染器缓存.delete(名字);
            }
            return;
        }
        
        // 获取或创建材质
        console.log('获取或创建材质');
        const 材质 = this.获取或创建材质(名字);
        
        // 检查材质是否创建成功
        if (!材质) {
            console.error('创建材质失败');
            return;
        }
        console.log('材质创建成功:', 材质);
        
        // 获取或创建渲染器
        console.log('获取或创建渲染器');
        const 渲染器 = this.获取或创建渲染器(名字, 材质);
        
        if (!渲染器) {
            console.error('创建渲染器失败');
            return;
        }
        console.log('渲染器创建成功:', 渲染器);
        
        // 检查渲染器是否有材质
        if (!渲染器.materials || 渲染器.materials.length === 0) {
            console.error('渲染器没有材质');
            return;
        }
        console.log('渲染器材质设置成功:', 渲染器.materials[0]);
        
        // 准备实例化数据
        const 实例数量 = 实例数组.length;
        const 位置数据 = new Float32Array(实例数量 * 3);
        console.log('准备实例化数据，实例数量:', 实例数量);
        
        for (let i = 0; i < 实例数量; i++) {
            const 实例 = 实例数组[i];
            
            // 位置数据
            位置数据[i * 3] = 实例.位置.x;
            位置数据[i * 3 + 1] = 实例.位置.y; // 位置已经在添加时调整过
            位置数据[i * 3 + 2] = 实例.位置.z;
        }
        
        // 更新材质的实例化属性
        console.log('更新材质的实例化属性');
        渲染器.setInstancedAttribute('inst_positions', 位置数据);
        console.log('渲染更新完成');
    }
    
    // 获取或创建材质
    private 获取或创建材质(名字: string): Material {
        console.log('获取或创建材质:', 名字);
        
        if (this.材质缓存.has(名字)) {
            console.log('材质已缓存，直接返回');
            return this.材质缓存.get(名字)!;
        }
        
        // 检查名字材质是否存在
        if (!this.名字材质) {
            console.error('名字材质未设置');
            return null!;
        }
        console.log('名字材质存在:', this.名字材质);
        
        // 获取或创建纹理
        console.log('获取或创建纹理');
        const 纹理 = this.获取或创建纹理(名字);
        console.log('纹理创建成功:', 纹理);
        
        // 创建新材质
        console.log('创建新材质');
        const 新材质 = new Material();
        新材质.initialize({ effectAsset: this.名字材质.effectAsset });
        新材质.setProperty('mainTexture', 纹理);
        新材质.setProperty('enableInstancing', 1);
        console.log('材质创建成功:', 新材质);
        
        this.材质缓存.set(名字, 新材质);
        return 新材质;
    }
    
    // 获取或创建纹理
    private 获取或创建纹理(名字: string): RenderTexture {
        if (this.纹理缓存.has(名字)) {
            return this.纹理缓存.get(名字)!;
        }
        
        // 渲染文本到纹理
        const 纹理 = this.渲染文本到纹理(名字);
        
        this.纹理缓存.set(名字, 纹理);
        return 纹理;
    }
    
    // 渲染文本到纹理
    private 渲染文本到纹理(名字: string): RenderTexture {
        // 确保画布节点和画布组件存在
        if (!this.画布节点) {
            this.画布节点 = new Node('CanvasNode');
            this.画布节点.parent = this.node;
            this.画布组件 = this.画布节点.addComponent(Canvas);
        } else if (!this.画布组件) {
            this.画布组件 = this.画布节点.addComponent(Canvas);
        }
        
        // 确保文本节点存在
        if (!this.文本节点) {
            this.文本节点 = new Node('TextNode');
            this.画布节点.addChild(this.文本节点);
            this.文本组件 = this.文本节点.addComponent(Label);
            this.文本组件.string = 名字;
            this.文本组件.fontSize = this.字体大小;
            this.文本组件.color = new Color(255, 255, 255, 255);
        } else {
            this.文本组件.string = 名字;
        }
        
        // 创建 RenderTexture
        const 渲染纹理 = new RenderTexture();
        渲染纹理.reset({ width: this.纹理宽度, height: this.纹理高度 });
        
        // 确保 cameraComponent 存在
        if (!this.画布组件.cameraComponent) {
            // 创建一个新的 Camera 组件
            this.画布组件.cameraComponent = this.画布节点.addComponent(Camera);
        }
        
        // 设置 Canvas 的 targetTexture
        this.画布组件.cameraComponent.targetTexture = 渲染纹理;
        
        // 激活画布进行渲染
        this.画布节点.active = true;
        
        // 强制更新渲染
        this.画布组件.scheduleOnce(() => {
            // 渲染完成后可以在这里处理
        }, 0);
        
        // 隐藏画布节点
        this.画布节点.active = false;
        return 渲染纹理;
        
    }
    
    // 获取或创建渲染器
    private 获取或创建渲染器(名字: string, 材质: Material): MeshRenderer {
        if (this.渲染器缓存.has(名字)) {
            return this.渲染器缓存.get(名字)!;
        }
        
        // 检查平面网格是否存在
        if (!this.平面网格) {
            console.error('平面网格未设置，无法创建渲染器');
            return null!;
        }
        
        // 创建新节点和渲染器
        const 节点 = new Node(`NameRenderer_${名字}`);
        节点.parent = this.node;
        
        // 设置缩放，确保名字能够被看到
        节点.setScale(0.1, 0.1, 0.1);
        
        const 渲染器 = 节点.addComponent(MeshRenderer);
        渲染器.mesh = this.平面网格;
        渲染器.materials = [材质];
        
        this.渲染器缓存.set(名字, 渲染器);
        return 渲染器;
    }
}
