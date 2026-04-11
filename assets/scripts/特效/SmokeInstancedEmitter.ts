import {
    Camera,
    Color,
    _decorator,
    Component,
    Director,
    director,
    game,
    isValid,
    Material,
    Mesh,
    MeshRenderer,
    Node,
    ParticleSystem,
    Quat,
    RenderRoot2D,
    resources,
    utils,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

const DEFAULT_MATERIAL_PATH = 'instanced/SmokeInstanced';
const MAX_PARTICLE_COUNT = 2048;
const QUAD_VERTEX_COUNT = 4;
const QUAD_INDEX_COUNT = 6;
const SHARED_BOUNDS_EXTENT = 4096;

type SmokeParticleState = {
    offset: Vec3;
    velocity: Vec3;
    spawnTime: number;
    life: number;
    startSize: number;
    endSize: number;
    angle: number;
    angularVelocity: number;
    frameSeed: number;
};

type SmokeBatchGeometry = {
    positions: Float32Array;
    uvs: Float32Array;
    colors: Float32Array;
    indices16?: Uint16Array;
    indices32?: Uint32Array;
    minPos: Vec3;
    maxPos: Vec3;
};

type SmokeRenderItem = {
    emitter: SmokeInstancedEmitter | null;
    particle: SmokeParticleState | null;
    age: number;
    distanceSq: number;
    worldX: number;
    worldY: number;
    worldZ: number;
    sizeScale: number;
};

const _cameraWorldPos = new Vec3();
const _cameraRightWorld = new Vec3();
const _cameraUpWorld = new Vec3();
const _particleLocalDisplacement = new Vec3();
const _particleScaledDisplacement = new Vec3();
const _particleWorldCenter = new Vec3();
const _particleToCameraWorld = new Vec3();

@ccclass('SmokeInstancedEmitter')
export class SmokeInstancedEmitter extends Component {
    private static defaultMaterial: Material | null = null;
    private static materialLoading = false;
    private static readonly emitters = new Set<SmokeInstancedEmitter>();
    private static readonly renderItems: SmokeRenderItem[] = [];
    private static sharedBatchNode: Node | null = null;
    private static sharedRenderer: MeshRenderer | null = null;
    private static sharedMesh: Mesh | null = null;
    private static sharedGeometry: SmokeBatchGeometry | null = null;
    private static sharedCapacity = 0;
    private static lastFrame = -1;
    private static warnedMaterialMismatch = false;
    private static ticking = false;
    private static lastDebugSignature = '';

    @property({ type: Material })
    materialOverride: Material | null = null;

    @property({ type: Camera })
    camera: Camera | null = null;

    @property({ type: Color })
    tintColor = new Color(230, 230, 230, 210);

    @property
    brightness = 1.2;

    @property
    particleCount = 12;

    @property
    spawnRadius = 0.08;

    @property
    spawnHeight = 0.02;

    @property
    minLifetime = 0.75;

    @property
    maxLifetime = 1.1;

    @property
    minStartSize = 0.18;

    @property
    maxStartSize = 0.26;

    @property
    endSizeScale = 1.9;

    @property
    riseSpeedMin = 0.45;

    @property
    riseSpeedMax = 0.9;

    @property
    driftSpeed = 0.12;

    @property
    spinSpeedMin = -1.2;

    @property
    spinSpeedMax = 1.2;

    @property
    atlasColumns = 4;

    @property
    atlasRows = 4;

    @property
    frameCount = 16;

    @property
    disableLegacyParticles = true;

    private readonly _particles: SmokeParticleState[] = [];

    onEnable(): void {
        this.forceActivate(this.camera);
    }

    onDisable(): void {
        SmokeInstancedEmitter.emitters.delete(this);
        this.unschedule(this._refreshSharedBatchNextFrame);
        SmokeInstancedEmitter._refreshTickingState();
    }

    onDestroy(): void {
        SmokeInstancedEmitter.emitters.delete(this);
        this.unschedule(this._refreshSharedBatchNextFrame);
        SmokeInstancedEmitter._refreshTickingState();
    }

    onValidate(): void {
        this.brightness = Math.max(0, this.brightness);
        this.particleCount = Math.max(1, Math.min(MAX_PARTICLE_COUNT, Math.floor(this.particleCount)));
        this.atlasColumns = Math.max(1, Math.floor(this.atlasColumns));
        this.atlasRows = Math.max(1, Math.floor(this.atlasRows));
        this.frameCount = Math.max(1, Math.floor(this.frameCount));
    }

    update(): void {
        SmokeInstancedEmitter._updateSharedBatch();
    }

    public forceActivate(camera: Camera | null = this.camera): void {
        if (camera) {
            this.camera = camera;
        }

        if (this.disableLegacyParticles) {
            this._disableLegacyParticles();
        }
        this._syncParticlePool(game.totalTime * 0.001);
        SmokeInstancedEmitter.emitters.add(this);
        console.log(
            '[SmokeInstancedEmitter] activate',
            SmokeInstancedEmitter._getNodePath(this.node),
            'parent=',
            this.node.parent?.name ?? 'null',
            'layer=',
            this.node.layer,
            'renderRoot=',
            SmokeInstancedEmitter._findRenderRoot2D(this.node)?.name ?? 'null',
            'camera=',
            this.camera?.node?.name ?? 'null',
        );
        SmokeInstancedEmitter._ensureTicking();
        SmokeInstancedEmitter.lastFrame = -1;
        SmokeInstancedEmitter._updateSharedBatch();
        this.unschedule(this._refreshSharedBatchNextFrame);
        this.scheduleOnce(this._refreshSharedBatchNextFrame, 0);
    }

    private _refreshSharedBatchNextFrame = (): void => {
        SmokeInstancedEmitter.lastFrame = -1;
        SmokeInstancedEmitter._updateSharedBatch();
    };

    private static _tickSharedBatch = (): void => {
        SmokeInstancedEmitter._updateSharedBatch();
    };

    private _syncParticlePool(now: number): void {
        while (this._particles.length < this.particleCount) {
            const particle: SmokeParticleState = {
                offset: new Vec3(),
                velocity: new Vec3(),
                spawnTime: 0,
                life: 1,
                startSize: 0.2,
                endSize: 0.3,
                angle: 0,
                angularVelocity: 0,
                frameSeed: 0,
            };

            this._particles.push(particle);
            this._respawnParticle(particle, now);
            particle.spawnTime -= Math.random() * particle.life * 0.8;
        }

        if (this._particles.length > this.particleCount) {
            this._particles.length = this.particleCount;
        }
    }

    private _respawnParticle(particle: SmokeParticleState, now: number): void {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.spawnRadius;
        const life = this._randRange(this.minLifetime, this.maxLifetime);
        const startSize = this._randRange(this.minStartSize, this.maxStartSize);
        const frameTotal = Math.max(1, Math.min(this.frameCount, this.atlasColumns * this.atlasRows));

        particle.spawnTime = now;
        particle.life = life;
        particle.startSize = startSize;
        particle.endSize = startSize * this.endSizeScale;
        particle.angle = Math.random() * Math.PI * 2;
        particle.angularVelocity = this._randRange(this.spinSpeedMin, this.spinSpeedMax);
        particle.frameSeed = Math.floor(Math.random() * frameTotal);

        particle.offset.set(
            Math.cos(angle) * radius,
            Math.random() * this.spawnHeight,
            Math.sin(angle) * radius,
        );
        particle.velocity.set(
            (Math.random() - 0.5) * this.driftSpeed,
            this._randRange(this.riseSpeedMin, this.riseSpeedMax),
            (Math.random() - 0.5) * this.driftSpeed,
        );
    }

    private _disableLegacyParticles(): void {
        const particleSystems = this.node.getComponentsInChildren(ParticleSystem);
        for (let i = 0; i < particleSystems.length; i++) {
            const particleSystem = particleSystems[i];
            particleSystem.enabled = false;
            if (particleSystem.node !== this.node) {
                particleSystem.node.active = false;
            }
        }
    }

    private _randRange(min: number, max: number): number {
        return min + (max - min) * Math.random();
    }

    private _lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    private _clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    private _smoothstep(min: number, max: number, value: number): number {
        const t = this._clamp01((value - min) / Math.max(max - min, 0.0001));
        return t * t * (3 - 2 * t);
    }

    private static _updateSharedBatch(): void {
        const frame = director.getTotalFrames();
        if (frame === SmokeInstancedEmitter.lastFrame) {
            return;
        }
        SmokeInstancedEmitter.lastFrame = frame;

        const scene = director.getScene();
        if (!scene) {
            SmokeInstancedEmitter._destroySharedBatch();
            return;
        }

        SmokeInstancedEmitter._cleanupEmitters();
        if (SmokeInstancedEmitter.emitters.size === 0) {
            if (SmokeInstancedEmitter.sharedRenderer) {
                SmokeInstancedEmitter.sharedRenderer.enabled = false;
            }
            return;
        }

        const material = SmokeInstancedEmitter._resolveBatchMaterial();
        if (!material) {
            return;
        }

        const batchParent = SmokeInstancedEmitter._resolveBatchParent(scene);
        if (!SmokeInstancedEmitter._ensureSharedBatchNode(batchParent, material)) {
            return;
        }

        const camera = SmokeInstancedEmitter._resolveBatchCamera(scene);
        if (!camera) {
            return;
        }

        SmokeInstancedEmitter._debugBatchState(batchParent, camera);

        const now = game.totalTime * 0.001;
        let totalParticles = 0;
        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            emitter._syncParticlePool(now);
            totalParticles += emitter._particles.length;
        });

        if (totalParticles <= 0) {
            if (SmokeInstancedEmitter.sharedRenderer) {
                SmokeInstancedEmitter.sharedRenderer.enabled = false;
            }
            return;
        }

        if (!SmokeInstancedEmitter.sharedGeometry || SmokeInstancedEmitter.sharedCapacity !== totalParticles) {
            SmokeInstancedEmitter._rebuildSharedMesh(totalParticles);
        }

        if (!SmokeInstancedEmitter.sharedGeometry || !SmokeInstancedEmitter.sharedMesh || !SmokeInstancedEmitter.sharedRenderer) {
            return;
        }

        SmokeInstancedEmitter.sharedRenderer.enabled = true;
        Vec3.copy(_cameraWorldPos, camera.node.worldPosition);
        Vec3.copy(_cameraRightWorld, camera.node.right);
        Vec3.copy(_cameraUpWorld, camera.node.up);
        Vec3.normalize(_cameraRightWorld, _cameraRightWorld);
        Vec3.normalize(_cameraUpWorld, _cameraUpWorld);

        const renderItems = SmokeInstancedEmitter.renderItems;
        let renderItemCount = 0;

        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            const rotation = emitter.node.worldRotation;
            const worldPosition = emitter.node.worldPosition;
            const worldScale = emitter.node.worldScale;
            const sizeScale = (Math.abs(worldScale.x) + Math.abs(worldScale.y) + Math.abs(worldScale.z)) / 3;
            for (let i = 0; i < emitter._particles.length; i++) {
                const particle = emitter._particles[i];
                let age = now - particle.spawnTime;
                if (age >= particle.life) {
                    emitter._respawnParticle(particle, now);
                    age = 0;
                }

                _particleLocalDisplacement.set(
                    particle.offset.x + particle.velocity.x * age,
                    particle.offset.y + particle.velocity.y * age,
                    particle.offset.z + particle.velocity.z * age,
                );
                _particleScaledDisplacement.set(
                    _particleLocalDisplacement.x * worldScale.x,
                    _particleLocalDisplacement.y * worldScale.y,
                    _particleLocalDisplacement.z * worldScale.z,
                );
                Vec3.transformQuat(_particleWorldCenter, _particleScaledDisplacement, rotation);
                Vec3.add(_particleWorldCenter, worldPosition, _particleWorldCenter);
                Vec3.subtract(_particleToCameraWorld, _cameraWorldPos, _particleWorldCenter);

                let item = renderItems[renderItemCount];
                if (!item) {
                    item = {
                        emitter: null,
                        particle: null,
                        age: 0,
                        distanceSq: 0,
                        worldX: 0,
                        worldY: 0,
                        worldZ: 0,
                        sizeScale: 1,
                    };
                    renderItems[renderItemCount] = item;
                }

                item.emitter = emitter;
                item.particle = particle;
                item.age = age;
                item.distanceSq = _particleToCameraWorld.lengthSqr();
                item.worldX = _particleWorldCenter.x;
                item.worldY = _particleWorldCenter.y;
                item.worldZ = _particleWorldCenter.z;
                item.sizeScale = sizeScale;
                renderItemCount++;
            }
        });

        renderItems.length = renderItemCount;
        renderItems.sort((a, b) => b.distanceSq - a.distanceSq);

        const { positions, uvs, colors } = SmokeInstancedEmitter.sharedGeometry;
        for (let i = 0; i < renderItems.length; i++) {
            const item = renderItems[i];
            const emitter = item.emitter!;
            const particle = item.particle!;
            const t = emitter._clamp01(item.age / particle.life);
            const size = emitter._lerp(particle.startSize, particle.endSize, t) * item.sizeScale;
            const half = size * 0.5;
            const angle = particle.angle + particle.angularVelocity * item.age;
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            const frameTotal = Math.max(1, Math.min(emitter.frameCount, emitter.atlasColumns * emitter.atlasRows));
            const frameStep = Math.min(frameTotal - 1, Math.floor(t * frameTotal));
            const frameIndex = (particle.frameSeed + frameStep) % frameTotal;
            const frameX = frameIndex % emitter.atlasColumns;
            const frameY = Math.floor(frameIndex / emitter.atlasColumns);
            const u0 = frameX / emitter.atlasColumns;
            const u1 = (frameX + 1) / emitter.atlasColumns;
            const v0 = frameY / emitter.atlasRows;
            const v1 = (frameY + 1) / emitter.atlasRows;
            const fadeIn = emitter._smoothstep(0, 0.12, t);
            const fadeOut = 1 - emitter._smoothstep(0.55, 1, t);
            const alpha = (emitter.tintColor.a / 255) * fadeIn * fadeOut;
            const colorR = (emitter.tintColor.r / 255) * emitter.brightness;
            const colorG = (emitter.tintColor.g / 255) * emitter.brightness;
            const colorB = (emitter.tintColor.b / 255) * emitter.brightness;
            const vertexBase = i * QUAD_VERTEX_COUNT;

            SmokeInstancedEmitter._writeParticleVertex(
                positions,
                uvs,
                colors,
                vertexBase + 0,
                item.worldX,
                item.worldY,
                item.worldZ,
                -half,
                -half,
                cosAngle,
                sinAngle,
                u0,
                v1,
                colorR,
                colorG,
                colorB,
                alpha,
            );
            SmokeInstancedEmitter._writeParticleVertex(
                positions,
                uvs,
                colors,
                vertexBase + 1,
                item.worldX,
                item.worldY,
                item.worldZ,
                half,
                -half,
                cosAngle,
                sinAngle,
                u1,
                v1,
                colorR,
                colorG,
                colorB,
                alpha,
            );
            SmokeInstancedEmitter._writeParticleVertex(
                positions,
                uvs,
                colors,
                vertexBase + 2,
                item.worldX,
                item.worldY,
                item.worldZ,
                -half,
                half,
                cosAngle,
                sinAngle,
                u0,
                v0,
                colorR,
                colorG,
                colorB,
                alpha,
            );
            SmokeInstancedEmitter._writeParticleVertex(
                positions,
                uvs,
                colors,
                vertexBase + 3,
                item.worldX,
                item.worldY,
                item.worldZ,
                half,
                half,
                cosAngle,
                sinAngle,
                u1,
                v0,
                colorR,
                colorG,
                colorB,
                alpha,
            );

        }

        SmokeInstancedEmitter.sharedGeometry.minPos.set(-SHARED_BOUNDS_EXTENT, -SHARED_BOUNDS_EXTENT, -SHARED_BOUNDS_EXTENT);
        SmokeInstancedEmitter.sharedGeometry.maxPos.set(SHARED_BOUNDS_EXTENT, SHARED_BOUNDS_EXTENT, SHARED_BOUNDS_EXTENT);
        SmokeInstancedEmitter.sharedMesh.updateSubMesh(0, SmokeInstancedEmitter.sharedGeometry as never);
    }

    private static _resolveBatchMaterial(): Material | null {
        let overrideMaterial: Material | null = null;

        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            if (!emitter.materialOverride) {
                return;
            }
            if (!overrideMaterial) {
                overrideMaterial = emitter.materialOverride;
                return;
            }

            if (overrideMaterial !== emitter.materialOverride && !SmokeInstancedEmitter.warnedMaterialMismatch) {
                SmokeInstancedEmitter.warnedMaterialMismatch = true;
                console.warn('SmokeInstancedEmitter found multiple materialOverride values. Shared smoke batch will use the first one.');
            }
        });

        if (overrideMaterial) {
            return overrideMaterial;
        }

        if (SmokeInstancedEmitter.defaultMaterial) {
            return SmokeInstancedEmitter.defaultMaterial;
        }

        if (SmokeInstancedEmitter.materialLoading) {
            return null;
        }

        SmokeInstancedEmitter.materialLoading = true;
        resources.load(DEFAULT_MATERIAL_PATH, Material, (err, material) => {
            SmokeInstancedEmitter.materialLoading = false;
            if (err || !material) {
                console.error('SmokeInstancedEmitter load material failed:', err);
                return;
            }

            SmokeInstancedEmitter.defaultMaterial = material;
            SmokeInstancedEmitter.lastFrame = -1;
            SmokeInstancedEmitter._updateSharedBatch();
        });

        return null;
    }

    private static _resolveBatchCamera(scene: Node): Camera | null {
        let resolvedCamera: Camera | null = null;
        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            if (!resolvedCamera && emitter.camera && isValid(emitter.camera, true)) {
                resolvedCamera = emitter.camera;
            }
        });

        if (resolvedCamera) {
            return resolvedCamera;
        }

        const mainCamera = scene.getChildByName('Main Camera')?.getComponent(Camera) ?? null;
        if (mainCamera && isValid(mainCamera, true) && mainCamera.enabledInHierarchy) {
            return mainCamera;
        }

        const cameras = scene.getComponentsInChildren(Camera);
        for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (isValid(camera, true) && camera.enabledInHierarchy) {
                return camera;
            }
        }

        return null;
    }

    private static _resolveBatchParent(scene: Node): Node {
        let batchParent: Node | null = null;

        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            if (batchParent) {
                return;
            }

            const renderRoot = SmokeInstancedEmitter._findRenderRoot2D(emitter.node);
            batchParent = renderRoot ?? scene;
        });

        return batchParent ?? scene;
    }

    private static _findRenderRoot2D(node: Node | null): Node | null {
        let current: Node | null = node;
        while (current) {
            if (current.getComponent(RenderRoot2D)) {
                return current;
            }
            current = current.parent;
        }

        return null;
    }

    private static _getNodePath(node: Node | null): string {
        if (!node) {
            return 'null';
        }

        const names: string[] = [];
        let current: Node | null = node;
        while (current) {
            names.push(current.name);
            current = current.parent;
        }

        names.reverse();
        return names.join('/');
    }

    private static _debugBatchState(batchParent: Node, camera: Camera): void {
        const emitterPaths: string[] = [];
        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            emitterPaths.push(SmokeInstancedEmitter._getNodePath(emitter.node));
        });
        emitterPaths.sort();

        const signature = [
            `emitters=${SmokeInstancedEmitter.emitters.size}`,
            `batchParent=${SmokeInstancedEmitter._getNodePath(batchParent)}`,
            `batchLayer=${SmokeInstancedEmitter.sharedBatchNode?.layer ?? -1}`,
            `camera=${camera.node.name}`,
            `cameraLayer=${camera.node.layer}`,
            `cameraVisibility=${camera.visibility}`,
            `renderer=${SmokeInstancedEmitter.sharedRenderer ? 'yes' : 'no'}`,
            `parents=${emitterPaths.join('|')}`,
        ].join(';');

        if (signature === SmokeInstancedEmitter.lastDebugSignature) {
            return;
        }

        SmokeInstancedEmitter.lastDebugSignature = signature;
        console.log('[SmokeInstancedEmitter] batch', signature);
    }

    private static _ensureTicking(): void {
        if (SmokeInstancedEmitter.ticking) {
            return;
        }

        director.on(Director.EVENT_AFTER_UPDATE, SmokeInstancedEmitter._tickSharedBatch);
        SmokeInstancedEmitter.ticking = true;
    }

    private static _refreshTickingState(): void {
        if (SmokeInstancedEmitter.emitters.size > 0) {
            SmokeInstancedEmitter._ensureTicking();
            return;
        }

        if (SmokeInstancedEmitter.ticking) {
            director.off(Director.EVENT_AFTER_UPDATE, SmokeInstancedEmitter._tickSharedBatch);
            SmokeInstancedEmitter.ticking = false;
        }
    }

    private static _ensureSharedBatchNode(parent: Node, material: Material): boolean {
        let combinedLayer = parent.layer;
        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            combinedLayer |= emitter.node.layer;
        });

        if (!SmokeInstancedEmitter.sharedBatchNode || !isValid(SmokeInstancedEmitter.sharedBatchNode, true) || SmokeInstancedEmitter.sharedBatchNode.parent !== parent) {
            SmokeInstancedEmitter._destroySharedBatch();

            const batchNode = new Node('SmokeInstancedSharedBatch');
            batchNode.parent = parent;
            batchNode.setPosition(0, 0, 0);
            batchNode.setRotation(Quat.IDENTITY);
            batchNode.setScale(1, 1, 1);
            batchNode.layer = combinedLayer;

            const renderer = batchNode.addComponent(MeshRenderer);
            renderer.sharedMaterials = [material];

            SmokeInstancedEmitter.sharedBatchNode = batchNode;
            SmokeInstancedEmitter.sharedRenderer = renderer;
        } else if (SmokeInstancedEmitter.sharedRenderer) {
            SmokeInstancedEmitter.sharedRenderer.sharedMaterials = [material];
            SmokeInstancedEmitter.sharedBatchNode.layer = combinedLayer;
        }

        return SmokeInstancedEmitter.sharedRenderer !== null;
    }

    private static _rebuildSharedMesh(totalParticles: number): void {
        if (!SmokeInstancedEmitter.sharedRenderer) {
            return;
        }

        if (SmokeInstancedEmitter.sharedMesh) {
            SmokeInstancedEmitter.sharedMesh.destroy();
        }

        const vertexCount = totalParticles * QUAD_VERTEX_COUNT;
        const indexCount = totalParticles * QUAD_INDEX_COUNT;
        const geometry = SmokeInstancedEmitter._createGeometry(vertexCount, indexCount);
        const mesh = new Mesh();

        utils.MeshUtils.createDynamicMesh(0, geometry, mesh, {
            maxSubMeshes: 1,
            maxSubMeshVertices: vertexCount,
            maxSubMeshIndices: indexCount,
        });

        SmokeInstancedEmitter.sharedGeometry = geometry;
        SmokeInstancedEmitter.sharedMesh = mesh;
        SmokeInstancedEmitter.sharedCapacity = totalParticles;
        SmokeInstancedEmitter.sharedRenderer.mesh = mesh;
    }

    private static _createGeometry(vertexCount: number, indexCount: number): SmokeBatchGeometry {
        const positions = new Float32Array(vertexCount * 3);
        const uvs = new Float32Array(vertexCount * 2);
        const colors = new Float32Array(vertexCount * 4);
        const useUint32 = vertexCount > 65535;
        const indices16 = useUint32 ? undefined : new Uint16Array(indexCount);
        const indices32 = useUint32 ? new Uint32Array(indexCount) : undefined;

        for (let i = 0; i < indexCount / QUAD_INDEX_COUNT; i++) {
            const vertexOffset = i * QUAD_VERTEX_COUNT;
            const indexOffset = i * QUAD_INDEX_COUNT;
            const target = indices32 ?? indices16!;
            target[indexOffset + 0] = vertexOffset + 0;
            target[indexOffset + 1] = vertexOffset + 1;
            target[indexOffset + 2] = vertexOffset + 2;
            target[indexOffset + 3] = vertexOffset + 2;
            target[indexOffset + 4] = vertexOffset + 1;
            target[indexOffset + 5] = vertexOffset + 3;
        }

        return {
            positions,
            uvs,
            colors,
            indices16,
            indices32,
            minPos: new Vec3(-SHARED_BOUNDS_EXTENT, -SHARED_BOUNDS_EXTENT, -SHARED_BOUNDS_EXTENT),
            maxPos: new Vec3(SHARED_BOUNDS_EXTENT, SHARED_BOUNDS_EXTENT, SHARED_BOUNDS_EXTENT),
        };
    }

    private static _writeParticleVertex(
        positions: Float32Array,
        uvs: Float32Array,
        colors: Float32Array,
        vertexIndex: number,
        centerX: number,
        centerY: number,
        centerZ: number,
        x: number,
        y: number,
        cosAngle: number,
        sinAngle: number,
        u: number,
        v: number,
        colorR: number,
        colorG: number,
        colorB: number,
        colorA: number,
    ): void {
        const localX = x * cosAngle - y * sinAngle;
        const localY = x * sinAngle + y * cosAngle;
        const px = centerX + _cameraRightWorld.x * localX + _cameraUpWorld.x * localY;
        const py = centerY + _cameraRightWorld.y * localX + _cameraUpWorld.y * localY;
        const pz = centerZ + _cameraRightWorld.z * localX + _cameraUpWorld.z * localY;

        const positionOffset = vertexIndex * 3;
        positions[positionOffset + 0] = px;
        positions[positionOffset + 1] = py;
        positions[positionOffset + 2] = pz;

        const uvOffset = vertexIndex * 2;
        uvs[uvOffset + 0] = u;
        uvs[uvOffset + 1] = v;

        const colorOffset = vertexIndex * 4;
        colors[colorOffset + 0] = colorR;
        colors[colorOffset + 1] = colorG;
        colors[colorOffset + 2] = colorB;
        colors[colorOffset + 3] = colorA;
    }

    private static _cleanupEmitters(): void {
        SmokeInstancedEmitter.emitters.forEach((emitter) => {
            if (!isValid(emitter, true) || !emitter.enabledInHierarchy) {
                SmokeInstancedEmitter.emitters.delete(emitter);
            }
        });
    }

    private static _destroySharedBatch(): void {
        if (SmokeInstancedEmitter.sharedBatchNode && isValid(SmokeInstancedEmitter.sharedBatchNode, true)) {
            SmokeInstancedEmitter.sharedBatchNode.destroy();
        }

        if (SmokeInstancedEmitter.sharedMesh) {
            SmokeInstancedEmitter.sharedMesh.destroy();
        }

        SmokeInstancedEmitter.sharedBatchNode = null;
        SmokeInstancedEmitter.sharedRenderer = null;
        SmokeInstancedEmitter.sharedMesh = null;
        SmokeInstancedEmitter.sharedGeometry = null;
        SmokeInstancedEmitter.sharedCapacity = 0;
    }
}
