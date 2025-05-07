/*
 * @Author: xiaohui
 * @Date: 2023-04-25 20:19:38
 * @LastEditors: xiaohui
 * @LastEditTime: 2023-04-27 19:43:20
 * @FilePath: /assets/script/framework/utils/ResourceUtil.ts
 * @Description: 资源管理
 */
import { Asset, assetManager, Component, error, find, ImageAsset, instantiate, isValid, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, Texture2D, Vec3, _decorator, __private } from 'cc';
// import { Session } from '../../modules/Session';
// import { Handler } from './Handler';
// import { image
const { ccclass, property } = _decorator;


export interface IRes {
    /** 资源路径 */
    path: string;
    /** imageAssets 资源唯一标识 */
    imageUUID: string;
    /** 最后引用的时间戳（单位：毫秒） */
    lastTime: number;
    /** 精灵帧贴图 */
    spriteFrame: SpriteFrame;
    loaded?: boolean;
}

/** 资源持有时间（单位：秒）超过这个时间没有被引用，则会被释放 */
const ResTime: number = 35;

@ccclass('ResourceUtil')
export class ResourceUtil {
    private static _dictPrefab: { [path: string]: Prefab } = {}//预制体字典

    /** 远程加载的图片缓存 */
    private static cacheSprite: { [name: string]: SpriteFrame } = {};

    /** Image.skin load 缓存 */
    static _cacheRes: { [url: string]: IRes } = {};

    private static waitForUI: boolean;

    public static loadEffectRes(efxPath: string, callBack: Function = (data: Prefab) => { }) {
        if (this._dictPrefab[efxPath]) {
            callBack && callBack(this._dictPrefab[efxPath])
        } else {
            resources.load(efxPath, Prefab, (err: any, prefab: Prefab) => {
                if (!err) {
                    this._dictPrefab[efxPath] = prefab;
                    callBack && callBack(prefab);
                }
            })
        }
    }
    //TODO
    // public static loadAvaRes(avaPath: string, progress: Handler, complete: Handler) {
    //     if (this._dictPrefab[avaPath]) {
    //         progress && progress.runWith([100, 100])
    //         complete && complete.runWith(this._dictPrefab[avaPath]);
    //     } else {
    //         resources.load(avaPath, Prefab, (finished, total) => {
    //             //console.log("进度")
    //             progress && progress.runWith([finished, total])
    //         }, (err: any, prefab: Prefab) => {
    //             if (!err) {
    //                 this._dictPrefab[avaPath] = prefab;
    //                 complete && complete.runWith(prefab);
    //             }
    //         })
    //     }
    // }

    /**
     * 加载资源
     * @param path 资源路径
     * @param type 资料类型
     * @param callBack 回调
     */
    public static loadRes<T extends Asset>(path: string, type: __private.__types_globals__Constructor<T>, callBack: Function = (err, data: T) => { }) {
        this.waitForUI = true;
        resources.load(path, type, (err, data: T) => {
            this.waitForUI = false;
            this.nextPreload();
            if (err) {
                console.error(err.message || err, ":" + path);
            }
            callBack && callBack(err, data);
        })
    }

    /**
    * 加载资源
    * @param path 资源路径
    * @param type 资料类型
    * @param callBack 回调
    */
    public static loadResSync<T extends Asset>(path: string, type: __private.__types_globals__Constructor<T>) {
        return new Promise<T>((resolve, reject) =>
            resources.load(path, type, (err, data: T) => {
                if (err) {
                    error(err.message || err);
                    reject();
                } else {
                    resolve(data);
                }
            }))
    }

    public static loadRemote<T extends Asset>(url: string, options: {
        [k: string]: any;
        ext?: string;
    }, type: __private.__types_globals__Constructor<T>, callBack: Function = (err, data: T) => { }) {
        assetManager.loadRemote(url, options, (err, res) => {
            let retVal: Asset = res;
            if (err) {
                error(err.message || err);
            } else if (res instanceof ImageAsset) {
                let spFrame = this.cacheSprite[res.uuid];
                if (!spFrame) {
                    const texture = new Texture2D();
                    texture.image = res;
                    spFrame = new SpriteFrame();
                    spFrame.texture = texture;
                    res.addRef();
                    this.cacheSprite[res.uuid] = spFrame; // 添加映射表记录
                }
                spFrame.addRef(); // 计数加1
                retVal = spFrame
            }

            callBack && callBack(err, retVal)
        })
    }

    /**
     * 根据资源路径，创角UI
     * @param path 
     * @param callback 
     * @param parent 
     */
    public static createUI<T extends Component>(path: string, parent?: Node, pos?: Vec3, callback: Function = (err, data: T) => { }, param?: any) {
        this.loadRes(path, Prefab, (err, data) => {
            if (!err) {
                var node: Node = instantiate(data);
                node.setPosition(0, 0, 0);
                if (!parent) {
                    parent = find("Canvas") as Node
                }
                node.parent = parent;
                if (pos) {
                    node.setPosition(pos)
                }
            }
            callback && callback(err, node, param);
        })
    }
    //TODO
    // /**
    //  * 设置精灵贴图
    //  * @param path 资源路径
    //  * @param sprite 精灵
    //  * @param callback 回调函数
    //  */
    // public static setSkin(path: string, sprite: Image, callback?: Function) {
    //     let selfT = this;
    //     let cacheData = selfT._cacheRes[path];
    //     if (cacheData != null && cacheData.spriteFrame != null && Math.round((Session.currTime - cacheData.lastTime) / 1000) < ResTime) {
    //         if (sprite && isValid(sprite)) {
    //             cacheData.lastTime = Date.now();
    //             cacheData.spriteFrame.addRef();//+1
    //             sprite.spriteFrame = cacheData.spriteFrame;
    //         } else {
    //             error('Target Sprite Failed! resPath：%d', path);
    //         }
    //     } else {
    //         selfT.loadRes(path, ImageAsset, (err: any, imageAsset: ImageAsset) => {
    //             if (err) {
    //                 error('set sprite frame failed! err:', path, err);
    //             } else {
    //                 cacheData = selfT._cacheRes[path];
    //                 if (null == cacheData) {
    //                     const texture = new Texture2D();
    //                     texture.image = imageAsset;
    //                     imageAsset.addRef();//持有1份
    //                     const spriteFrame = new SpriteFrame();
    //                     spriteFrame.texture = texture;
    //                     spriteFrame.name = path;
    //                     selfT._cacheRes[path] = cacheData = <IRes>{ path: path, imageUUID: imageAsset.uuid, spriteFrame: spriteFrame, lastTime: Date.now(), loaded: true };
    //                 }
    //                 if (sprite && isValid(sprite) && sprite._skin == cacheData.path) {
    //                     cacheData.lastTime = Date.now();
    //                     cacheData.spriteFrame.addRef();//+1
    //                     sprite.spriteFrame = cacheData.spriteFrame;
    //                 }
    //             }
    //             callback && callback(err, cacheData);
    //         });
    //     }
    // }

    /**
     * 通过图集设置精灵贴图
     * @param path 资源路径
    * @param sprite 精灵
    * @param key 图集中资源的名字 
    * @param callback 回调函数
    */
    public static setSkinByAtlas(path: string, sprite: Sprite, key: string, callback?: Function) {
        this.loadRes(path, SpriteAtlas, (err: any, atlas: SpriteAtlas) => {
            if (err) {
                error('set sprite frame failed! err:', path, err);
            } else {
                if (sprite && isValid(sprite)) {
                    sprite.spriteFrame = atlas.getSpriteFrame(key);
                }
            }
            callback && callback(err, atlas);
        });
    }


    /** 释放资源 */
    public static release(path): void {
        resources.release(path)
    }

    public static getPrefab(path: string): Prefab {
        return this._dictPrefab[path];
    }


    private static preloading: boolean;
    private static preloadList: string[] = []
    public static preload(path: string): void {
        this.preloadList.push(path)
        if (this.preloading) {
            return;
        }
        this.preloading = true;
        this.nextPreload();
    }
    private static nextPreload(): void {
        if (this.waitForUI) return;
        if (this.preloadList.length == 0) {
            this.preloading = false;
            return;
        }
        let path = this.preloadList.shift();
        resources.preload(path, (err, data) => {
            this.nextPreload();
        })
    }

    /** 手动释放远程加载的精灵纹理，使其引用计数器-1*/
    public static releaseImage(node: Node) {
        if (!isValid(node)) {
            return;
        }
        const sp = node.getComponent(Sprite) as Sprite;
        if (sp && sp.spriteFrame) {
            const spFrame = sp.spriteFrame;
            if (ResourceUtil._cacheRes[spFrame.name]) {
                ResourceUtil._cacheRes[spFrame.name].lastTime = Date.now();
            }
            sp.spriteFrame.decRef(false);//计数器-1
            sp.spriteFrame = null;

            //TODO 计数器置为0时，不会立即释放内存纹理，在持有一段时间后未有引用，则释放内存纹理

            // if (spFrame.refCount <= 0) { 
            //     let texture = spFrame.texture as Texture2D;
            //     // // 如果已加入动态合图，必须取原始的Texture2D
            //     if (spFrame.packable) {
            //         texture = spFrame.original?._texture as Texture2D;
            //     }
            //     // 删除映射表记录
            //     if (texture) {
            //         if (texture.image) {
            //             // delete this.resCache[spFrame.name];
            //             texture.image.decRef();
            //         }
            //         texture.destroy();
            //     }
            //     spFrame.destroy();
            // }
        }
    }

    /* 定时检查缓存资源 */
    public static checkCacheRes(): void {
        // if (Session.eventShow) return;
        for (const key in ResourceUtil._cacheRes) {
            const cacheData = ResourceUtil._cacheRes[key];
            const spFrame = cacheData.spriteFrame;
            //资源未被引用，且超过指定时间，则释放资源
            if (spFrame && spFrame.refCount <= 0 && !!cacheData.loaded && Math.round((/* Session.currTime -  */cacheData.lastTime) / 1000) >= ResTime) {
                let texture = spFrame.texture as Texture2D;
                // 如果已加入动态合图，必须取原始的Texture2D
                if (spFrame.packable && spFrame.original) {
                    texture = spFrame.original._texture as Texture2D;
                }
                // 删除映射表记录
                if (texture) {
                    delete ResourceUtil._cacheRes[key];
                    texture.image?.decRef();
                    texture.destroy();
                    // assetManager.releaseAsset(texture);
                    cacheData.spriteFrame = null;
                }
                // resources.release(path);
            }
        }
    }
}