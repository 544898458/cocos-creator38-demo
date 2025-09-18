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
import { assetManager } from 'cc';
import { AudioClip } from 'cc';
import { toast } from './manager/ToastMgr';

const { ccclass, property } = _decorator;

@ccclass('MainTest')
export class MainTest extends Component {
    static b显示侧边栏引导按钮: boolean = false
    // 单例实例
    private static _instance: MainTest;
    战局: 战局类型;
    public static get instance(): MainTest {
        return this._instance;
    }

    dialogMgr: DialogManager;
    // @property(Scene战斗)
    scene战斗: Scene战斗 = null;
    scene登录: LoginView = null
    static idSvr: number = 0;
    //摄像机
    @property(Node)
    cavas: Node = null;
    @property(AudioSource)
    audioManager: AudioSource;
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    b登录成功: boolean = false;

    b显示单位类型: boolean = true
    b点击活动单位都是追加选中: boolean = false
    b显示名字: boolean = true

    static interstitialAd = null// 定义插屏广告    微信流量主
    static rewardedVideoAd// 定义激励视频广告
    static customAd// 定义原生模板广告
    /**
 *  推荐组件参考代码
 *  核心由 pageManager实例 + openlink值 决定活动，开发者可根据下方代码自行适配
 */
 static recommendPageManager;

    fun关闭广告发消息: (boolean: boolean) => void
    b已显示进战斗场景前的广告: boolean = false
    配置: 配置 = new 配置()

    funCreateMsg造建筑: (Vec3) => object
    fun离开战斗场景: (loginView: LoginView) => void
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
        return [[MsgId.AddBuilding, ++Glob.sendMsgSn, 0], 类型, [hitPoint.x, hitPoint.y, hitPoint.z]]
    }
    on点击按钮_造建筑(类型: 单位类型) {
        BattleMoude.instance.fun点击地面创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.funCreateMsg造建筑 = BattleMoude.instance.fun点击地面创建消息
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
        this.on点击按钮_造建筑(单位类型.兵营)
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
            wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            })
        }
    }
    static 抖音小游戏初始化(): void {
        console.log('onSecen登录Load,是抖音小游戏')

        const launchOptions = tt.getLaunchOptionsSync().scene as string
        const b从侧边栏进入 = launchOptions == '021036'
        console.log('抖音onSecen登录Load,从侧边栏进入', b从侧边栏进入, launchOptions)
        MainTest.b显示侧边栏引导按钮 = !b从侧边栏进入
        tt.onShow((res) => {
            //判断用户是否是从侧边栏进来的
            if(MainTest.instance && MainTest.instance.scene登录)
            {
                MainTest.instance.scene登录.node抖音侧边栏复访教育面板.active = false
            }

            let isFromSidebar = (res.launch_from == 'homepage' && res.location == 'sidebar_card')

            if (isFromSidebar) {
                console.log('抖音onShow,从侧边栏进入，可免除广告')

                MainTest.b显示侧边栏引导按钮 = false
                if (MainTest.instance && MainTest.instance.scene登录) {
                    MainTest.instance.scene登录.node抖音侧边栏引导按钮.active = false
                    toast.showToast('您从侧边栏进入了游戏，可免除部分广告', 100)
                }
            }
            else {
                console.log('抖音onShow,不是从侧边栏进入')
                tt.checkScene({
                    scene: "sidebar",
                    success: (res) => {
                        console.log("抖音确认当前宿主版本是否支持跳转某个小游戏入口场景，目前仅支持「侧边栏」场景。接口调用成功，结果:", res.isExist);
                        if (res.isExist) {
                            MainTest.b显示侧边栏引导按钮 = true
                            if (MainTest.instance && MainTest.instance.scene登录) {
                                MainTest.instance.scene登录.node抖音侧边栏引导按钮.active = true
                            }
                        }
                    },
                    fail: (res) => {
                        console.log("抖音确认当前宿主版本是否支持跳转某个小游戏入口场景，目前仅支持「侧边栏」场景。接口调用失败:", res);
                    }
                });
            }
        });
    }
    static 哔哩哔哩小游戏初始化():void
    {
        console.log('onSecen登录Load,是哔哩哔哩小游戏')
        //https://miniapp.bilibili.com/small-game-doc/open/sidebar
        bl.onShow(res => {
            // 侧边栏返回小游戏后，会触发onShow事件。
            // 在此监听场景值，触发侧边栏奖励
            //https://miniapp.bilibili.com/small-game-doc/ability/scene-type
            //场景值	类型	含义
            //10001	    string	我的(首页Tab)-小游戏中心
            //10002	    string	手机设备桌面快捷入口
            //10003	    string	各分享渠道
            //021036	string	从侧边栏进入小游戏
            const scene = res.scene;
            console.log('bl.onShow,从哔哩哔哩', scene, '进入')
            if (scene == '021036') {
                // 从侧边栏进入，发送奖励
                console.log('从哔哩哔哩侧边栏进入')
            } else {

                bl.checkScene({
                    scene: "sidebar",
                    success: (res) => {
                        console.log("哔哩哔哩从侧边栏进入小游戏检查结果,接口调用成功,当前宿主版本是否支持跳转某个小游戏入口场景，目前仅支持「侧边栏」场景。  ", res.isExist);
                        //成功回调逻辑
                    },
                    fail: (res) => {
                        console.log("检查失败,不知哔哩哔哩是否从侧边栏进入小游戏,接口调用失败:", res);
                        //失败回调逻辑
                    }
                });
            }
        });


        bl.reportScene({
            sceneId: 7,
            // costTime: 350,
            // dimension: {
            //   d1: '2.1.0', // value仅支持传入String类型。若value表示Boolean，请将值处理为'0'、'1'进行上报；若value为Number，请转换为String进行上报
            // },
            // metric: {
            //   m1: '546', // value仅支持传入数值且需要转换为String类型进行上报
            // },
            success(res) {
                console.log('上报接口执行完成后的回调，用于检查上报数据是否符合预期', res)
            },
            fail(res) {
                console.log('上报报错时的回调，用于查看上报错误的原因：如参数类型错误等', res)
            }
        })
    }
    static 微信小游戏初始化():void
    {
        let thisLocal = this
            // 创建插屏广告实例，提前初始化             进入战斗场景时显示
            if (wx.createInterstitialAd) {
                MainTest.interstitialAd = wx.createInterstitialAd({
                    adUnitId: 'adunit-904480d5c9a873be'
                })
                MainTest.interstitialAd.onLoad(() => { console.log('插屏 广告加载成功') })
                MainTest.interstitialAd.onError((err: any) => {
                    console.error('interstitialAd onError', err.errMsg)
                });
                MainTest.interstitialAd.onClose(() => { thisLocal.on关闭广告() })
                console.log('MainTest.interstitialAd', MainTest.interstitialAd)
            } else {
                console.log('微信流量主插屏广告未初始化')
            }

            if (!this.customAd) {
                // 创建 原生模板 广告实例，提前初始化           首页顶部广告条
                const size = wx.getSystemInfoSync();
                const adWidth = 375
                const adHeight = 150
                // Calculate centered position
                const left = (size.screenWidth - adWidth) / 2
                const top = size.screenHeight - adHeight
                console.log('left', left, 'size', size)
                MainTest.customAd = wx.createCustomAd({
                    adUnitId: 'adunit-cce53ccb600523d1',
                    style: {
                        left: left,
                        top: top,
                        width: adWidth,
                        height: adHeight
                    }
                })

                console.log('CustomAd', MainTest.customAd)
                // 监听 原生模板 广告错误事件
                MainTest.customAd.onError(err => {
                    console.error('CustomAd onError', err.errMsg)
                });
                MainTest.customAd.onLoad(() => console.log('原生模板广告加载成功'))
                // 在适合的场景显示 原生模板 广告
                MainTest.customAd.show().then(() => console.log('首次创建后原生模板广告显示成功')).catch(err => console.log('首次创建后原生模板广告显示错误', err))

            } else {
                MainTest.customAd.show().then(() => console.log('原生模板广告再次显示成功')).catch(err => console.log('原生模板广告再次显示错误', err))
            }

            if (!MainTest.rewardedVideoAd) {
                // 创建激励视频广告实例，提前初始化
                MainTest.rewardedVideoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-016e0f527a910f13'
                })
                MainTest.rewardedVideoAd.onError(err => {
                    console.error('rewardedVideoAd onError', err.errMsg)
                });
                MainTest.rewardedVideoAd.onClose(res => {
                    MainTest.instance.on关闭广告(res && res.isEnded || res === undefined)
                    // 用户点击了【关闭广告】按钮
                    // 小于 2.1.0 的基础库版本，res 是一个 undefined
                    // if (res && res.isEnded || res === undefined) {
                    //     // 正常播放结束，可以下发游戏奖励
                    // }
                    // else {
                    //     // 播放中途退出，不下发游戏奖励
                    // }
                })
                console.log('MainTest.rewardedVideoAd', MainTest.rewardedVideoAd)
            }

            if (!MainTest.recommendPageManager) {
                if(wx.createPageManager){
                    MainTest.recommendPageManager = wx.createPageManager();
                    MainTest.recommendPageManager.load({
                        openlink: 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw',
                    }).then((res: any) => {
                        console.log(res);
                    })
                    MainTest.recommendPageManager.on(
                        'show', // show | destroy | error
                        () => {
                            console.log('recommend component show.');
                        },
                    )
                    MainTest.recommendPageManager.on(
                        'destroy', // show | destroy | error
                        (res) => {
                            console.log('recommend component destroy：', res.isRecommended);
                        },
                    )
                }
                else
                {
                    console.log('微信推荐组件未初始化')
                }
            }
    }
    static onSecen登录Load(): void {
        if (MainTest.是抖音小游戏()) {
            MainTest.抖音小游戏初始化()
        }
        else if (MainTest.是哔哩哔哩小游戏()) {
           MainTest.哔哩哔哩小游戏初始化() 
        }
        else if (MainTest.是微信小游戏()) {
            MainTest.微信小游戏初始化()
        } 
    }
    static 是微信小游戏(): boolean {
        return (window as any).CC_WECHAT//typeof wx !== 'undefined' && wx != null
    }
    static 是抖音小游戏(): boolean {
        return typeof tt !== 'undefined' && tt != null
    }
    static 是哔哩哔哩小游戏(): boolean {
        return typeof bl !== 'undefined' && bl != null
    }
    static 是华为快应用(): boolean {
        return window.hbs;  //华为花瓣轻游
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
        this.scene登录.node选择单人多人.active = false
        this.dialogMgr.closeDialog(UI2Prefab.LoginView_url);
        // this.scene登录.onDestroy()
        // this.scene登录.main = null
        this.scene登录 = null
        if ((window as any).CC_WECHAT) {
            if (b多人混战) {
                if (MainTest.rewardedVideoAd) {
                    this.b已显示进战斗场景前的广告 = true
                    MainTest.rewardedVideoAd.show().catch((err) => {
                        this.b已显示进战斗场景前的广告 = false
                        console.error('激励视频 广告显示失败第1次', err)
                        // 失败重试
                        MainTest.rewardedVideoAd.load().then(() => {
                            this.b已显示进战斗场景前的广告 = true
                            MainTest.rewardedVideoAd.show()
                        }).catch(err => {
                            this.b已显示进战斗场景前的广告 = false
                            console.error('激励视频 广告显示失败第2次', err)
                        })
                    })
                } else {
                    console.log('没有插屏广告')
                }
            } else {
                if (MainTest.interstitialAd) {
                    this.b已显示进战斗场景前的广告 = true
                    console.log('准备显示插屏广告')
                    MainTest.interstitialAd.show().catch((err) => {
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

            if (this.scene战斗.battleUI) {
                this.scene战斗.battleUI.lable在线人数.string = Glob.str在线人数
                this.scene战斗.battleUI.node按钮战报.active = b多人混战
            }
            else {
                console.error('战斗UI未找到')
            }

            this.loadMap(sceneName, idMsg, id副本, str房主昵称, b多人混战)
        })

    }
    loadMap(sceneName: string, idMsg: MsgId, id副本: 战局类型, str房主昵称: string = '', b多人混战: boolean): void {
        //加载地图
        resources.load(sceneName, (err, scene: Prefab) => {
            if (err) {
                console.error(sceneName, err)
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
        console.log('onClick进单人战局', id)
        let 配置 = this.配置.find战局(id)
        this.进Scene战斗单人剧情副本(配置.strSceneName, id)
    }
    进Scene战斗单人剧情副本(sceneName: string, id: 战局类型) {
        this.进Scene战斗(sceneName, MsgId.进单人剧情副本, id)
    }
    onClick创建多人战局(战局: 战局类型) {
        this.进Scene战斗(this.配置.find战局(战局).strSceneName, MsgId.创建多人战局, 战局)
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
    static 播放动作(old: ClientEntityComponent, strClipName: string, loop: boolean, 动作播放速度: number = 1, f动作起始时刻秒: number = 0, f动作结束时刻秒: number = 0) {
        // console.log('strClipName', strClipName, 'old.view.name', old.view.name, 'loop', loop, '动作播放速度', 动作播放速度, 'f动作起始时刻秒', f动作起始时刻秒, 'f动作结束时刻秒', f动作结束时刻秒)
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
        }else {
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
                state.speed = 动作播放速度

                if (f动作结束时刻秒 > 0) {
                    state.playbackRange = { min: f动作起始时刻秒, max: f动作结束时刻秒 }
                    state.time = f动作起始时刻秒
                } else {
                    state.time = 0
                }

                old.skeletalAnimation.play()
                // console.log('indexClip', indexClip, old)
            } else {

                old.skeletalAnimation.play(strClipName)
                state = old.skeletalAnimation.getState(strClipName)
                if (!state) {
                    console.error(old.view.name, old.skeletalAnimation, '缺动作:', strClipName)
                    return
                }
                state.speed = 动作播放速度
                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
                if (f动作结束时刻秒 > 0) {
                    state.playbackRange = { min: f动作起始时刻秒, max: f动作结束时刻秒 }
                    state.time = f动作起始时刻秒
                } else {
                    state.time = 0
                }
                // console.log('播放动作', old.view.name, strClipName, state, loop, 动作播放速度, f动作起始时刻秒, f动作结束时刻秒)
            }

            if (null == state) {
                console.error(old.view.name, '缺动作:', strClipName)
            }
        }
    }
    离开战斗场景(b显示登录界面, str: string = ''): void {
        if (this.scene战斗) {
            this.scene战斗.entities.forEach((clientEntityComponent, k, map) => {
                clientEntityComponent.removeFromParent()
            })
            this.scene战斗.entities.clear()
            this.scene战斗.entityId.clear()
        }
        this.dialogMgr.openDialog(UI2Prefab.LoginView_url, null, null, (dlg: Dialog): void => {
            console.log('打开登录界面', b显示登录界面, str)
            let loginView = dlg.getComponent(LoginView)
            if (b显示登录界面) {
                loginView.node单人战局列表_人.active = false
                loginView.node单人战局列表_虫.active = false
                loginView.node玩家战局列表.active = false
                loginView.node多人战局面板.active = false
                loginView.登录界面显示消息(str)
            } else {
                this.fun离开战斗场景(loginView)
                loginView.node登录面板.active = false
            }
        })
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

    createMsg太岁分裂(hitPoint: Vec3) {
        console.log('createMsg太岁分裂', hitPoint)
        return [[MsgId.太岁分裂, ++Glob.sendMsgSn, 0], [hitPoint.x, hitPoint.y, hitPoint.z]]
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
    onClick删除自己的单位() {
        dispatcher.sendArray([[MsgId.删除自己的单位, ++Glob.sendMsgSn, 0]])
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

    销毁原生模板广告(): void {
        if (window.CC_WECHAT) {
            // if (this.interstitialAd) {
            //     this.interstitialAd.offClose()
            //     this.interstitialAd.offLoad()
            //     this.interstitialAd.destroy()
            //     this.interstitialAd = null
            // }
            // if (this.rewardedVideoAd) {
            //     this.rewardedVideoAd.offClose()
            // }
            if (MainTest.customAd) {
                MainTest.customAd.hide()
                // this.customAd = null
            }
        }
    }
    播放音乐(strHttps: string) {
        assetManager.loadRemote(encodeURI(strHttps), (err, clip: AudioClip) => {
            console.log('resources.load callback:', err, clip)
            let audioSource = MainTest.instance.audioManager.getComponent(AudioSource)
            if (!audioSource)
                return

            audioSource.stop()
            audioSource.clip = clip
            audioSource.play()
        })
    }
}


