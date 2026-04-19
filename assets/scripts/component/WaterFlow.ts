import { _decorator, Component, Material, MeshRenderer, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WaterFlow')
export class WaterFlow extends Component {
    @property({ tooltip: 'U 方向流速（每秒）' })
    speedU = 0.04;

    @property({ tooltip: 'V 方向流速（每秒）' })
    speedV = 0.02;

    @property({ tooltip: '贴图平铺 U' })
    tileU = 1;

    @property({ tooltip: '贴图平铺 V' })
    tileV = 1;

    @property({ tooltip: '初始偏移 U' })
    offsetU = 0;

    @property({ tooltip: '初始偏移 V' })
    offsetV = 0;

    @property({ tooltip: '整体透明度' })
    opacity = 0.5;

    private _renderer: MeshRenderer | null = null;
    private _material: Material | null = null;
    private readonly _tilingOffset = new Vec4(1, 1, 0, 0);

    onLoad() {
        this._renderer = this.getComponent(MeshRenderer);
        if (!this._renderer) {
            return;
        }

        this._material = this._renderer.getMaterialInstance(0) || this._renderer.material;
        this._applyOffset();
        this._applyOpacity();
    }

    update(dt: number) {
        if (!this._material) {
            return;
        }

        this.offsetU = (this.offsetU + this.speedU * dt) % 1;
        // this.offsetV = (this.offsetV + this.speedV * dt) % 1;
        this._applyOffset();
        this._applyOpacity();
    }

    private _applyOffset() {
        if (!this._material) {
            return;
        }

        this._tilingOffset.set(this.tileU, this.tileV, this.offsetU, this.offsetV);
        this._material.setProperty('tilingOffset', this._tilingOffset);
    }

    private _applyOpacity() {
        if (!this._material) {
            return;
        }

        try {
            this._material.setProperty('opacity', this.opacity);
        } catch (error) {
        }
    }
}
