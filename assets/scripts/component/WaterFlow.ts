import { _decorator, Component, EffectAsset, Material, MeshRenderer, Texture2D, Vec4, resources } from 'cc';
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
    private _softShaderRequested = false;

    onLoad() {
        this._renderer = this.getComponent(MeshRenderer);
        if (!this._renderer) {
            return;
        }

        // 使用材质实例，避免改到共享材质资产
        this._material = this._renderer.getMaterialInstance(0) || this._renderer.material;

        this._applyOffset();
        this._applyOpacity();
        this._tryEnableSoftEdgeShader();
    }

    update(dt: number) {
        if (!this._material) {
            return;
        }

        this.offsetU = (this.offsetU + this.speedU * dt) % 1;
        // this.offsetV = (this.offsetV + this.speedV * dt) % 1;
        this._applyOffset();
        this._applyOpacity(); // 每次更新都应用透明度，确保值被正确设置
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
            // 使用默认的属性路径
            this._material.setProperty('opacity', this.opacity);
        } catch (error) {
        }
    }

    private _tryEnableSoftEdgeShader() {
        if (this._softShaderRequested || !this._renderer) {
            return;
        }
        this._softShaderRequested = true;

        resources.load('instanced/WaterWaveSoftEdge', EffectAsset, (err, effectAsset) => {
            if (err || !effectAsset || !this._renderer) {
                return;
            }

            const sourceTexture = this._material?.getProperty('mainTexture') as Texture2D | null;

            const mat = new Material();
            mat.initialize({ effectAsset });
            if (sourceTexture) {
                mat.setProperty('mainTexture', sourceTexture);
            }

            // 检查材质是否支持opacity属性
            try {
                // 使用默认的属性路径
                mat.setProperty('opacity', this.opacity);
            } catch (error) {
            }

            this._renderer.sharedMaterials = [mat];
            this._material = this._renderer.getMaterialInstance(0) || mat;
            
            this._applyOffset();
            this._applyOpacity();
        });
    }


}
