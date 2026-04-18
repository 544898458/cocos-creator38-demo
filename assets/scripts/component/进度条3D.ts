import { _decorator, Component, Enum, MeshRenderer, Node } from 'cc';

const { ccclass, property, executeInEditMode } = _decorator;

export enum 进度条3D类型 {
    血条 = 0,
    能量条 = 1,
}

@executeInEditMode(true)
@ccclass('进度条3D')
export class 进度条3D extends Component {
    @property({ type: Enum(进度条3D类型), displayName: '类型' })
    类型: 进度条3D类型 = 进度条3D类型.血条;
    @property({ type: Node, displayName: '背景节点' })
    背景节点: Node | null = null;
    @property({ type: Node, displayName: '前景节点' })
    前景节点: Node | null = null;
    private _最大值 = 100;
    private _当前值 = 100;

    @property({ displayName: '最大值' })
    public get 最大值(): number {
        return this._最大值;
    }

    public set 最大值(value: number) {
        const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
        if (this._最大值 === normalized) return;
        this._最大值 = normalized;
        this.应用显示();
    }

    @property({ displayName: '当前值' })
    public get 当前值(): number {
        return this._当前值;
    }

    public set 当前值(value: number) {
        const normalized = Number.isFinite(value) ? value : 0;
        if (this._当前值 === normalized) return;
        this._当前值 = normalized;
        this.应用当前值到填充();
    }

    private 计算血条宽(hpMax: number): number {
        return Math.max(0.9, Math.sqrt(hpMax) / 2.35);
    }

    private 计算能量条宽(energyMax: number): number {
        return Math.max(0.75, Math.sqrt(energyMax) / 2.5);
    }

    private 计算背景宽(最大值: number): number {
        return this.类型 === 进度条3D类型.血条 ? this.计算血条宽(最大值) : this.计算能量条宽(最大值);
    }

    protected onEnable(): void {
        this.应用显示();
    }

    protected onValidate(): void {
        this.应用显示();
    }

    private 应用显示(): void {
        this._最大值 = Number.isFinite(this._最大值) ? Math.max(0, this._最大值) : 0;
        if (this._最大值 <= 0) {
            this.node.active = false;
            return;
        }
        this.node.active = true;
        this.刷新尺寸(this._最大值);
        this.应用当前值到填充();
    }

    public 初始化(最大值: number, 当前值: number): void {
        this._最大值 = Number.isFinite(最大值) ? Math.max(0, 最大值) : 0;
        this._当前值 = Number.isFinite(当前值) ? 当前值 : 0;
        this.应用显示();
    }

    public 刷新尺寸(最大值: number = this.最大值): void {
        if (!this.node.active) return;
        this._最大值 = Number.isFinite(最大值) ? Math.max(0, 最大值) : 0;
        if (this._最大值 <= 0) {
            this.node.active = false;
            return;
        }

        if (!this.背景节点?.isValid || !this.前景节点?.isValid) {
            console.warn('[HeadBar3D] 进度条3D缺少背景节点或前景节点，请在编辑器绑定', this.node.name);
            return;
        }

        const 背景宽 = this.计算背景宽(this._最大值);
        const 前景宽 = 背景宽;
        const 背景缩放 = this.背景节点.scale;
        const 前景缩放 = this.前景节点.scale;
        this.背景节点.setScale(背景宽, 背景缩放.y, 背景缩放.z);
        this.前景节点.setScale(前景宽, 前景缩放.y, 前景缩放.z);
    }

    private 应用当前值到填充(): void {
        if (this._最大值 <= 0) {
            this.设置填充(0);
            return;
        }
        if (this._当前值 >= this._最大值) {
            this.设置填充(1);
            return;
        }
        if (this._当前值 <= 0) {
            this.设置填充(0);
            return;
        }
        this.设置填充(this._当前值 / this._最大值);
    }

    public 设置填充(fill: number): void {
        if (!this.前景节点?.isValid) return;
        const normalizedFill = Number.isFinite(fill) ? Math.max(0, Math.min(1, fill)) : 0;
        this.设置状态条实例填充(normalizedFill);
    }

    private 设置状态条实例填充(fill: number): void {
        if (!this.前景节点?.isValid) return;
        const normalizedFill = Number.isFinite(fill) ? Math.max(0, Math.min(1, fill)) : 0;
        const renderer = this.前景节点.getComponent(MeshRenderer);
        if (renderer) {
            renderer.setInstancedAttribute('a_barFill', [normalizedFill]);
        }
    }
}
