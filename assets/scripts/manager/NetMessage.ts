// NetMessage.ts
import { Glob } from '../utils/Glob';
import { MsgId, SayChannel, 单位类型, 属性类型, 战局类型 } from '../utils/Enum';
import { MainTest } from '../MainTest';
import { LoginResult } from '../utils/Enum';
import { dispatcher } from '../manager/event/EventDispatcher';
import { EC } from '../utils/EC';
import { AudioMgr } from './audio/AudioMgr';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import * as cc from 'cc';
import { instantiate, Node, Prefab, resources, SkeletalAnimation, Animation, utils, ParticleSystem, Camera, Quat, Vec3, tween, assetManager, AudioClip, ImageAsset, Texture2D, MeshRenderer, BoxCollider } from 'cc';
import { ClientEntity } from '../scene/ClientEntity';
import { 配置 } from '../配置/配置';
import { 苔蔓Component } from '../component/苔蔓Component';
import { 翻译Key } from '../配置/翻译Key';
import { toast } from './ToastMgr';
import { 文本3D } from '../component/文本3D';
import { 进度条3D } from '../component/进度条3D';

// 聊天消息接口
interface ChatMessage {
    content: string;
}

export class NetMessage {
    private static _instance: NetMessage;
    public static get instance(): NetMessage {
        if (!this._instance) {
            this._instance = new NetMessage();
        }
        return this._instance;
    }

    private mainTest: MainTest | null = null;
    
    // 3D文本材质缓存通过 MainTest 获取
    
    // 聊天历史记录
    private chatHistory: ChatMessage[] = [];
    private maxChatHistory: number = 100; // 最大保存100条记录
    private chatMessageId: number = 0; // 消息ID计数器

    constructor() {
        // 可延迟加载 MainTest 实例
    }

    private 刷新单位状态条尺寸(entity: ClientEntity) {
        this.mainTest?.scene战斗?.刷新单位状态条尺寸(entity);
    }

    public setMainTest(mainTest: MainTest): void {
        this.mainTest = mainTest;
        
        // 文本材质缓存通过编辑器设置
        console.log('文本材质缓存通过编辑器设置');
    }

    // 获取聊天历史记录
    public getChatHistory(): ChatMessage[] {
        return [...this.chatHistory]; // 返回副本以避免外部修改
    }

    // 清空聊天历史记录
    public clearChatHistory(): void {
        this.chatHistory = [];
        this.chatMessageId = 0;
    }

    // 记录聊天消息
    private recordChatMessage(content: string): void {
        const message: ChatMessage = {
            content: content,   
        };

        this.chatHistory.push(message);

        // 如果超过最大记录数，删除最旧的记录
        if (this.chatHistory.length > this.maxChatHistory) {
            this.chatHistory.shift();
        }

        console.log(`[聊天记录]: ${content}`);
    }

    // 接收并处理 WebSocket 消息
    public handle(event: MessageEvent): void {
        const data = event.data as ArrayBuffer;
        const arr = Glob.decodeMessage(data);

        const msgHead = arr[0];
        const msgId = msgHead[0] as MsgId;
        const sn收到 = msgHead[1] as number;

        Glob.recvMsgSn = (Glob.recvMsgSn + 1) % 256;

        if (Glob.recvMsgSn !== sn收到) {
            console.error('收到GateSvr消息sn不同', Glob.recvMsgSn, 'sn收到:', sn收到);
        }

        switch (msgId) {
            case MsgId.GateSvr转发GameSvr消息给游戏前端:
                const arrGameMsg = arr[1];
                this.handleGameMessage(arrGameMsg);
                break;

            case MsgId.GateSvr转发WorldSvr消息给游戏前端:
                const arrWorldMsg = arr[1];
                this.handleWorldMessage(arrWorldMsg);
                break;

            case MsgId.Login:
                this.handleLoginResponse(arr.slice(1));
                break;

            default:
                console.warn('未知消息ID:', msgId);
                break;
        }

        dispatcher.emit('network-message-received', { msgId, data: arr });
    }

    // 处理 GameSvr 消息
    private handleGameMessage(payload: any[]): void {
        const uint8Array = new Uint8Array(payload)
        const arr = msgpack.decode(uint8Array)
        let msgHead = arr[0];
        let msgId = msgHead[0];
        let sn = msgHead[1] as number
        //console.log('msgId', msgId, 'sn', sn, 'uint8Array.length', uint8Array.length)

        Glob.recvMsgSnGameSvr = (Glob.recvMsgSnGameSvr + 1) % 256;
        if (Glob.recvMsgSnGameSvr !== sn) {
            console.error(`recvMsgSnGameSvr mismatch: expected ${Glob.recvMsgSnGameSvr}, got ${sn}`);
            Glob.recvMsgSnGameSvr = sn;
        }
        //函数反射：注意新增函数名必须与带有handleGame_
        const handlerName = `handleGame_${MsgId[msgId]}`;
        if (typeof this[handlerName] === 'function') {
            this[handlerName](arr, 1);
        } else {
            console.warn(`未实现处理函数: ${handlerName}`);
        }
    }

    // 处理 WorldSvr 消息
    private handleWorldMessage(payload: any[]): void {
        const arr = msgpack.decode(new Uint8Array(payload))
        let msgHead = arr[0];
        let msgId = msgHead[0];
        const handlerName = `handleWorld_${MsgId[msgId]}`;
        if (typeof this[handlerName] === 'function') {
            this[handlerName](arr, 1);
        } else {
            console.warn(`未实现处理函数: ${handlerName}`);
        }
    }






    // 示例：处理 GameSvr 的 AddRoleRet 消息
    private handleGame_AddRoleRet(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const scene战斗 = mainTest.scene战斗;
        const id = arr[idxArr++] as number;
        const nickName = arr[idxArr++];
        const entityName = arr[idxArr++];
        const prefabName = arr[idxArr++] as string;
        const type = arr[idxArr++] as 单位类型;
        const hpMax = arr[idxArr++];
        const energyMax = arr[idxArr++];
        const pos = new Vec3(...(arr[idxArr++] as number[]));
        console.log('handleGame_AddRoleRet', id, nickName, entityName, prefabName, type, hpMax, energyMax, pos)

        if (scene战斗.entities.get(id)) {
            console.error('重复进入角色:', id);
            return;
        }

        let entityNew = new ClientEntity();
        entityNew.hpMax初始 = hpMax;
        entityNew.能量Max = energyMax;
        entityNew.prefabName = prefabName;
        entityNew.类型 = type;
        entityNew.position = pos
        entityNew.eulerAngles = Vec3.ZERO
        scene战斗.entities.set(id, entityNew);

        if (scene战斗.battleUI.lableCount != undefined)
            scene战斗.battleUI.lableCount.string = scene战斗.entities.size + 翻译Key.翻译(翻译Key.单位)

        let 单位配置 = MainTest.instance.配置.find单位(entityNew.类型)
        if (单位配置){
            entityNew.initClipName = 单位配置.空闲动作.名字或索引
            entityNew.init初始动作播放速度 = 单位配置.空闲动作.播放速度
            entityNew.init初始动作Loop = true
            entityNew.init初始动作起始时刻秒 = 单位配置.空闲动作.起始时刻秒
            entityNew.init初始动作结束时刻秒 = 单位配置.空闲动作.结束时刻秒
        }
        
        entityNew.nickName = nickName
        entityNew.entityName = entityName
        dispatcher.emit(EC.AddRole, entityNew)
        // if(entityNew.类型 == 单位类型.军绿色二足机甲)
        //     prefabName = '单位/活动单位/Q版女'
        
        let 此预制体回收池 = scene战斗.roles回收池.getChildByName(prefabName)
        if(此预制体回收池 && 此预制体回收池.children.length > 0) {
            let oldNode = 此预制体回收池.children[0];
            oldNode.removeFromParent()
            const boxCollider = oldNode.getComponent(BoxCollider)
            if(boxCollider)
                boxCollider.enabled = true
            else
                console.warn(id, '单位预设没有BoxCollider', prefabName)
            
            oldNode.active = true
            scene战斗.初始化单位节点(entityNew, oldNode, id, hpMax)
            
        }else{
            resources.load(prefabName, Prefab, (err, prefab) => {
                if(!prefab){
                    console.warn(id, '单位预设不存在', prefabName, err)
                    return;
                }
                entityNew = scene战斗.entities.get(id)
                if (!entityNew) {
                    console.warn(id, '已离开战斗场景');
                    return;
                }

                const newNode = instantiate(prefab);

                // 初始化单位节点
                scene战斗.初始化单位节点(entityNew, newNode, id, hpMax);
            })
        }
    }
    private handleGame_NotifyPos(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const id = arr[idxArr++] as number;
        const arrPos = arr[idxArr++] as Array<number>
        let eulerAnglesY = arr[idxArr++];

        const scene战斗 = mainTest.scene战斗;
        const old = scene战斗?.entities.get(id);
        if (!old) {
            // console.log('已离开战斗场景', id);
            return;
        }

        const posNew = new Vec3(arrPos[0], arrPos[1], arrPos[2]);
        // console.log('handleGame_NotifyPos', id, posNew)
        old.position = posNew;
        old.eulerAngles = new Vec3(0, eulerAnglesY, 0);
        if (old.view) {
            if (//MainTest.是抖音小游戏() || 
                !old.view.position || old.view.position.clone().subtract(old.position).lengthSqr() > 20) {
                old.view.position = old.position;
                old.view.eulerAngles = old.eulerAngles;
            } else {
                if (eulerAnglesY !== old.view.eulerAngles.y) {
                    if (eulerAnglesY - old.view.eulerAngles.y > 180) {
                        eulerAnglesY -= 360;
                    } else if (eulerAnglesY - old.view.eulerAngles.y < -180) {
                        eulerAnglesY += 360;
                    }
                }

                const 延时 = 0.15;
                old.tween移动?.stop();
                old.tween移动 = tween(old.view).to(延时, {
                    position: old.position,
                    eulerAngles: old.eulerAngles
                });
                old.tween移动.start();
            }
        }
        
        // 3D名字绑定单位预制中的“名字”节点后由 Name3DManager 自动跟随，无需手动同步位置
    }
    // 示例：处理 GameSvr 的 Say 消息
    private handleGame_Say(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const content = arr[idxArr++];
        const channel = arr[idxArr++] as SayChannel;

        AudioMgr.inst.playOneShot('音效/Transmission');

        if (!mainTest.scene战斗 || !mainTest.scene战斗.battleUI) return;

        const battleUI = mainTest.scene战斗.battleUI;
        switch (channel) {
            case SayChannel.系统:
                if (content.length > 0) battleUI.lable系统消息.string = content;
                break;
            case SayChannel.聊天:
                if (content.length > 0){
                    battleUI.lable聊天消息.string = content;
                    this.recordChatMessage(content);
                }
                break;
            case SayChannel.任务提示:
                if (content.length > 0) battleUI.richText任务提示.string = content;
                break;
        }
    }

    // 示例：处理 WorldSvr 的在线人数消息
    private handleWorld_在线人数(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const count = arr[idxArr++];
        const names = arr[idxArr++] as string[];

        Glob.str在线人数 = `${count}${翻译Key.翻译(翻译Key.人在线)}:`;
        names.forEach(name => Glob.str在线人数 += name + '、');

        if (!mainTest.b登录成功) {
            mainTest.b登录成功 = true;
            mainTest.scene登录.显示选择单人或多人()
        }
        mainTest.显示在线人数();
    }
    private handleGame_ChangeSkeleAnim(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const id = arr[idxArr++];
        const loop: boolean = arr[idxArr++]
        const clipName: string = arr[idxArr++]
        const 动作播放速度: number = arr[idxArr++]
        const f动作起始时刻秒: number = arr[idxArr++]
        const f动作结束时刻秒: number = arr[idxArr++]
        
        const scene战斗 = mainTest.scene战斗
        const old = scene战斗?.entities.get(id)
        if (!old) {
            console.log('handleGame_ChangeSkeleAnim 已离开战斗场景', id, clipName, loop, 动作播放速度, f动作起始时刻秒, f动作结束时刻秒)
            return;
        }

        // 获取单位类型枚举名字
        const enumKeys = Object.keys(单位类型);
        const enumValues = Object.values(单位类型);
        const 单位类型名称 = enumKeys[enumValues.indexOf(old.类型)];
        
        // console.log('handleGame_ChangeSkeleAnim', 单位类型名称, id, loop, clipName, 动作播放速度, f动作起始时刻秒, f动作结束时刻秒)


        if (old.skeletalAnimation == undefined) {
            old.initClipName = clipName
            old.init初始动作播放速度 = 动作播放速度
            old.init初始动作Loop = loop
            old.init初始动作起始时刻秒 = f动作起始时刻秒
            old.init初始动作结束时刻秒 = f动作结束时刻秒
        } else {
            MainTest.播放动作(old, clipName, loop, 动作播放速度, f动作起始时刻秒, f动作结束时刻秒);
        }
    }
    private handleGame_DelRoleRet(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const id = arr[idxArr++];
        const scene战斗 = mainTest.scene战斗;

        const entity = scene战斗?.entities.get(id);
        if (!entity) {
            console.warn('无法删除', id);
            return;
        }

        scene战斗.移除已删除单位的选中状态(id);
        entity.removeFromParent();
        scene战斗.entities.delete(id);

        // 更新 UI 上的单位数量显示
        if (scene战斗.battleUI?.lableCount) {
            scene战斗.battleUI.lableCount.string = `${scene战斗.entities.size} ${翻译Key.翻译(翻译Key.单位)}`;
        }
    }
    private handleGame_资源(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗 || !mainTest.scene战斗.battleUI) return;

        const battleUI = mainTest.scene战斗.battleUI;

        const 晶体矿 = arr[idxArr++];
        const 燃气矿 = arr[idxArr++];
        const 活动单位 = arr[idxArr++];
        const 活动单位上限 = arr[idxArr++];
        const 建筑单位 = arr[idxArr++];
        const 建筑单位上限 = arr[idxArr++];

        battleUI.lableGas.string = `${翻译Key.翻译(翻译Key.燃气矿)}:${燃气矿}`;
        battleUI.lableCrystal.string = `${翻译Key.翻译(翻译Key.晶体矿)}:${晶体矿}`;
        battleUI.lableUnit.string = `${翻译Key.翻译(翻译Key.活动单位)}:${活动单位}/${活动单位上限}`;
        battleUI.lable建筑单位.string = `${翻译Key.翻译(翻译Key.建筑单位)}:${建筑单位}/${建筑单位上限}`;
    }

    private handleGame_离开Space(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        mainTest.离开战斗场景(false);
    }
    private handleGame_进Space(arr: any[], idxArr: number): void {
        const 战局 = arr[idxArr++] as 战局类型
        MainTest.instance.战局 = 战局

        //加载高清贴图
        const 配置 = MainTest.instance.配置.find战局(战局)
        if(!配置.Https高清贴图 || 0 == 配置.Https高清贴图.length)
            return
        
        const nodeSpace = utils.find(配置.MeshRenderer路径, MainTest.GetMapNode())
        console.log('进Space', nodeSpace)
        if (nodeSpace) {
            assetManager.loadRemote(encodeURI(配置.Https高清贴图), (err, imageAsset: ImageAsset) => {
                console.log('地图高清贴图resources.load callback:', err, imageAsset)
                // console.log(this.material.getProperty('albedoMap'))
                // console.log(this.material.getProperty('mainTexture'))
                const meshRenderer = nodeSpace.getComponent(MeshRenderer);
                let texture:Texture2D = meshRenderer.material.getProperty('mainTexture') as Texture2D
                texture.image = imageAsset;
                console.log(texture)
                meshRenderer.material.setProperty('mainTexture', texture);
            })
        }
    }

    private handleGame_苔蔓半径(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const idEntity = arr[idxArr++] as number;
        const 半径 = arr[idxArr++] as number;

        mainTest.scene战斗.Set苔蔓半径(idEntity, 半径);
    }
    private handleGame_单位属性等级(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const dict属性等级 = arr[idxArr++] as object;
        console.log("单位属性等级", dict属性等级);
        mainTest.scene战斗.obj属性等级 = dict属性等级;
    }
    private handleGame_已解锁单位(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const dict已解锁单位 = arr[idxArr++] as object;
        console.log("已解锁单位", dict已解锁单位);
        mainTest.scene战斗.obj已解锁单位 = dict已解锁单位;
    }
    private handleGame_播放音乐(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.audioManager) return;

        const strHttps = arr[idxArr++] as string
        if (mainTest.scene登录)
            Glob.strHttps登录场景音乐Mp3 = strHttps
        
        mainTest.播放音乐(strHttps)
    }

    private handleGame_剧情对话已看完(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗 || !mainTest.scene战斗.battleUI) return;

        mainTest.scene战斗.battleUI.uiTransform剧情对话根.node.active = false;
    }

    private handleGame_剧情对话(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗 || !mainTest.scene战斗.battleUI) return;

        const str头像左 = arr[idxArr++] as string;
        const str名字左 = arr[idxArr++] as string;
        const str头像右 = arr[idxArr++] as string;
        const str名字右 = arr[idxArr++] as string;
        const str对话内容 = arr[idxArr++] as string;
        const b显示退出面板 = arr[idxArr++] as boolean;

        dispatcher.emit(EC.DIALOGUE, [str头像左, str名字左, str头像右, str名字右, str对话内容, b显示退出面板]);
    }

    private handleGame_弹丸特效(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const idEntity = arr[idxArr++] as number;
        const idEntityTarget = arr[idxArr++] as number;
        const str特效 = arr[idxArr++] as string;

        mainTest.scene战斗.弹丸特效(idEntity, idEntityTarget, str特效);
    }

    private handleGame_玩家多人战局列表(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene登录) return;

        const arr玩家 = arr[idxArr++] as string[][];
        console.log('handleGame_玩家多人战局列表', arr玩家)
        mainTest.scene登录?.显示战局列表(arr玩家, 'onClick进入别人的多人战局')
    }

    private handleGame_Notify属性(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const id = arr[idxArr++];
        const entity = mainTest.scene战斗.entities.get(id);

        if (!entity) {
            // console.warn('已离开战斗场景，无法更新属性:', id);
            return;
        }

        const obj属性数值 = arr[idxArr++] as object;
        this.刷新单位状态条尺寸(entity);

        for (const key in obj属性数值) {
            const 属性 = parseInt(key) as 属性类型;
            const 数值 = obj属性数值[key];
            entity.obj属性数值[属性] = 数值;

            switch (属性) {
                case 属性类型.生命:
                    if (entity.node血条?.isValid) {
                        const hpBar3D = entity.node血条.getComponent(进度条3D);
                        if (hpBar3D) {
                            hpBar3D.当前值 = 数值;
                        } else if (entity.hpMax初始 <= 0) {
                            entity.node血条.active = false; // 资源没有血量
                        }
                    }
                    break;

                case 属性类型.能量:
                    if (entity.node能量条?.isValid) {
                        const energyBar3D = entity.node能量条.getComponent(进度条3D);
                        if (energyBar3D) {
                            energyBar3D.当前值 = 数值;
                        }
                    }
                    break;
            }
        }
    }
    private handleGame_SelectRoles(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const arr选中 = arr[idxArr++] as number[];
        mainTest.scene战斗.选中(arr选中);
    }

    private handleGame_设置视口(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const arrPos视口 = arr[idxArr++] as number[];
        const pos = new Vec3(arrPos视口[0], arrPos视口[1], arrPos视口[2]);
        mainTest.scene战斗.视口对准此处(pos);
    }
    private handleGame_播放声音(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗 || !mainTest.scene战斗.battleUI) return;

        const str声音 = arr[idxArr++];
        const str文本 = arr[idxArr++];

        AudioMgr.inst.playOneShot(str声音);

        if (str文本.length > 0) {
            mainTest.scene战斗.battleUI.lable系统消息.string = str文本;
        }
    }

    private handleGame_Entity描述(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene战斗) return;

        const id = arr[idxArr++];
        const desc = arr[idxArr++];

        const entity = mainTest.scene战斗.entities.get(id);
        if (!entity) {
            return;
        }

        entity.描述文本 = (desc ?? '').toString().trim();
        if (!entity.node描述?.isValid && entity.view?.isValid) {
            entity.node描述 = utils.find('描述', entity.view);
        }

        if (!entity.node描述) {
            return;
        }

        if (entity.描述文本) {
            entity.node描述.getComponent(文本3D).文本 = entity.描述文本;
            entity.node描述.active = MainTest.instance.b显示名字;
        } else {
            entity.node描述.active = false;
        }
    }
    // 处理登录响应
    private handleLoginResponse(payload: any[]): void {
        const [rpcSnId, result, strMsg, idSvr] = payload as [number, LoginResult, string, number];

        console.log('rpcSnId', rpcSnId, 'result', result, 'strMsg', strMsg, 'idSvr', idSvr);
        MainTest.idSvr = idSvr;

        if (result === LoginResult.OK)
            return;

        //登录失败，显示错误信息
        dispatcher.emit(EC.SHOW_TOAST, strMsg);
        this.mainTest.scene登录.lableMessage.string = strMsg
        Glob.websocket?.close();
        Glob.websocket = null;

        Glob.清零网络数据包序号()

        dispatcher.emit(EC.SHOW_LOGIN_UI);
    }
    private handleGame_玩家个人战局列表(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest || !mainTest.scene登录) return;

        const arr玩家 = arr[idxArr++] as string[][];
        console.log('handleGame_玩家个人战局列表', arr玩家)
        mainTest.scene登录?.显示战局列表(arr玩家, 'onClick进入别人的个人战局')
        console.log('收到玩家个人战局列表:', arr玩家);
    }
    private handleGame_乒(arr: any[], idxArr: number): void {
    if(MainTest.time乒开始 == 0)
        return

    const fPing = Date.now() - MainTest.time乒开始
    MainTest.time乒开始 = 0
    toast.showToast(fPing.toString())
}
}
