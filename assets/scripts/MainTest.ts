import { _decorator, Component, Node, Animation } from 'cc';
import { Glob } from './utils/Glob';
import { DialogManager } from './manager/DialogManager';
import { UI2Prefab } from './autobind/UI2Prefab';
import { sceneMgr } from './manager/SceneManager';
import { game } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { MsgId, 单位类型, 副本ID, 属性类型, SayChannel } from './utils/Enum';
import { SkeletalAnimation } from 'cc';
import { resources } from 'cc';
import { Prefab } from 'cc';
import { assetManager } from 'cc';
import { AudioSource } from 'cc';
import { AudioClip } from 'cc';
import { Label } from 'cc';
import { ClientEntityComponent, Scene战斗 } from './scene/Scene战斗';
import { Vec3 } from 'cc';
import { instantiate } from 'cc';
import { ProgressBar } from 'cc';
import { director } from 'cc';
import { 配置 } from './配置/配置';
import { dispatcher } from './manager/event/EventDispatcher';
import { EventMouse } from 'cc';
import { 按下按钮显示单位详情Component } from './component/按下按钮显示单位详情Component';
import { 苔蔓Component } from './component/苔蔓Component';
import { utils } from 'cc';
import { HeadScale } from './component/head-scale';
import { Camera } from 'cc';
import { ParticleSystem } from 'cc';
import { tween } from 'cc';
import { AudioMgr } from './manager/audio/AudioMgr';
import { AnimationClip } from 'cc';
import { AnimationState } from 'cc';
import { Quat } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('MainTest')
export class MainTest extends Component {
    // 单例实例
    private static _instance: MainTest;
    public static get instance(): MainTest {
        return this._instance;
    }

    dialogMgr: DialogManager;
    @property(Scene战斗)
    scene战斗: Scene战斗 = null;
    //摄像机
    @property(Node)
    cavas: Node = null;
    @property(AudioSource)
    audioManager: AudioSource;
    arr选中: number[] = []
    b显示单位类型: boolean = true
    b点击活动单位都是追加选中: boolean = false

    interstitialAd = null// 定义插屏广告    微信流量主
    fun关闭插屏广告发消息: () => void
    b已显示插屏广告: boolean = false
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    配置: 配置 = new 配置()

    funCreateMsg造建筑: (Vec3) => object
    fun创建消息: (Vec3) => object = null//this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    onLoad() {
        // 确保只有一个实例
        if (MainTest._instance) {
            this.node.destroy();
            return;
        }
        MainTest._instance = this;

        //屏幕适配参数初始化
        Glob.init();
        //新建窗口管理
        this.dialogMgr = new DialogManager();
        //初始化层级
        this.dialogMgr.inital(this.cavas);
        //监听登录
        sceneMgr.initial();


        console.log('onLoad')
        //添加dataNode为常驻节点
        director.addPersistRootNode(this.node);

    }
    send选中(arr选中: number[]) {
        if (Glob.websocket != undefined) {
            dispatcher.sendArray([
                [MsgId.SelectRoles, ++Glob.sendMsgSn, 0],
                arr选中,//虽然是整数，但是也强制转成FLOAT64发出去了
                this.b点击活动单位都是追加选中
            ])
        }

        this.arr选中 = arr选中
    }
    createMsgMove遇敌自动攻击(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, true)
    }
    // funCreateMsgMove遇敌自动攻击 = this.createMsgMove遇敌自动攻击
    createMsgMove强行走(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, false)
    }
    createMsgMove(hitPoint: Vec3, b遇敌自动攻击: boolean) {
        if (0 == this.arr选中.length)
            return null

        return [[MsgId.Move, 0],
        [hitPoint.x, hitPoint.z],
            b遇敌自动攻击
        ]
    }
    start() {
        console.log('start')
        //打开加载页面
        this.dialogMgr.openDialog(UI2Prefab.LoadingView_url)
        //TODO:读取配置文件
        //this.配置.读取配置文件()
    }

    update(deltaTime: number) {

    }
    造活动单位(类型: 单位类型) {
        // console.log(encoded)
        dispatcher.sendArray([[MsgId.AddRole, 0, 0], 类型])
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.三色坦克)
    }
    onClick造活动单位(event: EventMouse, customEventData: string): void {
        const node: Node = event.target as Node
        let 单位 = node.getComponent(按下按钮显示单位详情Component).enum类型
        this.造活动单位(单位)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.近战兵)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.工程车)
    }
    onClickAdd飞机(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.飞机)
    }
    onClickAdd工虫(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.工虫)
    }
    onClickAdd近战虫() {
        this.造活动单位(单位类型.近战虫)
    }
    onClickAdd枪虫() {
        this.造活动单位(单位类型.枪虫)
    }
    onClickAdd绿色坦克() {
        this.造活动单位(单位类型.绿色坦克)
    }
    onClickAdd飞虫() {
        this.造活动单位(单位类型.飞虫)
    }
    onClickAdd房虫() {
        this.造活动单位(单位类型.房虫)
    }
    createMsg造建筑(hitPoint: Vec3, 类型: 单位类型) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.AddBuilding, ++Glob.sendMsgSn, 0], 类型, [hitPoint.x, hitPoint.z]]
    }
    on点击按钮_造建筑(类型: 单位类型) {
        this.fun创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.funCreateMsg造建筑 = this.fun创建消息
        this.scene战斗.battleUI.lable系统消息.string = '请点击地面放置建筑'
        this.scene战斗.battleUI.进入点击地面状态()
    }
    on升级单位属性(单位: 单位类型, 属性: 属性类型) {
        dispatcher.sendArray([[MsgId.升级单位属性, ++Glob.sendMsgSn, 0], 单位, 属性])
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.基地)
    }
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.地堡)
    }
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.兵厂)
    }

    onClickAdd民房(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.民房)
    }
    onClickAdd炮台(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.炮台)
    }
    onClickAdd孵化场(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.虫巢)
    }
    onClickAdd机场(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.机场)
    }
    onClickAdd重工厂(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.重车厂)
    }
    onClickAdd虫营(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.虫营)
    }
    onClickAdd飞塔(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.飞塔)
    }
    onRecvGameSvr(data: ArrayBuffer) {
        let thisLocal = this
        // console.log("收到数据：", data, data.byteLength)
        const arr = msgpack.decode(new Uint8Array(data))
        // console.log("msgpack.decode结果：", data, data.byteLength)
        let idxArr = 0
        let msgHead = arr[idxArr++]
        let msgId = msgHead[0] as MsgId
        let sn = msgHead[1] as number
        // console.log("收到,msgId：", msgId, ',sn:', sn)
        Glob.recvMsgSnGameSvr = (Glob.recvMsgSnGameSvr + 1) % 256;
        if (Glob.recvMsgSnGameSvr != sn) {
            console.error('recvMsgSnGameSvr ', Glob.recvMsgSnGameSvr, 'sn', sn)
            Glob.recvMsgSnGameSvr = sn;
        }
        // console.log("sn", sn)
        switch (msgId) {
            case MsgId.AddRoleRet:
                {
                    // console.log('登录成功')
                    let id: number = arr[idxArr++]
                    let nickName: string = arr[idxArr++]
                    let entityName: string = arr[idxArr++]
                    let prefabName: string = arr[idxArr++]
                    let 类型: number = arr[idxArr++] as 单位类型
                    let hpMax: number = arr[idxArr++]
                    let 能量Max: number = arr[idxArr++]

                    // if (!thisLocal.scene战斗) {
                    //     // console.log(
                    //     return
                    // }
                    let old = thisLocal.scene战斗.entities.get(id)
                    if (old == undefined) {
                        old = new ClientEntityComponent()
                        old.hpMax = hpMax
                        old.能量Max = 能量Max
                        old.prefabName = prefabName
                        old.类型 = 类型
                        thisLocal.scene战斗.entities.set(id, old)
                        if (thisLocal.scene战斗.battleUI.lableCount != undefined)
                            thisLocal.scene战斗.battleUI.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'

                        let 单位配置 = this.配置.find单位(old.类型)
                        if (单位配置)
                            old.initClipName = 单位配置.空闲动作

                        resources.load(prefabName, Prefab, (err, prefab) => {
                            // console.log('resources.load callback:', err, prefab)
                            if (!thisLocal.scene战斗.roles) {
                                console.warn('已离开战斗场景')
                                return
                            }
                            const newNode = instantiate(prefab)
                            thisLocal.scene战斗.roles.addChild(newNode)
                            thisLocal.scene战斗.entityId[newNode.uuid] = id
                            //newNode.position = new Vec3(posX, 0, 0)
                            // console.log('resources.load newNode', newNode)

                            old.view = newNode
                            let 单位配置 = this.配置.find单位(old.类型)
                            if (newNode.name == '基地')
                                old.skeletalAnimation = newNode.getChildByName('p_Base_02').getComponent(SkeletalAnimation)
                            else if (newNode.name == '步兵')
                                old.skeletalAnimation = newNode.getChildByName('p_A_rifle_01').getComponent(SkeletalAnimation)
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
                            } else if (newNode.name == '光子炮') {
                                old.skeletalAnimation = newNode.getChildByName('平常状态').getComponent(Animation)
                                old.initClipName = '平常状态'
                                // console.log('光子炮骨骼动画', old.skeletalAnimation)
                            } else if (newNode.name == '兵厂') {
                                old.skeletalAnimation = newNode.getChildByName('barracks').getComponent(Animation)
                                // old.initClipName = '平常状态'
                                // console.log('兵厂骨骼动画', old.skeletalAnimation)
                            } else if (newNode.name == '近战兵') {
                                old.skeletalAnimation = newNode.getChildByName('Idle').getComponent(SkeletalAnimation)
                                // old.initClipName = '平常状态'
                                // console.log('近战兵骨骼动画', old.skeletalAnimation)
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
                                old.skeletalAnimation = newNode.getChildByName(单位配置.动画节点路径).getComponent(SkeletalAnimation)
                                // console.log('骨骼动画', 单位配置.动画节点路径, old.skeletalAnimation)
                            } else if (单位类型.苔蔓 == old.类型) {
                                old.view.getChildByName('苔蔓').getComponent(苔蔓Component).Set半径(old.苔蔓半径)

                            } else
                                old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)

                            if (old.skeletalAnimation != undefined) {
                                // old.skeletalAnimation.play(old.initClipName)
                                MainTest.播放动作(old, old.initClipName, true)
                            }
                            let node所有单位头顶名字 = thisLocal.scene战斗.battleUI.uiTransform所有单位头顶名字.node
                            let nodeRoleName = utils.find("RoleName", node所有单位头顶名字)
                            // console.log('RoleName',this.nodeRoleName)
                            // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName

                            old.nodeName = instantiate(nodeRoleName)
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
                                    headScal._hpValueScale = 能量条长;
                                }

                            }
                            old.labelName = old.nodeName.getComponent(Label)
                            {
                                let headScal = old.nodeName.getComponent(HeadScale)
                                headScal.target = utils.find("NamePos", newNode)
                            }

                            old.node描述 = instantiate(nodeRoleName)
                            node所有单位头顶名字.addChild(old.node描述)
                            old.label描述 = old.node描述.getComponent(Label)
                            {
                                let headScal = old.node描述.getComponent(HeadScale)
                                headScal.target = utils.find("描述", newNode)
                                // console.log(headScal.target)
                            }


                            let camera3D = utils.find("Main Camera", thisLocal.scene战斗.roles.parent).getComponent(Camera)
                            // console.log('Main Camera',camera3D)
                            //  headScal.camera = camera3D
                            // headScal.distance = 55
                            old.nickName = nickName
                            old.entityName = entityName
                            // old.labelName.string = old.nickName + '(' + id + ')hp=' + old.hp
                            old.显示头顶名字(thisLocal.b显示单位类型) //+ ',hp=' + old.hp

                            if (old.position != undefined)
                                old.view.position = old.position

                            if (old.view.name == '黄光爆闪') {
                                var particleSystem = old.view.getChildByPath('collectYellow/collectYellow').getComponent(ParticleSystem)
                                particleSystem.play()
                            }
                        })
                    }
                    else {
                        console.error('重复进入', id)
                    }
                }
                break
            case MsgId.NotifyPos:
                {
                    let id = arr[idxArr++]
                    let posX = arr[idxArr++]
                    let posZ = arr[idxArr++]
                    let eulerAnglesY = arr[idxArr++]
                    // let hp = arr[idxArr++]
                    // let 能量 = arr[idxArr++]
                    // console.log(arr)

                    let old = thisLocal.scene战斗?.entities.get(id)
                    if (!old) {
                        console.log('已离开战斗场景', id)
                        return
                    }

                    // old.skeletalAnimation.play('run')
                    let posNew = new Vec3(posX, 0, posZ)
                    old.position = posNew
                    if (old.view) {

                        if (!old.view.position || old.view.position.clone().subtract(old.position).lengthSqr() > 20) {
                            old.view.position = old.position
                            old.view.eulerAngles = new Vec3(0, eulerAnglesY, 0)
                        }
                        else {
                            // old.tween移动?.stop()
                            // let quat: Quat
                            if (eulerAnglesY != old.view.eulerAngles.y) {
                                // quat = new Quat();
                                // old.view.eulerAngles = new Vec3(0, (old.view.eulerAngles.y + 360) % 360, 0)
                                // eulerAnglesY = (eulerAnglesY + 360) % 360
                                if (eulerAnglesY - old.view.eulerAngles.y > 180)
                                    eulerAnglesY -= 360
                                else if (eulerAnglesY - old.view.eulerAngles.y < -180)
                                    eulerAnglesY += 360
                                // Quat.fromEuler(quat, 0, eulerAnglesY, 0);
                                // tween(old.view).to(0.2, { rotation: quat }).start()
                                // old.labelName.string = old.nickName + '(' + id + ')hp=' + hp
                                // old.labelName.string = old.nickName// + 'hp=' + hp
                                // old.hpbar&&(old.hpbar.getComponent(ProgressBar).progress = old.hp / old.hpMax);//todo等后端传最大血量 20测试用
                            }
                            // if (quat)
                            let 延时 = 0.15 // this.配置.find战斗(old.类型).f每帧移动距离
                            old.tween移动 = tween(old.view).to(延时, { position: old.position, eulerAngles: new Vec3(0, eulerAnglesY, 0) })
                            // else
                            // old.view.eulerAngles = new Vec3(0, eulerAnglesY, 0)
                            // old.tween移动 = tween(old.view).to(0.15, { position: old.position })
                            old.tween移动.start()
                        }
                    }
                }
                break
            case MsgId.ChangeSkeleAnim:
                {
                    let id = arr[idxArr++]
                    let loop: boolean = arr[idxArr++]
                    let clipName: string = arr[idxArr++]
                    // console.log(id, '动作改为', clipName)
                    if (!thisLocal.scene战斗) {
                        // console.log(
                        return
                    }
                    let old = thisLocal.scene战斗.entities.get(id)
                    if (old == undefined) {
                        // console.log(id,"还没加载好,没有播放动作",clipName)
                        return
                    }
                    if (old.skeletalAnimation == undefined) {
                        old.initClipName = clipName
                    } else {
                        MainTest.播放动作(old, clipName, loop)
                        // if (单位类型.光子炮 != old.类型) {
                        //     old.tween移动?.stop()
                        //     old.tween移动 = null
                        // }
                        // old.view.position = old.position
                        // tween(old.view).to(0.1, {position:old.position}).start()
                    }
                }
                break
            case MsgId.Say:
                {
                    let content = arr[idxArr++]
                    let channel = arr[idxArr++] as SayChannel
                    console.log(channel, '说:', content, thisLocal)
                    AudioMgr.inst.playOneShot('音效/Transmission')
                    //TODO 显示对话
                    // if (thisLocal.scene登录 && thisLocal.scene登录.lableMessage)
                    //     thisLocal.scene登录.lableMessage.string = content

                    if (!thisLocal.scene战斗 || !thisLocal.scene战斗.battleUI)
                        return

                    switch (channel) {
                        case SayChannel.系统:
                            if (content.length > 0)
                                thisLocal.scene战斗.battleUI.lable系统消息.string = content
                            break
                        case SayChannel.聊天:
                            if (content.length > 0)
                                thisLocal.scene战斗.battleUI.lable聊天消息.string = content
                            break
                        case SayChannel.任务提示:
                            if (content.length > 0)
                                thisLocal.scene战斗.battleUI.richText任务提示.string = content
                            break
                    }

                }
                break
            case MsgId.DelRoleRet:
                {
                    let id = arr[idxArr++]
                    // console.log('删除:', id)
                    if (!thisLocal.scene战斗)
                        return

                    let entity = thisLocal.scene战斗.entities.get(id);
                    // entity.hpbar?.destroy();
                    if (entity == undefined) {
                        console.warn('无法删除', id)
                        return
                    }

                    entity.removeFromParent()
                    thisLocal.scene战斗.entities.delete(id)
                    if (thisLocal.scene战斗.battleUI.lableCount != undefined)
                        thisLocal.scene战斗.battleUI.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'
                }
                break
            case MsgId.NotifyeMoney:
                {
                    let finalMoney = arr[idxArr++]
                    // thisLocal.scene战斗.battleUI.lableCrystal.string = '晶体矿:' + finalMoney
                }
                break
            case MsgId.资源:
                {
                    let 晶体矿 = arr[idxArr++]
                    let 燃气矿 = arr[idxArr++]
                    let 活动单位 = arr[idxArr++]
                    let 活动单位上限 = arr[idxArr++]
                    thisLocal.scene战斗.battleUI.lableGas.string = '燃气矿:' + 燃气矿
                    thisLocal.scene战斗.battleUI.lableCrystal.string = '晶体矿:' + 晶体矿
                    thisLocal.scene战斗.battleUI.lableUnit.string = '活动单位:' + 活动单位 + '/' + 活动单位上限
                }
                break
            case MsgId.进Space:
                {
                    // thisLocal.scene战斗.battleUI.node.active = true
                    // director.loadScene('scene战斗')
                }
                break
            case MsgId.显示界面_没用到:
                {
                    //thisLocal.scene战斗.quitGame.active = true
                }
                break
            case MsgId.离开Space:
                {
                    thisLocal.回到登录场景()
                }
                break
            case MsgId.Entity描述:
                {
                    let id = arr[idxArr++]
                    let desc = arr[idxArr++]
                    // console.log('描述:', id, desc)
                    let entity = thisLocal.scene战斗.entities.get(id)
                    if (entity == undefined) {
                        // console.log(id,"还没加载好,没有播放动作",clipName)
                        return
                    }
                    if (entity.label描述 != undefined) {
                        entity.label描述.string = desc
                    }

                }
                break
            case MsgId.播放声音:
                {
                    let str声音 = arr[idxArr++]
                    let str文本 = arr[idxArr++]
                    AudioMgr.inst.playOneShot(str声音)
                    if (str文本.length > 0)
                        thisLocal.scene战斗.battleUI.lable系统消息.string = str文本
                }
                break
            case MsgId.设置视口:
                {
                    let arrPos视口 = arr[idxArr++] as number[]
                    console.log('arrPos视口', arrPos视口)
                    thisLocal.scene战斗.视口对准此处(new Vec3(arrPos视口[0], 0, arrPos视口[1]))
                }
                break
            case MsgId.SelectRoles:
                {
                    let arr选中 = arr[idxArr++] as number[]
                    thisLocal.scene战斗.选中(arr选中)
                }
                break
            case MsgId.玩家个人战局列表:
                {
                    let arr玩家 = arr[idxArr++] as string[][]
                    console.log(arr玩家)
                    //dis
                    // thisLocal.scene登录?.显示战局列表(arr玩家, 'onClick进入别人的个人战局')
                }
                break
            case MsgId.玩家多人战局列表:
                {
                    let arr玩家 = arr[idxArr++] as string[][]
                    console.log(arr玩家)
                    // //dis
                    //thisLocal.scene登录.显示战局列表(arr玩家, 'onClick进入别人的多人战局')
                }
                break
            case MsgId.弹丸特效:
                {
                    let idEntity = arr[idxArr++] as number
                    let idEntityTarget = arr[idxArr++] as number
                    let str特效 = arr[idxArr++] as string

                    thisLocal.scene战斗.弹丸特效(idEntity, idEntityTarget, str特效)
                }
                break
            case MsgId.剧情对话:
                {
                    let str头像左 = arr[idxArr++] as string
                    let str名字左 = arr[idxArr++] as string
                    let str头像右 = arr[idxArr++] as string
                    let str名字右 = arr[idxArr++] as string
                    let str对话内容 = arr[idxArr++] as string
                    let b显示退出面板 = arr[idxArr++] as boolean
                    thisLocal.scene战斗?.剧情对话(str头像左, str名字左, str头像右, str名字右, str对话内容, b显示退出面板)
                }
                break
            case MsgId.剧情对话已看完:
                {
                    thisLocal.scene战斗.battleUI.uiTransform剧情对话根.node.active = false
                }
                break
            case MsgId.播放音乐:
                {
                    let strHttps = arr[idxArr++] as string
                    // if (this.audioManager) {
                    //     Glob.strHttps登录场景音乐Mp3 = strHttps
                    //     assetManager.loadRemote(strHttps, (err, clip: AudioClip) => {
                    //         console.log('resources.load callback:', err, clip)
                    //         let audioSource = this.audioManager;
                    //         audioSource.stop()
                    //         audioSource.clip = clip
                    //         audioSource.play()
                    //     })
                    // }


                    // this.关闭插屏广告()
                }
                break
            case MsgId.已解锁单位:
                {
                    let dict已解锁单位 = arr[idxArr++] as object
                    console.log("已解锁单位", dict已解锁单位)
                    this.scene战斗.obj已解锁单位 = dict已解锁单位
                }
                break;
            case MsgId.单位属性等级:
                {
                    let dict属性等级 = arr[idxArr++] as object
                    console.log("单位属性等级", dict属性等级)
                    this.scene战斗.obj属性等级 = dict属性等级
                }
                break
            case MsgId.苔蔓半径:
                {
                    let idEntity = arr[idxArr++] as number
                    let 半径 = arr[idxArr++] as number
                    thisLocal.scene战斗.Set苔蔓半径(idEntity, 半径)
                }
                break
            case MsgId.Notify属性:
                {
                    let id = arr[idxArr++]
                    let old = thisLocal.scene战斗?.entities.get(id)
                    if (!old) {
                        console.log('已离开战斗场景', id)
                        return
                    }
                    let obj属性数值 = arr[idxArr++] as object
                    // this.scene战斗.obj属性数值 = obj属性数值
                    //把obj属性数值所有属性赋值给this.scene战斗.obj属性数值
                    for (let key in obj属性数值) {
                        let 属性 = parseInt(key) as 属性类型
                        let 数值 = obj属性数值[key]
                        old.obj属性数值[属性] = 数值
                        // console.log('属性', 属性, 数值)
                        switch (属性) {
                            case 属性类型.生命:
                                {
                                    if (old.node血条) {
                                        let progressBar = old.node血条.getComponent(ProgressBar)
                                        if (old.hpMax > 0)
                                            progressBar.progress = 数值 / old.hpMax
                                        else
                                            old.node血条.active = false //资源没有血量
                                    }
                                    break
                                }
                            case 属性类型.能量:
                                {
                                    if (old.node能量条) {
                                        let progressBar = old.node能量条.getComponent(ProgressBar)
                                        progressBar.progress = 数值 / old.能量Max
                                    }
                                    // console.log('数值', 数值, old.能量Max)
                                    break
                                }
                        }

                    }
                }
                break
            default:
                console.error('msgId=', msgId)
                break
        }
    }
    onRecvWorldSvr(data: ArrayBuffer) {
        let thisLocal = this
        // console.log("收到数据：", data, data.byteLength)
        const arr = msgpack.decode(new Uint8Array(data))
        // console.log("msgpack.decode结果：", data, data.byteLength)
        let idxArr = 0
        let msgHead = arr[idxArr++]
        let msgId = msgHead[0] as MsgId
        let snFromWorldSvr = msgHead[1] as number
        // console.log("收到,msgId：", msgId, ',recvMsgSnWorldSvr:', snFromWorldSvr)
        Glob.recvMsgSnWorldSvr = (Glob.recvMsgSnWorldSvr + 1) % 256
        // if(thisLocal.recvMsgSnWorldSvr != snFromWorldSvr)
        // console.error('recvMsgSn ', thisLocal.recvMsgSnWorldSvr , 'snFromWorldSvr', snFromWorldSvr)
        // console.log("sn", sn)
        switch (msgId) {
            case MsgId.在线人数:
                {
                    // let 人数 = arr[idxArr++] as number
                    // let arr昵称 = arr[idxArr++] as string[]
                    // this.str在线人数 = 人数 + '人在线:'
                    // console.log('arr', arr)

                    // if (!this.b登录成功) {
                    //     this.b登录成功 = true;
                    //     this.scene登录.nodeSelectSpace.active = true
                    // }
                    // arr昵称.forEach((str昵称: String) => {
                    //     this.str在线人数 += str昵称 + '、'
                    // })
                    // this.显示在线人数()
                }
                break

        }
    }
    //
    微信小游戏允许分享(): void {
        //"shareAppMessage"表示“发送给朋友”按钮，"shareTimeline"表示“分享到朋友圈”按钮
        // 显示“分享到朋友圈”按钮时必须同时显示“发送给朋友”按钮，显示“发送给朋友”按钮时则允许不显示“分享到朋友圈”按钮
        // https://developers.weixin.qq.com/miniprogram/dev/api/share/wx.showShareMenu.html
        console.log('window.CC_WECHAT', (window as any).CC_WECHAT)
        if ((window as any).CC_WECHAT) {
            (window as any).wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            })
        }
    }
    //
    onSecen登录Load(): void {
        if ((window as any).CC_WECHAT) {
            // 创建插屏广告实例，提前初始化
            if ((window as any).wx.createInterstitialAd) {
                this.interstitialAd = (window as any).wx.createInterstitialAd({
                    adUnitId: 'adunit-904480d5c9a873be'
                })
                this.interstitialAd.onLoad(() => { console.log('插屏 广告加载成功') })
                let thisLocal = this
                this.interstitialAd.onClose(() => { thisLocal.on关闭插屏广告() })
            }

            // 创建 原生模板 广告实例，提前初始化
            let CustomAd = (window as any).wx.createCustomAd({
                adUnitId: 'adunit-cce53ccb600523d1',
                style: {
                    left: 0,
                    top: 0,
                    width: 350
                }
            })

            // 在适合的场景显示 原生模板 广告
            CustomAd.show()

            // 监听 原生模板 广告错误事件
            CustomAd.onError(err => {
                console.error(err.errMsg)
            });
        }
    }

    on关闭插屏广告() {
        console.log('on关闭插屏广告', this.fun关闭插屏广告发消息, this)
        this.b已显示插屏广告 = false
        if (this.fun关闭插屏广告发消息) {
            this.fun关闭插屏广告发消息()
            this.fun关闭插屏广告发消息 = null
        }
    }
    进Scene战斗(sceneName: string, encoded: Buffer) {
        this.dialogMgr.closeDialog(UI2Prefab.LoginView_url);
        if ((window as any).CC_WECHAT) {
            // 在适合的场景显示插屏广告
            if (this.interstitialAd) {
                this.b已显示插屏广告 = true
                this.interstitialAd.show().catch((err) => {
                    this.b已显示插屏广告 = false
                    console.error('插屏广告显示失败', err)
                })
                //延时关闭
                // setTimeout(() => {
                //     this.关闭插屏广告()
                // }, 10000)
            }
        }
        this.loadMap(sceneName, encoded);
        //打开战斗UI
        this.dialogMgr.openDialog(UI2Prefab.BattleUI_url);

    }
    loadMap(sceneName: string, encoded: Buffer): void {
        let sceneUrl;
        switch (sceneName) {
            case 'scene战斗':
                sceneUrl = UI2Prefab.scene战斗_url;
                break;
            case 'scene四方对战':
                sceneUrl = UI2Prefab.scene四方对战_url;
                break;
            case 'scene攻坚战':
                sceneUrl = UI2Prefab.scene攻坚战_url;
                break;
            case 'scene防守战':
                sceneUrl = UI2Prefab.scene防守战_url;
                break;
        }
        //加载地图
        resources.load(sceneUrl, (err, scene: Prefab) => {
            if (err) {
                console.error(err)
                return
            }
            let MapNode = instantiate(scene)
            director.getScene().getChildByName('MapNode').addChild(MapNode)
        })
        //发送消息
        let thisLocal = this;
        if (thisLocal.b已显示插屏广告) {
            thisLocal.fun关闭插屏广告发消息 = (): void => dispatcher.send(encoded)
            console.log('已显示插屏广告，等待插屏广告关闭', thisLocal.fun关闭插屏广告发消息, thisLocal)
            //5秒内发送登录消息
            setTimeout(() => {
                thisLocal.on关闭插屏广告()
            }, 5000)
        } else {
            dispatcher.send(encoded)
        }
    }
    进Scene战斗单人剧情副本(sceneName: string, id: 副本ID) {
        this.进Scene战斗(sceneName, msgpack.encode([[MsgId.进单人剧情副本, 0, 0], id]))
    }
    onClickToggle进训练战() {
        this.进Scene战斗单人剧情副本('scene战斗', 副本ID.训练战)
    }
    onClickToggle进训练战_虫() {
        this.进Scene战斗单人剧情副本('scene战斗', 副本ID.训练战_虫)
    }
    onClickToggle进防守战() {
        this.进Scene战斗单人剧情副本('scene防守战', 副本ID.防守战)
    }
    onClickToggle进防守战_虫() {
        this.进Scene战斗单人剧情副本('scene防守战', 副本ID.防守战_虫)
    }

    onClick进攻坚战() {
        this.进Scene战斗单人剧情副本('scene攻坚战', 副本ID.攻坚战)
    }
    onClick进攻坚战_虫() {
        this.进Scene战斗单人剧情副本('scene攻坚战', 副本ID.攻坚战_虫)
    }
    onClick创建四方对战() {
        this.进Scene战斗('scene四方对战', msgpack.encode([[MsgId.创建多人战局, 0, 0], 副本ID.四方对战]))
    }
    onClick获取别人的个人战局列表(event: Event, customEventData: string) {
        console.log(event, customEventData)
        dispatcher.sendArray([[MsgId.玩家个人战局列表, ++Glob.sendMsgSn, 0, 0]])
    }
    onClick获取别人的多人战局列表(event: Event, customEventData: string) {
        console.log(event, customEventData)
        dispatcher.sendArray([[MsgId.玩家多人战局列表, ++Glob.sendMsgSn, 0, 0]])
    }
    onClick进入别人的个人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), msgpack.encode([[MsgId.进其他玩家个人战局, ++Glob.sendMsgSn, 0, 0], customEventData]))
    }
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), msgpack.encode([[MsgId.进其他玩家多人战局, ++Glob.sendMsgSn, 0, 0], customEventData]))
    }
    static 播放动作(old: ClientEntityComponent, strClipName: string, loop: boolean) {
        // console.log('strClipName', strClipName, 'old.view.name', old.view.name, 'loop', loop)
        const str星2动作: string = 'Take 001'
        if (old.view.name == '跳虫') {
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if (strClipName == 'run') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 31.5, max: 33.6 }
            } else if (strClipName == 'idle') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 14.8, max: 18.3 }
            } else if (strClipName == 'attack') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 5.2, max: 5.8 } // 动画总长度
                state.time = 5.2
            } else if (strClipName == 'died') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 45.4, max: 50.6 } // 动画总长度
                state.time = 45.4
            }
        }
        else if (old.view.name == '工蜂') {
            console.log('工蜂播放动画', strClipName, str星2动作)
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if (strClipName == 'run') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 4.2, max: 5.3 }
                state.time = 4.2
            } else if (strClipName == 'idle') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 0, max: 2 }
                state.time = 0
            } else if (strClipName == 'attack') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 7.3, max: 8.6 } // 动画总长度
                state.time = 7.3
            } else if (strClipName == 'died') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 13.8, max: 14.6 } // 动画总长度
                state.time = 13.8
            }
        }
        else if (old.view.name == '刺蛇') {
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if (strClipName == 'run') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 0, max: 1.8 }
            } else if (strClipName == 'idle') {
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 14.8, max: 18.3 }
            } else if (strClipName == 'attack') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 8.7, max: 9.7 }
                state.time = 8.7
            } else if (strClipName == 'died') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 11.8, max: 13.8 } // 动画总长度
                state.time = 11.8
            }
        }
        else if (old.view.name == '兵厂') {
            old.skeletalAnimation.play()
            let state = old.skeletalAnimation.getState('barracksdeath')
            if (strClipName == 'idle') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 0, max: 0.4 }
            } else if (strClipName == '兵厂损毁') {
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 0.4, max: 2 } // 动画总长度
                state.time = 0.4
            }
        } else if (old.view.name == '近战兵') {
            old.skeletalAnimation.play()
            if (strClipName == 'idle') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[0])
                state.wrapMode = AnimationClip.WrapMode.Loop
                old.skeletalAnimation.play()
            } else if (strClipName == 'died') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[3])
                state.wrapMode = AnimationClip.WrapMode.Normal
                old.skeletalAnimation.play()
            } else if (strClipName == 'attack') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[2])
                state.wrapMode = AnimationClip.WrapMode.Normal
                // state.playbackRange = {min:0.4, max:2} // 动画总长度
                state.speed = 4
                state.time = 0.5
                old.skeletalAnimation.play()
            } else if (strClipName == 'run') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[1])
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.speed = 0.8
                old.skeletalAnimation.play()
                // state.time = 0
                // old.skeletalAnimation.play('Take 001')
                // console.log(old.view.name, 'state', state, 'old.skeletalAnimation', old.skeletalAnimation)
            }
        }
        else if (old.view.name == '工虫') {
            old.skeletalAnimation.play()
            if (strClipName == 'idle') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[0])
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.speed = 0.6
                old.skeletalAnimation.play()
            } else if (strClipName == 'died') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[3])
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.speed = 0.3
                old.skeletalAnimation.play()
            } else if (strClipName == 'attack') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[2])
                state.wrapMode = AnimationClip.WrapMode.Normal
                // state.playbackRange = {min:0.4, max:2} // 动画总长度
                state.speed = 0.6
                // state.time = 0.5
                old.skeletalAnimation.play()
            } else if (strClipName == 'run') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[1])
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.speed = 0.8
                old.skeletalAnimation.play()
            }
            else if (strClipName == '采集') {
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[4])
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.speed = 0.8
                old.skeletalAnimation.play()
            }
        }
        else if (old.view.name == '飞机') {
            if (strClipName == 'idle' || strClipName == 'run') {
                old.skeletalAnimation.play('flight_04')
                let state = old.skeletalAnimation.getState('flight_04')
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = { min: 0, max: 2 }
                state.time = 0
            } else if (strClipName == 'attack') {
                old.skeletalAnimation.play('slide')
                let state = old.skeletalAnimation.getState('slide')
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 0, max: 1 }
                state.time = 0
            } else if (strClipName == 'died') {
                old.skeletalAnimation.play('slide')
                let state = old.skeletalAnimation.getState('slide')
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = { min: 1, max: 2 }
                state.time = 0

                let pos地下 = old.skeletalAnimation.node.position.clone()
                pos地下.y = -10
                let quat: Quat = new Quat();
                Quat.fromEuler(quat, 0, 180, 0);
                tween(old.skeletalAnimation.node).to(1, { rotation: quat, position: pos地下 }).start()
            }
            // old.skeletalAnimation.play()
        }
        else {
            if (strClipName == 'Root|走路.001')
                strClipName = 'Root|走路.001 '

            let indexClip = Number(strClipName)
            let state: AnimationState
            if (Number.isInteger(indexClip) && indexClip < 10) {
                //必须在编辑器里随便设置一个默认剪辑，否则无法播放
                // console.log('indexClip', indexClip, old)
                old.skeletalAnimation.play()
                state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[indexClip])
                // state.wrapMode = AnimationClip.WrapMode.Loop
                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
                state.speed = 1
                state.time = 0
                old.skeletalAnimation.play()
                // console.log('indexClip', indexClip, old)
            } else {
                old.skeletalAnimation.play(strClipName)
                state = old.skeletalAnimation.getState(strClipName)
                if (!state) {
                    console.error(old.view.name, old.skeletalAnimation, '缺动作:', strClipName)
                    return
                }
                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
            }

            if (null == state) {
                console.error(old.view.name, '缺动作:', strClipName)
            }


            if (old.view.name == '步兵') {
                if (strClipName == 'run')
                    state.playbackRange = { min: 0, max: 0.8 }
                else if (strClipName == 'idle')
                    state.playbackRange = { min: 0, max: 2.0 }
            }
        }
    }
    回到登录场景(): void {
        if (this.scene战斗) {
            this.scene战斗.entities.forEach((clientEntityComponent, k, map) => {
                clientEntityComponent.removeFromParent()
            })
            this.scene战斗.entities.clear()
            this.scene战斗.entityId.clear()
        }
        this.dialogMgr.openDialog(UI2Prefab.LoginView_url)
        // director.loadScene('scene登录', (err, scene) => {
        //     // console.log('回到登录场景,nodeSelectSpace.active=', this.scene登录.nodeSelectSpace.active)
        //     // director.runScene(scene);
        //     // this.scene登录.nodeSelectSpace.active = !b重新登录
        //     // this.scene登录.nodeLoginPanel.active = b重新登录
        // })
        // // director.loadScene('scene登录')
        // // console.log('回到登录场景,nodeSelectSpace.active=', this.scene登录.nodeSelectSpace.active)
        // // director.runScene(scene);
        // // this.scene登录.nodeSelectSpace.active = !b重新登录
        // // this.scene登录.nodeLoginPanel.active = b重新登录

    }
    onClick出地堡() {
        if (0 == this.arr选中.length) {
            console.log('没选中任何单位')
            return
        }
        dispatcher.sendArray([
            [MsgId.出地堡, ++Glob.sendMsgSn, 0],
            this.arr选中[0]
        ])
    }
    createMsg集结点(hitPoint: Vec3) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.建筑产出活动单位的集结点, ++Glob.sendMsgSn, 0], [hitPoint.x, hitPoint.z]]
    }
    createMsg太岁分裂(hitPoint: Vec3) {
        console.log('createMsg太岁分裂', hitPoint)
        return [[MsgId.太岁分裂, ++Glob.sendMsgSn, 0], [hitPoint.x, hitPoint.z]]
    }
    send原地坚守() {
        dispatcher.sendArray([[MsgId.原地坚守, ++Glob.sendMsgSn, 0]])
    }
    onClickSay(str: string) {
        if (str.length == 0)
            return

        if (Glob.websocket != undefined) {
            dispatcher.sendArray([
                [MsgId.Say, 0, 0],
                str
            ])
        }
    }
    send离开Space() {
        if (Glob.websocket != undefined) {
            dispatcher.sendArray([
                [MsgId.离开Space, 0, 0],
            ])
        }
    }
    onClick空闲工程车() {
        dispatcher.sendArray([[MsgId.切换空闲工程车, ++Glob.sendMsgSn, 0]])
    }
    onClick解锁近战兵() {
        this.解锁单位(单位类型.近战兵)
    }
    onClick解锁枪虫() {
        this.解锁单位(单位类型.枪虫)
    }
    onClick剧情对话全屏点击() {
        dispatcher.sendArray([[MsgId.剧情对话已看完, ++Glob.sendMsgSn, 0]])
    }
    解锁单位(单位: 单位类型) {
        dispatcher.sendArray([[MsgId.解锁单位, ++Glob.sendMsgSn, 0], 单位])
    }
    static Is活动单位(类型: 单位类型): boolean {
        return 单位类型.活动单位Min非法 < 类型 && 类型 < 单位类型.活动单位Max非法;
    }
}


