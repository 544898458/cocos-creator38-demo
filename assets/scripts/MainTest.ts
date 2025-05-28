import { _decorator, Component, Node } from 'cc';
import { Glob } from './utils/Glob';
import { DialogManager } from './manager/DialogManager';
import { UI2Prefab } from './autobind/UI2Prefab';
import { sceneMgr } from './manager/SceneManager';
import { MsgId, 单位类型, 战局类型, 属性类型 } from './utils/Enum';
import { resources } from 'cc';
import { Prefab } from 'cc';
import { AudioSource } from 'cc';
import { ClientEntityComponent, Scene战斗 } from './scene/Scene战斗';
import { Vec3 } from 'cc';
import { instantiate } from 'cc';
import { director } from 'cc';
import { 配置 } from './配置/配置';
import { dispatcher } from './manager/event/EventDispatcher';
import { EventMouse } from 'cc';
import { 按下按钮显示单位详情Component } from './component/按下按钮显示单位详情Component';
import { tween } from 'cc';
import { AnimationClip } from 'cc';
import { AnimationState } from 'cc';
import { Quat } from 'cc';
import { BattleUI } from './ui/BattleUI';
import { ResourceUtil } from './utils/ResourceUtil';
import { EC } from './utils/EC';
import { LoginView } from './ui/LoginView';
import { Dialog } from './component/Dialog';
import { NetMessage } from './manager/NetMessage';
import { BattleMoude } from './scene/BattleMoude';

const { ccclass, property } = _decorator;

@ccclass('MainTest')
export class MainTest extends Component {
    // 单例实例
    private static _instance: MainTest;
    public static get instance(): MainTest {
        return this._instance;
    }

    dialogMgr: DialogManager;
    // @property(Scene战斗)
    scene战斗: Scene战斗 = null;
    scene登录: LoginView = null
    //摄像机
    @property(Node)
    cavas: Node = null;
    @property(AudioSource)
    audioManager: AudioSource;
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    b登录成功: boolean = false;

    b显示单位类型: boolean = true
    b点击活动单位都是追加选中: boolean = false

    interstitialAd = null// 定义插屏广告    微信流量主
    rewardedVideoAd// 定义激励视频广告
    customAd// 定义原生模板广告

    fun关闭广告发消息: (boolean: boolean) => void
    b已显示进战斗场景前的广告: boolean = false
    配置: 配置 = new 配置()

    funCreateMsg造建筑: (Vec3) => object

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
        // 初始化战斗模块
        BattleMoude.init();
        //监听登录
        sceneMgr.initial();


        console.log('onLoad')
        //添加dataNode为常驻节点
        director.addPersistRootNode(this.node);

        //预载战斗页面
        ResourceUtil.preload(UI2Prefab.BattleUI_url);

        this.scene战斗 = this.getComponent(Scene战斗)
        // 设置 NetMessage 的 mainTest 实例
        NetMessage.instance.setMainTest(this);
    }

    start() {
        console.log('start')
        //打开加载页面
        // this.dialogMgr.openDialog(UI2Prefab.LoadingView_url)
        dispatcher.emit(EC.LOAD_FINISH);
        //读取配置文件
        this.配置.读取配置文件()
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
        BattleMoude.instance.fun创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.funCreateMsg造建筑 = BattleMoude.instance.fun创建消息
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
                this.interstitialAd.onClose(() => { thisLocal.on关闭广告() })
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

    on关闭广告(b已看完激励视频广告 = false) {
        console.log('on关闭广告', this.fun关闭广告发消息, this)
        this.b已显示进战斗场景前的广告 = false
        if (this.fun关闭广告发消息) {
            this.fun关闭广告发消息(b已看完激励视频广告)
            this.fun关闭广告发消息 = null
        }
    }
    进Scene战斗(sceneName: string, idMsg: MsgId, id副本: 战局类型, str房主昵称: string = '', b多人混战: boolean = false) {
        this.scene登录.node选择模式.active = false
        this.dialogMgr.closeDialog(UI2Prefab.LoginView_url);
        if ((window as any).CC_WECHAT) {
            if (b多人混战) {
                if (this.rewardedVideoAd) {
                    this.b已显示进战斗场景前的广告 = true
                    this.rewardedVideoAd.show().catch((err) => {
                        this.b已显示进战斗场景前的广告 = false
                        console.error('激励视频 广告显示失败第1次', err)
                        // 失败重试
                        this.rewardedVideoAd.load().then(() => {
                            this.b已显示进战斗场景前的广告 = true
                            this.rewardedVideoAd.show()
                        }).catch(err => {
                            this.b已显示进战斗场景前的广告 = false
                            console.error('激励视频 广告显示失败第2次', err)
                        })
                    })
                } else {
                    console.log('没有插屏广告')
                }
            } else {
                if (this.interstitialAd) {
                    this.b已显示进战斗场景前的广告 = true
                    console.log('准备显示插屏广告')
                    this.interstitialAd.show().catch((err) => {
                        this.b已显示进战斗场景前的广告 = false
                        console.error('插屏广告显示失败', err)
                    })
                    //延时关闭
                    // setTimeout(() => {
                    //     this.关闭插屏广告()
                    // }, 10000)
                }
            }
        }

        //打开战斗UI
        this.dialogMgr.openDialog(UI2Prefab.BattleUI_url, null, null, (dlg: Dialog): void => {
            if (!this.scene战斗.battleUI) {
                this.scene战斗.battleUI = dlg.getComponent(BattleUI)
            }
            this.loadMap(sceneName, idMsg, id副本, str房主昵称, b多人混战)
        })

    }
    loadMap(sceneName: string, idMsg: MsgId, id副本: 战局类型, str房主昵称: string = '', b多人混战: boolean): void {
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
            MainTest.GetMapNode().addChild(MapNode)

            // this.nodeSelectSpace.active = false
            if (this.b已显示进战斗场景前的广告) {
                this.fun关闭广告发消息 = (b已看完激励视频广告): void => this.send进战斗场景(idMsg, id副本, str房主昵称, b已看完激励视频广告)
                console.log('已显示插屏广告，等待插屏广告关闭', this.fun关闭广告发消息, this)
                //5秒内发送登录消息
                setTimeout(() => {
                    this.on关闭广告()
                }, b多人混战 ? 5 * 60000 : 5000)
            } else {
                console.log('未显示插屏广告，直接进战斗场景', this.fun关闭广告发消息, this)
                this.send进战斗场景(idMsg, id副本, str房主昵称)
            }
        })
    }
    static GetMapNode(): Node {
        return director.getScene().getChildByName('MapNode')
    }
    send进战斗场景(idMsg: MsgId, id副本: 战局类型, str房主昵称, b已看完激励视频广告 = false) {
        dispatcher.sendArray([[idMsg, 0, 0], id副本, str房主昵称, b已看完激励视频广告])
    }
    onClick进单人战局(id: 战局类型) {
        let 配置 = this.配置.find战局(id)
        this.进Scene战斗单人剧情副本(配置.strSceneName, id)
    }
    进Scene战斗单人剧情副本(sceneName: string, id: 战局类型) {
        this.进Scene战斗(sceneName, MsgId.进单人剧情副本, id)
    }
    onClick创建四方对战() {
        this.进Scene战斗('scene四方对战', MsgId.创建多人战局, 战局类型.四方对战)
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
        this.进Scene战斗(this.map玩家场景.get(customEventData), MsgId.进其他玩家个人战局, 战局类型.单人ID_非法_MIN, customEventData)
    }
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), MsgId.进其他玩家多人战局, 战局类型.四方对战, customEventData)
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
        MainTest.GetMapNode().removeAllChildren()
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
        if (0 == BattleMoude._arr选中.length) {
            console.log('没选中任何单位')
            return
        }
        dispatcher.sendArray([
            [MsgId.出地堡, ++Glob.sendMsgSn, 0],
            BattleMoude._arr选中[0]
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
    显示在线人数(): void {
        // 广播在线人数
        //dispatcher.emit(EC.ONLINE_USERS_UPDATED, displayText);
        console.log(Glob.str在线人数)
        if (this.scene战斗 && this.scene战斗.battleUI)
            this.scene战斗.battleUI.lable在线人数.string = Glob.str在线人数

        if (this.scene登录)
            this.scene登录.lableMessage.string = Glob.str在线人数
    }
}


