// NetMessage.ts
import { Glob } from '../utils/Glob';
import { MsgId, SayChannel, 单位类型, 属性类型, 战局类型 } from '../utils/Enum';
import { MainTest } from '../MainTest';
import { LoginResult } from '../utils/Enum';
import { dispatcher } from '../manager/event/EventDispatcher';
import { EC } from '../utils/EC';
import { AudioMgr } from './audio/AudioMgr';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { instantiate } from 'cc';
import { Prefab } from 'cc';
import { resources } from 'cc';
import { ClientEntityComponent } from '../scene/Scene战斗';
import { 配置 } from '../配置/配置';
import { SkeletalAnimation, Animation } from 'cc';
import { 苔蔓Component } from '../component/苔蔓Component';
import { utils } from 'cc';
import { ProgressBar } from 'cc';
import { HeadScale } from '../component/head-scale';
import { Label } from 'cc';
import { ParticleSystem } from 'cc';
import { BattleUI } from '../ui/BattleUI';
import { UI2Prefab } from '../autobind/UI2Prefab';
import { Camera } from 'cc';
import { Vec3, tween } from 'cc';
import { assetManager } from 'cc';
import { AudioClip } from 'cc';
import { ImageAsset } from 'cc';
import { Texture2D } from 'cc';
import { MeshRenderer } from 'cc';

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
    
    // 聊天历史记录
    private chatHistory: ChatMessage[] = [];
    private maxChatHistory: number = 100; // 最大保存100条记录
    private chatMessageId: number = 0; // 消息ID计数器

    constructor() {
        // 可延迟加载 MainTest 实例
    }

    public setMainTest(mainTest: MainTest): void {
        this.mainTest = mainTest;
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
        const arr = msgpack.decode(new Uint8Array(payload))
        let msgHead = arr[0];
        let msgId = msgHead[0];
        let sn = msgHead[1] as number

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
        const id = arr[idxArr++];
        const nickName = arr[idxArr++];
        const entityName = arr[idxArr++];
        const prefabName = arr[idxArr++];
        const type = arr[idxArr++] as 单位类型;
        const hpMax = arr[idxArr++];
        const energyMax = arr[idxArr++];

        let old = scene战斗.entities.get(id)
        if (!old) {
            old = new ClientEntityComponent();
            old.hpMax = hpMax;
            old.能量Max = energyMax;
            old.prefabName = prefabName;
            old.类型 = type;
            scene战斗.entities.set(id, old);

            if (scene战斗.battleUI.lableCount != undefined)
                scene战斗.battleUI.lableCount.string = '共' + scene战斗.entities.size + '单位'

            let 单位配置 = MainTest.instance.配置.find单位(old.类型)
            if (单位配置){
                old.initClipName = 单位配置.空闲动作.名字或索引
                old.init初始动作播放速度 = 单位配置.空闲动作.播放速度
                old.init初始动作Loop = true
                old.init初始动作起始时刻秒 = 单位配置.空闲动作.起始时刻秒
                old.init初始动作结束时刻秒 = 单位配置.空闲动作.结束时刻秒
            }
            resources.load(prefabName, Prefab, (err, prefab) => {
                if(!prefab){
                    console.warn(id, '单位预设不存在', prefabName, err)
                    return;
                }
                old = scene战斗.entities.get(id)
                if (!old) {
                    // console.warn(id, '已离开战斗场景');
                    return;
                }

                const newNode = instantiate(prefab);
                scene战斗.roles.addChild(newNode);
                scene战斗.entityId[newNode.uuid] = id;

                // 加载骨骼动画等逻辑...
                old.view = newNode
                let 单位配置 = MainTest.instance.配置.find单位(old.类型)
                if (newNode.name == '基地')
                    old.skeletalAnimation = newNode.getChildByName('p_Base_02').getComponent(SkeletalAnimation)
                else if (newNode.name == '三色坦克')
                    old.skeletalAnimation = newNode.getChildByName('p_B_tank_03').getComponent(SkeletalAnimation)
                else if (newNode.name == '跳虫') {
                    old.skeletalAnimation = newNode.getChildByName('Zergling').getComponent(SkeletalAnimation)
                    // old.initClipName = 'Take 001'
                } else if (newNode.name == '刺蛇') {
                    old.skeletalAnimation = newNode.getChildByName('Hydralisk').getComponent(SkeletalAnimation)
                    // old.initClipName = 'Take 001'
                } else if (newNode.name == '工蜂') {
                    old.skeletalAnimation = newNode.getChildByName('Drone').getComponent(SkeletalAnimation)
                    // old.initClipName = 'Take 001'
                    // console.log('工蜂骨骼动画', old.skeletalAnimation)
                } else if (newNode.name == '地堡') {
                    old.skeletalAnimation = newNode.getChildByName('地堡872面').getComponent(Animation)
                    // old.initClipName = '平常状态'
                    // console.log('近战兵骨骼动画', old.skeletalAnimation)
                }
                else if (newNode.name == '飞机') {
                    old.skeletalAnimation = newNode.getChildByName('p_plane_01').getComponent(SkeletalAnimation)
                    old.initClipName = 'flight_04'
                    // console.log('近战兵骨骼动画', old.skeletalAnimation)
                }
                else if (单位配置 && 单位配置.动画节点路径) {
                    let node = newNode.getChildByName(单位配置.动画节点路径)
                    if (!node) {
                        console.warn(id, newNode, '骨骼动画节点不存在', 单位配置.动画节点路径)
                        return;
                    }
                    
                    old.skeletalAnimation = node.getComponent(单位配置.是骨骼动画 ? SkeletalAnimation : Animation)
                    // console.log(id, newNode, 单位配置.动画节点路径, 'skeletalAnimation=', old.skeletalAnimation)
                } else if (单位类型.苔蔓 == old.类型) {
                    old.view.getChildByName('苔蔓').getComponent(苔蔓Component).Set半径(old.苔蔓半径)

                } else
                    old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)

                if (old.skeletalAnimation != undefined) {
                    // old.skeletalAnimation.play(old.initClipName)
                    MainTest.播放动作(old, old.initClipName, old.init初始动作Loop, old.init初始动作播放速度, old.init初始动作起始时刻秒, old.init初始动作结束时刻秒)
                }
                // if (!thisLocal.scene战斗.battleUI)
                MainTest.instance.scene战斗.battleUI = MainTest.instance.dialogMgr.getDialog(UI2Prefab.BattleUI_url).getComponent(BattleUI);
                let node所有单位头顶名字 = MainTest.instance.scene战斗.battleUI.uiTransform所有单位头顶名字.node
                let nodeRoleName = utils.find("RoleName", node所有单位头顶名字)
                // console.log('RoleName',this.nodeRoleName)
                // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName

                old.nodeName = instantiate(nodeRoleName)
                old.nodeName.active = true
                node所有单位头顶名字.addChild(old.nodeName)

                if (newNode.name != "smoke") {
                    let nodeRoleHp = utils.find("血条", node所有单位头顶名字)
                    old.node血条 = instantiate(nodeRoleHp)
                    old.node血条.active = true;
                    node所有单位头顶名字.addChild(old.node血条)

                    if (hpMax <= 0)
                        old.node血条.active = false
                    else {
                        old.node血条.getComponent(ProgressBar).progress = old.hp() / old.hpMax
                        let calculateHPLength = Math.pow(old.hpMax, 0.5) / 3.0

                        let headScal = old.node血条.getComponent(HeadScale)
                        headScal.target = utils.find("血条", newNode)
                        headScal.camera = MainTest.instance.scene战斗.mainCamera
                        headScal.camera小地图 = MainTest.instance.scene战斗.camera小地图
                        headScal._hpValueScale = calculateHPLength;
                    }


                    if (0 < old.能量Max) {
                        let node能量条 = utils.find("能量条", node所有单位头顶名字)
                        old.node能量条 = instantiate(node能量条)
                        old.node能量条.active = true;
                        node所有单位头顶名字.addChild(old.node能量条)
                        old.node能量条.getComponent(ProgressBar).progress = old.能量() / old.能量Max
                        let 能量条长 = Math.pow(old.能量Max, 0.5) / 3.0
                        let headScal = old.node能量条.getComponent(HeadScale)
                        headScal.target = utils.find("能量条", newNode)
                        headScal.camera = MainTest.instance.scene战斗.mainCamera
                        headScal.camera小地图 = MainTest.instance.scene战斗.camera小地图
                        headScal._hpValueScale = 能量条长;
                    }

                }
                old.labelName = old.nodeName.getComponent(Label)
                {
                    let headScal = old.nodeName.getComponent(HeadScale)
                    headScal.target = utils.find("NamePos", newNode)
                    headScal.camera = MainTest.instance.scene战斗.mainCamera
                    headScal.camera小地图 = MainTest.instance.scene战斗.camera小地图
                }

                old.node描述 = instantiate(nodeRoleName)
                old.node描述.active = true
                node所有单位头顶名字.addChild(old.node描述)
                old.label描述 = old.node描述.getComponent(Label)
                {
                    let headScal = old.node描述.getComponent(HeadScale)
                    headScal.target = utils.find("描述", newNode)
                    headScal.camera = MainTest.instance.scene战斗.mainCamera
                    headScal.camera小地图 = MainTest.instance.scene战斗.camera小地图

                    // console.log(headScal.target)
                }


                let camera3D = utils.find("Main Camera", MainTest.instance.scene战斗.roles.parent).getComponent(Camera)
                // console.log('Main Camera',camera3D)
                //  headScal.camera = camera3D
                // headScal.distance = 55
                old.nickName = nickName
                old.entityName = entityName
                // old.labelName.string = old.nickName + '(' + id + ')hp=' + old.hp
                old.显示头顶名字(MainTest.instance.b显示单位类型) //+ ',hp=' + old.hp

                if (old.position != undefined)
                    old.view.position = old.position

                if (old.view.name == '黄光爆闪') {
                    var particleSystem = old.view.getChildByPath('collectYellow/collectYellow').getComponent(ParticleSystem)
                    particleSystem.play()
                }
            })
        } else {
            console.error('重复进入角色:', id);
        }
    }
    private handleGame_NotifyPos(arr: any[], idxArr: number): void {
        const mainTest = this.mainTest;
        if (!mainTest) return;

        const id = arr[idxArr++];
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
            if (!old.view.position || old.view.position.clone().subtract(old.position).lengthSqr() > 20) {
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
                old.tween移动 = tween(old.view).to(延时, {
                    position: old.position,
                    eulerAngles: old.eulerAngles
                });
                old.tween移动.start();
            }
        }
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

        Glob.str在线人数 = `${count}人在线:`;
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

        entity.removeFromParent();
        scene战斗.entities.delete(id);

        // 更新 UI 上的单位数量显示
        if (scene战斗.battleUI?.lableCount) {
            scene战斗.battleUI.lableCount.string = `共${scene战斗.entities.size}单位`;
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

        battleUI.lableGas.string = `燃气矿:${燃气矿}`;
        battleUI.lableCrystal.string = `晶体矿:${晶体矿}`;
        battleUI.lableUnit.string = `活动单位:${活动单位}/${活动单位上限}`;
        battleUI.lable建筑单位.string = `建筑单位:${建筑单位}/${建筑单位上限}`;
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
        if(0==配置.Https高清贴图.length)
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

        for (const key in obj属性数值) {
            const 属性 = parseInt(key) as 属性类型;
            const 数值 = obj属性数值[key];
            entity.obj属性数值[属性] = 数值;

            switch (属性) {
                case 属性类型.生命:
                    if (entity.node血条) {
                        const progressBar = entity.node血条.getComponent(ProgressBar);
                        if (entity.hpMax > 0) {
                            progressBar.progress = 数值 / entity.hpMax;
                        } else {
                            entity.node血条.active = false; // 资源没有血量
                        }
                    }
                    break;

                case 属性类型.能量:
                    if (entity.node能量条) {
                        const progressBar = entity.node能量条.getComponent(ProgressBar);
                        progressBar.progress = 数值 / entity.能量Max;
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
        if (entity && entity.label描述) {
            entity.label描述.string = desc;
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

        Glob.recvMsgSnGameSvr = 0;
        Glob.recvMsgSnWorldSvr = 0;
        Glob.recvMsgSn = 0;
        Glob.sendMsgSn = 0;

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
}