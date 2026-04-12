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

    @property({ tooltip: '该材质里偏移属性名，当前导入材质是 tilingOffset' })
    tilingOffsetProperty = 'Constant.tilingOffset';

    @property({ tooltip: '整体透明度' })
    opacity = 1.0;

    private _renderer: MeshRenderer | null = null;
    private _material: Material | null = null;
    private readonly _tilingOffset = new Vec4(1, 1, 0, 0);
    private _softShaderRequested = false;

    onLoad() {
        console.log('[WaterFlow] onLoad called');
        this._renderer = this.getComponent(MeshRenderer);
        console.log('[WaterFlow] Renderer:', this._renderer);
        if (!this._renderer) {
            console.warn(`[WaterFlow] 节点 ${this.node.name} 没有 MeshRenderer`);
            return;
        }

        // 使用默认的属性路径，直到effect加载成功
        this.tilingOffsetProperty = 'tilingOffset';
        console.log('[WaterFlow] Set tilingOffsetProperty to:', this.tilingOffsetProperty);

        // 使用材质实例，避免改到共享材质资产
        this._material = this._renderer.getMaterialInstance(0) || this._renderer.material;
        console.log('[WaterFlow] Initial material:', this._material);
        console.log('[WaterFlow] Initial tilingOffsetProperty:', this.tilingOffsetProperty);
        this._applyOffset();
        this._applyOpacity();
        console.log('[WaterFlow] Calling _tryEnableSoftEdgeShader...');
        this._tryEnableSoftEdgeShader();
        console.log('[WaterFlow] onLoad completed');
    }

    update(dt: number) {
        if (!this._material) {
            return;
        }

        this.offsetU = (this.offsetU + this.speedU * dt) % 1;
        this.offsetV = (this.offsetV + this.speedV * dt) % 1;
        this._applyOffset();
        this._applyOpacity(); // 每次更新都应用透明度，确保值被正确设置
        console.log('[WaterFlow] Update called, offsetU:', this.offsetU, 'offsetV:', this.offsetV, 'opacity:', this.opacity);
    }

    private _applyOffset() {
        if (!this._material) {
            return;
        }
        this._tilingOffset.set(this.tileU, this.tileV, this.offsetU, this.offsetV);
        this._material.setProperty(this.tilingOffsetProperty, this._tilingOffset);
        console.log('[WaterFlow] Offset applied:', this._tilingOffset, 'property:', this.tilingOffsetProperty);
    }

    private _applyOpacity() {
        if (!this._material) {
            return;
        }
        console.log('[WaterFlow] Applying opacity:', this.opacity);
        try {
            // 尝试使用Material.opacity属性
            this._material.setProperty('Material.opacity', this.opacity);
            // 检查属性是否设置成功
            const currentOpacity = this._material.getProperty('Material.opacity');
            console.log('[WaterFlow] Current opacity in material:', currentOpacity);
        } catch (error) {
            console.log('[WaterFlow] Error setting opacity:', error);
            // 尝试使用默认的opacity属性
            try {
                this._material.setProperty('opacity', this.opacity);
                // 检查属性是否设置成功
                const currentOpacity = this._material.getProperty('opacity');
                console.log('[WaterFlow] Current opacity in material (default):', currentOpacity);
            } catch (error2) {
                console.log('[WaterFlow] Error setting default opacity:', error2);
            }
        }
    }

    private _tryEnableSoftEdgeShader() {
        console.log('[WaterFlow] _tryEnableSoftEdgeShader called');
        if (this._softShaderRequested || !this._renderer) {
            console.log('[WaterFlow] _tryEnableSoftEdgeShader skipped: softShaderRequested=', this._softShaderRequested, 'renderer=', this._renderer);
            return;
        }
        this._softShaderRequested = true;

        console.log('[WaterFlow] Loading soft-edge effect...');
        console.log('[WaterFlow] Resources path:', 'instanced/WaterWaveSoftEdge');
        console.log('[WaterFlow] Current renderer:', this._renderer);
        resources.load('instanced/WaterWaveSoftEdge', EffectAsset, (err, effectAsset) => {
            console.log('[WaterFlow] Resources.load callback called');
            if (err || !effectAsset || !this._renderer) {
                console.warn('[WaterFlow] load soft-edge effect failed:', err);
                // 即使effect加载失败，也使用默认的属性路径
                this.tilingOffsetProperty = 'tilingOffset';
                return;
            }

            console.log('[WaterFlow] Soft-edge effect loaded successfully:', effectAsset.name);
            const sourceTexture = this._material?.getProperty('mainTexture') as Texture2D | null;
            console.log('[WaterFlow] Source texture:', sourceTexture);

            const mat = new Material();
            mat.initialize({ effectAsset });
            console.log('[WaterFlow] New material created:', mat);
            if (sourceTexture) {
                mat.setProperty('mainTexture', sourceTexture);
                console.log('[WaterFlow] Main texture set');
            }

            // 检查材质是否支持opacity属性
            try {
                mat.setProperty('Material.opacity', this.opacity);
                console.log('[WaterFlow] Material supports Material.opacity property');
            } catch (error) {
                console.log('[WaterFlow] Material does not support Material.opacity property:', error);
                // 尝试使用默认的opacity属性
                try {
                    mat.setProperty('opacity', this.opacity);
                    console.log('[WaterFlow] Material supports opacity property');
                } catch (error2) {
                    console.log('[WaterFlow] Material does not support opacity property:', error2);
                }
            }

            this._renderer.sharedMaterials = [mat];
            this._material = this._renderer.getMaterialInstance(0) || mat;
            
            console.log('[WaterFlow] New material applied:', this._material);
            // Update property names for the new shader
            this.tilingOffsetProperty = 'tilingOffset';

            this._applyOffset();
            this._applyOpacity();
            console.log('[WaterFlow] Opacity applied:', this.opacity);
        });
    }

    public checkEffectStatus() {
        console.log('[WaterFlow] Effect status check:');
        console.log('Current material:', this._material);
        if (this._material) {
            console.log('Material effect name:', this._material.effectAsset?.name);
            console.log('Current opacity value:', this.opacity);
            console.log('Tiling offset property:', this.tilingOffsetProperty);
        }
    }
}
