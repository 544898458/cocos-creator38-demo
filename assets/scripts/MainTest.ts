import { _decorator, Component, Node } from 'cc';
import { Glob } from './utils/Glob';
import { DialogManager } from './manager/DialogManager';
import { UI2Prefab } from './autobind/UI2Prefab';
import { sceneMgr } from './manager/SceneManager';
import { game } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { MsgId, 单位类型 } from './utils/Enum';
import { SkeletalAnimation } from 'cc';
import { resources } from 'cc';
import { Prefab } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('MainTest')
export class MainTest extends Component {
    // 单例实例
    private static _instance: MainTest;
    public static get instance(): MainTest {
        return this._instance;
    }

    dialogMgr: DialogManager;
    @property(Node)
    cavas: Node = null;
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
    }
    start() {
        //打开加载页面
        this.dialogMgr.openDialog(UI2Prefab.LoadingView_url)
    }

    update(deltaTime: number) {

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
                    // console.log(id, nickName, prefabName, '进来了,hpMax', hpMax)
                    if (!thisLocal.scene战斗) {
                        // console.log(
                        return
                    }
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
                                Main.播放动作(old, old.initClipName, true)
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
                        Main.播放动作(old, clipName, loop)
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
                    if (thisLocal.scene登录 && thisLocal.scene登录.lableMessage)
                        thisLocal.scene登录.lableMessage.string = content

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
                    thisLocal.scene登录?.显示战局列表(arr玩家, 'onClick进入别人的个人战局')
                }
                break
            case MsgId.玩家多人战局列表:
                {
                    let arr玩家 = arr[idxArr++] as string[][]
                    console.log(arr玩家)
                    thisLocal.scene登录.显示战局列表(arr玩家, 'onClick进入别人的多人战局')
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
                    if (this.scene登录)
                        this.strHttps登录场景音乐Mp3 = strHttps

                    assetManager.loadRemote(strHttps, (err, clip: AudioClip) => {
                        console.log('resources.load callback:', err, clip)
                        let audioSource = this.scene登录 ? this.scene登录.audioSource : this.scene战斗.audioSource
                        audioSource.stop()
                        audioSource.clip = clip
                        audioSource.play()
                    })

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
}


