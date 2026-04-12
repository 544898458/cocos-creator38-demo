import { _decorator, Color, Component, EffectAsset, Material, MeshRenderer, Texture2D, Vec4, resources } from 'cc';
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
    tilingOffsetProperty = 'tilingOffset';

    @property({ tooltip: '是否自动把灰度波浪着色为水色' })
    applyWaterStyle = true;

    @property({ tooltip: '尝试复用同级 sea 节点的彩色贴图' })
    useSiblingSeaTexture = false;

    @property({ tooltip: '水体基础颜色（会乘到灰度波浪图）' })
    waterColor = new Color(82, 150, 220, 255);

    @property({ tooltip: '高光颜色' })
    specularColor = new Color(235, 245, 255, 255);

    @property({ tooltip: '漫反射强度' })
    albedoScale = 1;

    @property({ tooltip: '高光强度' })
    specularFactor = 1.6;

    @property({ tooltip: '高光聚焦程度' })
    shininessExponent = 56;

    @property({ tooltip: '自发光颜色（用于避免仍显灰）' })
    emissiveColor = new Color(40, 120, 210, 255);

    @property({ tooltip: '自发光强度' })
    emissiveScale = 0.16;

    @property({ tooltip: '是否同步给同级 sea 节点做轻度着色，减弱边缘断层' })
    styleSiblingSea = true;

    @property({ tooltip: 'sea 节点基础颜色' })
    seaColor = new Color(95, 150, 210, 255);

    @property({ tooltip: 'sea 节点自发光颜色' })
    seaEmissiveColor = new Color(20, 80, 140, 255);

    @property({ tooltip: 'sea 节点自发光强度' })
    seaEmissiveScale = 0.04;

    @property({ tooltip: '启用软边水面 shader（推荐）' })
    useSoftEdgeShader = true;

    @property({ tooltip: '软边 shader 资源路径（resources 内）' })
    softEdgeEffectPath = 'instanced/WaterWaveSoftEdge';

    @property({ tooltip: '软边浅色' })
    softShallowColor = new Color(110, 175, 235, 255);

    @property({ tooltip: '软边深色' })
    softDeepColor = new Color(42, 96, 170, 255);

    @property({ tooltip: '软边总体透明度' })
    softOpacity = 0.78;

    @property({ tooltip: '边缘过渡宽度（越大越柔）' })
    softEdgeFadeWidth = 0.22;

    @property({ tooltip: '边缘曲线（越大边缘越软）' })
    softEdgePower = 1.7;

    @property({ tooltip: '波纹强度' })
    softWaveStrength = 1.05;

    @property({ tooltip: '高光色' })
    softSpecularTint = new Color(235, 245, 255, 255);

    @property({ tooltip: '高光增强' })
    softSpecularBoost = 0.35;

    private _renderer: MeshRenderer | null = null;
    private _material: Material | null = null;
    private _seaMaterial: Material | null = null;
    private readonly _tilingOffset = new Vec4(1, 1, 0, 0);
    private _styleTick = 0;
    private _softShaderRequested = false;
    private _usingSoftShader = false;

    onLoad() {
        this._renderer = this.getComponent(MeshRenderer);
        if (!this._renderer) {
            console.warn(`[WaterFlow] 节点 ${this.node.name} 没有 MeshRenderer`);
            return;
        }

        // 使用材质实例，避免改到共享材质资产
        this._material = this._renderer.getMaterialInstance(0) || this._renderer.material;
        this._applyWaterStyle();
        this._applyOffset();
        this._tryEnableSoftEdgeShader();
    }

    update(dt: number) {
        if (!this._material) {
            return;
        }

        this.offsetU = (this.offsetU + this.speedU * dt) % 1;
        this.offsetV = (this.offsetV + this.speedV * dt) % 1;
        if (this.offsetU < 0) this.offsetU += 1;
        if (this.offsetV < 0) this.offsetV += 1;

        this._applyOffset();

        // 某些导入材质可能在运行期被覆盖，定期重新应用样式保证可见效果
        this._styleTick += dt;
        if (this._styleTick >= 0.5) {
            this._styleTick = 0;
            this._applyWaterStyle();
        }
    }

    private _applyOffset() {
        if (!this._material) {
            return;
        }
        this._tilingOffset.set(this.tileU, this.tileV, this.offsetU, this.offsetV);
        this._material.setProperty(this.tilingOffsetProperty, this._tilingOffset);
    }

    private _applyWaterStyle() {
        if (!this._material || !this.applyWaterStyle) {
            return;
        }

        if (!this._usingSoftShader && this.useSiblingSeaTexture) {
            this._tryApplySiblingSeaTexture();
        }

        if (this._usingSoftShader) {
            this._material.setProperty('shallowColor', this.softShallowColor);
            this._material.setProperty('deepColor', this.softDeepColor);
            this._material.setProperty('opacity', this.softOpacity);
            this._material.setProperty('edgeFadeWidth', this.softEdgeFadeWidth);
            this._material.setProperty('edgePower', this.softEdgePower);
            this._material.setProperty('waveStrength', this.softWaveStrength);
            this._material.setProperty('specularTint', this.softSpecularTint);
            this._material.setProperty('specularBoost', this.softSpecularBoost);
        } else {
            // 兼容旧导入材质：同时写新旧别名属性
            this._material.setProperty('mainColor', this.waterColor);
            this._material.setProperty('diffuseColor', this.waterColor);
            this._material.setProperty('specularColor', this.specularColor);
            this._material.setProperty('albedoScale', this.albedoScale);
            this._material.setProperty('diffuseFactor', this.albedoScale);
            this._material.setProperty('specularFactor', this.specularFactor);
            this._material.setProperty('shininessExponent', this.shininessExponent);
            this._material.setProperty('emissive', this.emissiveColor);
            this._material.setProperty('emissiveScale', this.emissiveScale);
            this._applySiblingSeaStyle();
        }
    }

    private _tryApplySiblingSeaTexture() {
        if (!this._renderer || !this._material) {
            return;
        }

        const parent = this.node.parent;
        const nodeSea = parent?.getChildByName('sea');
        const seaRenderer = nodeSea?.getComponent(MeshRenderer);
        const seaMaterial = seaRenderer?.getMaterialInstance(0) || seaRenderer?.material;
        if (!seaMaterial) {
            return;
        }

        const seaMainTexture = seaMaterial.getProperty('mainTexture') as Texture2D | null;
        if (seaMainTexture) {
            this._material.setProperty('mainTexture', seaMainTexture);
        }
    }

    private _applySiblingSeaStyle() {
        if (!this.styleSiblingSea) {
            return;
        }

        const parent = this.node.parent;
        const nodeSea = parent?.getChildByName('sea');
        const seaRenderer = nodeSea?.getComponent(MeshRenderer);
        if (!seaRenderer) {
            return;
        }

        this._seaMaterial = seaRenderer.getMaterialInstance(0) || seaRenderer.material;
        if (!this._seaMaterial) {
            return;
        }

        // 给 sea 做轻度同色调，避免和 wave 之间出现明显硬边
        this._seaMaterial.setProperty('mainColor', this.seaColor);
        this._seaMaterial.setProperty('diffuseColor', this.seaColor);
        this._seaMaterial.setProperty('emissive', this.seaEmissiveColor);
        this._seaMaterial.setProperty('emissiveScale', this.seaEmissiveScale);
    }

    private _tryEnableSoftEdgeShader() {
        if (!this.useSoftEdgeShader || this._softShaderRequested || !this._renderer) {
            return;
        }
        this._softShaderRequested = true;

        resources.load(this.softEdgeEffectPath, EffectAsset, (err, effectAsset) => {
            if (err || !effectAsset || !this._renderer) {
                console.warn('[WaterFlow] load soft-edge effect failed:', err);
                return;
            }

            const sourceTexture = this._getMainTextureFromCurrentMaterial();

            const mat = new Material();
            mat.initialize({ effectAsset });
            if (sourceTexture) {
                mat.setProperty('mainTexture', sourceTexture);
            }

            this._renderer.sharedMaterials = [mat];
            this._material = this._renderer.getMaterialInstance(0) || mat;
            this._usingSoftShader = true;

            this._applyWaterStyle();
            this._applyOffset();
        });
    }

    private _getMainTextureFromCurrentMaterial(): Texture2D | null {
        const textureFromCurrent = this._material?.getProperty('mainTexture') as Texture2D | null;
        if (textureFromCurrent) {
            return textureFromCurrent;
        }

        const fallbackMaterial = this._renderer?.material;
        if (!fallbackMaterial) {
            return null;
        }

        return fallbackMaterial.getProperty('mainTexture') as Texture2D | null;
    }
}
