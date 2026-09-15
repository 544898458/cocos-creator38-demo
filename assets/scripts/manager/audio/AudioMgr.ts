//AudioMgr.ts
import { Node, AudioSource, AudioClip, resources, director, Vec3, renderer } from 'cc';
import { MainTest } from '../../MainTest';
/**
 * @en
 * this is a sington class for audio play, can be easily called from anywhere in you project.
 * @zh
 * 这是一个用于播放音频的单件类，可以很方便地在项目的任何地方调用。
 */ 
export class AudioMgr {
    private static _inst: AudioMgr;
    public static get inst(): AudioMgr {
        if (this._inst == null) {
            this._inst = new AudioMgr();
        }
        return this._inst;
    }

    private _audioSource: AudioSource;
    constructor() {
        //@en create a node as audioMgr
        //@zh 创建一个节点作为 audioMgr
        let audioMgr = new Node();
        audioMgr.name = '__audioMgr__';

        //@en add to the scene.
        //@zh 添加节点到场景
        director.getScene().addChild(audioMgr);

        //@en make it as a persistent node, so it won't be destroied when scene change.
        //@zh 标记为常驻节点，这样场景切换的时候就不会被销毁了
        director.addPersistRootNode(audioMgr);

        //@en add AudioSource componrnt to play audios.
        //@zh 添加 AudioSource 组件，用于播放音频。
        this._audioSource = audioMgr.addComponent(AudioSource);
    }

    public get audioSource() {
        return this._audioSource;
    }

    /**
     * @en
     * play short audio, such as strikes,explosions
     * @zh
     * 播放短音频,比如 打击音效，爆炸音效等
     * @param sound clip or url for the audio
     * @param volume 
     */
    playOneShot(sound: AudioClip | string, volume: number = 1.0) {
        if (sound instanceof AudioClip) {
            this._audioSource.playOneShot(sound, volume);
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.playOneShot(clip, volume);
                }
            });
        }
    }

    播放声音(strSoundName: string, pos: Vec3) {
        let volume = 1.0;
        if (pos && !pos.equals(Vec3.ZERO)) {
            const scene战斗 = MainTest.instance?.scene战斗;
            const camera = scene战斗?.mainCamera;
            if (camera) {
                // The orthographic camera is clamped to 5..100 by the wheel zoom code.
                // Map that existing range directly to volume 1..0.
                const cameraPosition = camera.node.worldPosition;
                // 沿摄像机自身前方向发射射线，与地面 y=0 求交；
                // 再把交点垂直提升到摄像机高度，作为听觉上的“耳朵位置”。
                const forward = camera.node.forward.clone();
                let distance: number;
                if (Math.abs(forward.y) > 0.0001) {
                    const groundY = 0;
                    const rayDistance = (groundY - cameraPosition.y) / forward.y;
                    const groundPoint = cameraPosition.clone()
                        .add(forward.multiplyScalar(rayDistance));
                    const earPosition = new Vec3(
                        groundPoint.x,
                        cameraPosition.y,
                        groundPoint.z,
                    );
                    distance = Vec3.distance(earPosition, pos);
                } else {
                    // 摄像机方向接近平行地面时，退回到相机位置距离。
                    distance = Vec3.distance(cameraPosition, pos);
                }
                let maxDistance: number;
                if (camera.projection === renderer.scene.CameraProjection.ORTHO) {
                    // 正交投影镜头位置不随滚轮改变，平移距离必须直接参与衰减。
                    // 镜头越远（orthoHeight 越大），可听范围相应增大。
                    maxDistance = Math.max(camera.orthoHeight * 1.5, 1);
                    const referenceDistance = 30;
                    volume = distance >= maxDistance ? 0 : referenceDistance * referenceDistance /
                        (referenceDistance * referenceDistance + distance * distance);
                } else {
                    // 透视投影近大远小，按视觉效果校准最远听距。
                    maxDistance = 500;
                    const minDistance = 5;
                    const progress = Math.max(0, Math.min(1,
                        (distance - minDistance) / (maxDistance - minDistance)));
                    volume = distance <= minDistance ? 1 : Math.pow(1 - progress, 2);
                }
                /* {
                    // 平方反比衰减：距离越近变化越平滑，距离越远衰减越快。
                    const referenceDistance = 30;
                    const referenceDistanceSquared = referenceDistance * referenceDistance;
                    volume = referenceDistanceSquared /
                        (referenceDistanceSquared + distance * distance);
                } */
            }
        }
        this.playOneShot(strSoundName, volume);
    }

    /**
     * @en
     * play long audio, such as the bg music
     * @zh
     * 播放长音频，比如 背景音乐
     * @param sound clip or url for the sound
     * @param volume 
     */
    play(sound: AudioClip | string, volume: number = 1.0) {
        if (sound instanceof AudioClip) {
            this._audioSource.stop();
            this._audioSource.clip = sound;
            this._audioSource.play();
            this.audioSource.volume = volume;
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.stop();
                    this._audioSource.clip = clip;
                    this._audioSource.play();
                    this.audioSource.volume = volume;
                }
            });
        }
    }

    /**
     * stop the audio play
     */
    stop() {
        this._audioSource.stop();
    }

    /**
     * pause the audio play
     */
    pause() {
        this._audioSource.pause();
    }

    /**
     * resume the audio play
     */
    resume(){
        this._audioSource.play();
    }
}
