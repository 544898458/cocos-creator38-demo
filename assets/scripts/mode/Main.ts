import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, AssetManager, Asset, assetManager, Animation } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from '../component/head-scale'
import { Scene战斗, ClientEntityComponent } from '../scene/Scene战斗'
import { Scene登录 } from '../scene/Scene登录'
import { AudioMgr } from '../manager/audio/AudioMgr'
import { ProgressBar } from 'cc'
import { ParticleSystem } from 'cc'
import { tween } from 'cc'
import { copyFileSync } from 'original-fs'
import { Quat } from 'cc'
import { AudioClip } from 'cc'
import { sys } from 'cc'
import { MsgId, 属性类型, 单位类型, 配置, 战局类型 } from '../配置/配置'
import { Tween } from 'cc'
import { AnimationState } from 'cc'
import { 按下按钮显示单位详情Component } from '../component/按下按钮显示单位详情Component'
import { 苔蔓Component } from '../component/苔蔓Component'

const { ccclass, property } = _decorator

// enum 点击地面操作类型
// {
//     移动单位,
//     放置建筑
// }

enum SayChannel {
    系统,
    聊天,
    任务提示,
};

enum LoginResult {
    OK,
    Busy,
    PwdErr,
    NameErr,
    客户端版本不匹配,
}

export const KEY_登录名: string = '登录名'
declare const tt: any;  // Basic declaration, consider proper typing if available
declare const wx: any;

@ccclass('Main')
export class Main extends Component {
    websocket: WebSocket
    // lableMessage: Label
    // lableMessage语音提示: Label
    @property({ type: Asset })
    public wssCacert: Asset = null!;


    recvMsgSnGameSvr: number = 0
    recvMsgSnWorldSvr: number = 0
    recvMsgSn: number = 0
    sendMsgSn: number = 0
    scene战斗: Scene战斗 = null
    scene登录: Scene登录 = null
    arr选中: number[] = []
    str在线人数: string
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    b登录成功: boolean = false
    strHttps登录场景音乐Mp3: string = "https://www.rtsgame.online/music/suno世界又恢复了和平低音质.mp3"
    b点击活动单位都是追加选中: boolean = false
    b显示单位类型: boolean = true
    配置: 配置 = new 配置()
    fun创建消息: (position: Vec3) => object = null//this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    funCreateMsg造建筑: (position: Vec3) => object;
    interstitialAd: any = null; // 定义插屏广告    
    rewardedVideoAd: any = null; // 定义激励视频广告
    customAd: any = null; // 定义原生模板广告
    b已显示进战斗场景前的广告: boolean = false
    fun关闭广告发消息: (b已看完激励视频广告: boolean) => void
    onSecen登录Load(): void {
        if (window.CC_WECHAT) {
            let thisLocal = this
            // 创建插屏广告实例，提前初始化             进入战斗场景时显示
            if (wx.createInterstitialAd) {
                this.interstitialAd = wx.createInterstitialAd({
                    adUnitId: 'adunit-904480d5c9a873be'
                })
                this.interstitialAd.onLoad(() => { console.log('插屏 广告加载成功') })
                this.interstitialAd.onError((err: any) => {
                    console.error('interstitialAd onError', err.errMsg)
                });
                this.interstitialAd.onClose(() => { thisLocal.on关闭广告() })
                console.log('this.interstitialAd', this.interstitialAd)
            } else {
                console.log('微信流量主插屏广告未初始化')
            }

            if (!this.customAd) {
                // 创建 原生模板 广告实例，提前初始化           首页顶部广告条
                const size = wx.getSystemInfoSync();
                const adWidth = 350;
                // Calculate centered position
                const left = (size.screenWidth - adWidth) / 2;
                console.log('left', left, 'size', size)
                this.customAd = wx.createCustomAd({
                    adUnitId: 'adunit-cce53ccb600523d1',
                    style: {
                        left: left,
                        top: 0,
                        width: adWidth
                    }
                })

                console.log('CustomAd', this.customAd)
                // 监听 原生模板 广告错误事件
                this.customAd.onError(err => {
                    console.error('CustomAd onError', err.errMsg)
                });
                this.customAd.onLoad(() => console.log('原生模板广告加载成功'))
                // 在适合的场景显示 原生模板 广告
                this.customAd.show().then(() => console.log('首次创建后原生模板广告显示成功')).catch(err => console.log('首次创建后原生模板广告显示错误', err))

            } else {
                this.customAd.show().then(() => console.log('原生模板广告再次显示成功')).catch(err => console.log('原生模板广告再次显示错误', err))
            }

            if (!this.rewardedVideoAd) {
                // 创建激励视频广告实例，提前初始化
                this.rewardedVideoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-016e0f527a910f13'
                })
                this.rewardedVideoAd.onError(err => {
                    console.error('rewardedVideoAd onError', err.errMsg)
                });
                this.rewardedVideoAd.onClose(res => {
                    thisLocal.on关闭广告(res && res.isEnded || res === undefined)
                    // 用户点击了【关闭广告】按钮
                    // 小于 2.1.0 的基础库版本，res 是一个 undefined
                    // if (res && res.isEnded || res === undefined) {
                    //     // 正常播放结束，可以下发游戏奖励
                    // }
                    // else {
                    //     // 播放中途退出，不下发游戏奖励
                    // }
                })
                console.log('this.rewardedVideoAd', this.rewardedVideoAd)
            }
        } else if (Main.是抖音小游戏()) {

        }
    }
    //销毁原生模板广告
    onDestroy(): void {
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
            if (this.customAd) {
                this.customAd.hide()
                // this.customAd = null
            }
        }
    }
    static 是抖音小游戏(): boolean {
        return typeof tt !== 'undefined' && tt != null
    }
    on关闭广告(b已看完激励视频广告: boolean = false) {
        console.log('on关闭广告', this.fun关闭广告发消息, this)
        this.b已显示进战斗场景前的广告 = false
        if (this.fun关闭广告发消息) {
            this.fun关闭广告发消息(b已看完激励视频广告)
            this.fun关闭广告发消息 = null
        }
    }
    // funCreateMsgMove遇敌自动攻击 = this.createMsgMove遇敌自动攻击
    createMsgMove强行走(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, false)
    }
    createMsg集结点(hitPoint: Vec3) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.建筑产出活动单位的集结点, ++this.sendMsgSn, 0], [hitPoint.x, hitPoint.z]]
    }
    createMsg太岁分裂(hitPoint: Vec3) {
        console.log('createMsg太岁分裂', hitPoint)
        return [[MsgId.太岁分裂, ++this.sendMsgSn, 0], [hitPoint.x, hitPoint.z]]
    }
    static Is活动单位(类型: 单位类型): boolean {
        return 单位类型.活动单位Min非法 < 类型 && 类型 < 单位类型.活动单位Max非法;
    }
    清零网络数据包序号() {
        this.recvMsgSnGameSvr = 0
        this.recvMsgSnWorldSvr = 0
        this.recvMsgSn = 0
        this.sendMsgSn = 0
    }
    send(buf: Buffer) {
        if (this.websocket == undefined) {
            console.error('this.websocket is undefined')
            return
        }

        let send_buffer = buf.buffer
        if (buf.length != buf.buffer.byteLength) {
            send_buffer = send_buffer.slice(0, buf.length)
        }
        this.websocket.send(send_buffer)

        //this.websocket.send(buf)  这样好像微信小游戏真机发不出任何消息（微信开发者工具发送成功，网页也成功），原因不明
        // this.websocket.send(buf.buffer)//这样可以发
        //问题看这里：
        //https://forum.cocos.org/t/websocket-send/76282
        // https://forum.cocos.org/t/websocket/74614/4
        // https://developers.weixin.qq.com/community/minihome/doc/0006eef117cd28f4f181ad7e96b000
    }
    sendArray(arr: any[]) {
        const encoded = msgpack.encode(arr)
        console.log(encoded)
        this.send(encoded)
    }
    createMsgMove遇敌自动攻击(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, true)
    }
    createMsgMove(hitPoint: Vec3, b遇敌自动攻击: boolean) {
        if (0 == this.arr选中.length)
            return null

        return [[MsgId.Move, 0],
        [hitPoint.x, hitPoint.y, hitPoint.z],
            b遇敌自动攻击
        ]
    }
    onLoad() {
        console.log('onLoad')
        //添加dataNode为常驻节点
        director.addPersistRootNode(this.node);
    }
    start() {
        console.log('start')
        this.配置.读取配置文件()
    }

    update(deltaTime: number) {

    }
    造活动单位(类型: 单位类型) {
        // console.log(encoded)
        this.sendArray([[MsgId.AddRole, 0, 0], 类型])
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.三色坦克)
    }
    onClick造活动单位(event: Event, customEventData: string): void {
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
        return [[MsgId.AddBuilding, ++this.sendMsgSn, 0], 类型, [hitPoint.x, hitPoint.z]]
    }
    on点击按钮_造建筑(类型: 单位类型) {
        this.fun创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.funCreateMsg造建筑 = this.fun创建消息
        this.scene战斗.battleUI.lable系统消息.string = '请点击地面放置建筑'
        this.scene战斗.battleUI.进入点击地面状态()
    }
    on升级单位属性(单位: 单位类型, 属性: 属性类型) {
        this.sendArray([[MsgId.升级单位属性, ++this.sendMsgSn, 0], 单位, 属性])
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
    进Scene战斗(sceneName: string, idMsg: MsgId, id副本: 战局类型, str房主昵称: string = '', b多人混战: boolean = false) {
        this.scene登录.nodeSelectSpace.active = false
        if (window.CC_WECHAT) {
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
        director.preloadScene(sceneName, (completedCount: number, totalCount: number, item: AssetManager.RequestItem) => {
            console.log(completedCount, totalCount, item)
            this.scene登录.lableMessage.string = completedCount + '/' + totalCount + '\n' + item.url
        }, () => {
            this.scene登录.onDestroy()
            this.scene登录.main = null
            this.scene登录 = null
            let thisLocal = this
            director.loadScene(sceneName, (err, scene) => {
                // this.nodeSelectSpace.active = false
                if (thisLocal.b已显示进战斗场景前的广告) {
                    thisLocal.fun关闭广告发消息 = (b已看完激励视频广告): void => thisLocal.send进战斗场景(idMsg, id副本, str房主昵称, b已看完激励视频广告)
                    console.log('已显示插屏广告，等待插屏广告关闭', thisLocal.fun关闭广告发消息, thisLocal)
                    //5秒内发送登录消息
                    setTimeout(() => {
                        thisLocal.on关闭广告()
                    }, b多人混战 ? 5 * 60000 : 5000)
                } else {
                    console.log('未显示插屏广告，直接进战斗场景', thisLocal.fun关闭广告发消息, thisLocal)
                    thisLocal.send进战斗场景(idMsg, id副本, str房主昵称)
                }
            })
        })
    }
    send进战斗场景(idMsg: MsgId, id副本: 战局类型, str房主昵称, b已看完激励视频广告 = false) {
        this.sendArray([[idMsg, 0, 0], id副本, str房主昵称, b已看完激励视频广告])
    }
    private 进Scene战斗单人剧情副本(sceneName: string, id: 战局类型) {
        this.进Scene战斗(sceneName, MsgId.进单人剧情副本, id)
    }
    onClick进单人战局(id: 战局类型) {
        let 配置 = this.配置.find战局(id)
        this.进Scene战斗单人剧情副本(配置.strSceneName, id)
    }
    onClick创建四方对战() {
        this.进Scene战斗('scene四方对战', MsgId.创建多人战局, 战局类型.四方对战)
    }
    onClick获取别人的个人战局列表(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.sendArray([[MsgId.玩家个人战局列表, ++this.sendMsgSn, 0, 0]])
    }
    onClick获取别人的多人战局列表(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.sendArray([[MsgId.玩家多人战局列表, ++this.sendMsgSn, 0, 0]])
    }
    onClick进入别人的个人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), MsgId.进其他玩家个人战局, 战局类型.单人ID_非法_MIN, customEventData)
    }
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), MsgId.进其他玩家多人战局, 战局类型.四方对战, customEventData)
    }
    微信小游戏获得OpenID(): void {
        console.log('window.CC_WECHAT', window.CC_WECHAT)
        if (window.CC_WECHAT) {
            wx.login({
                success: function (res) {
                    console.log('wx.login', res)
                    wx.request({
                        url: "https://www.rtsgame.online/wechat/token?code=" + res.code,
                        method: "POST",
                        success: function (data) {
                            if (data.statusCode == 200) {
                                console.log("request", data);
                            }
                        }
                    });
                }
            });
        }
    }
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

    onClickLogin(event: Event, customEventData: string) {
        this.b登录成功 = false
        // this.微信小游戏获得OpenID()
        let str登录名 = this.scene登录.editBox登录名.string
        ClientEntityComponent.myNickName = str登录名
        sys.localStorage.setItem(KEY_登录名, str登录名)

        console.log(str登录名)
        if (str登录名.length == 0) {
            this.scene登录.lableMessage.string = '请输入昵称（随便什么都可以）'
            return
        }

        this.scene登录.nodeLoginPanel.active = false//隐藏
        this.scene登录.lableMessage.string = '正在连接'
        this.websocket = new WebSocket("wss://" + customEventData)
        this.websocket.binaryType = 'arraybuffer'
        console.log(this.websocket)

        //连接发生错误的回调方法
        this.websocket.onerror = () => {
            this.scene登录.lableMessage.string = "连接错误，您可以再试一次"
            this.scene登录.nodeLoginPanel.active = true//再次显示，可以再点登录
        }

        //连接成功建立的回调方法
        this.websocket.onopen = (event: Event) => {
            this.scene登录.lableMessage.string = "连接成功，请等待登录结果……"
            console.log(this.scene登录.lableMessage.string)
            this.sendArray([
                [MsgId.Login, ++this.sendMsgSn],
                0,
                str登录名,
                'Hello, world!pwd',
                20,//版本号
            ])

            // this.scene登录.nodeSelectSpace.active = true
        }

        // let lableMessage = this.lableMessage
        let thisLocal = this
        //接收到消息的回调方法
        this.websocket.onmessage = function (event: MessageEvent) {
            let data = event.data as ArrayBuffer
            const arr = msgpack.decode(new Uint8Array(data))
            // console.log("msgpack.decode结果：", data, data.byteLength)
            let idxArr = 0
            let msgHead = arr[idxArr++]
            let msgId = msgHead[0] as MsgId
            let sn收到 = msgHead[1] as number
            let arr消息 = arr.slice(idxArr)
            // console.log("收到GateSvr消息,msgId：", msgId, ',sn收到:', sn收到)
            thisLocal.recvMsgSn = Main.uint8自增(thisLocal.recvMsgSn)// ++thisLocal.recvMsgSn
            if (thisLocal.recvMsgSn != sn收到)
                console.error('收到GateSvr消息sn不同', thisLocal.recvMsgSn, 'sn收到:', sn收到)
            switch (msgId) {
                case MsgId.GateSvr转发GameSvr消息给游戏前端:
                    {
                        let arrGameMsg = arr[idxArr++]
                        // console.log('收到GameSvr消息',arrGameMsg)
                        thisLocal.onRecvGameSvr(arrGameMsg)
                    }
                    break
                case MsgId.GateSvr转发WorldSvr消息给游戏前端:
                    let arrWorldMsg = arr[idxArr++]
                    // console.log('收到WorldSvr消息',arrWorldMsg)
                    thisLocal.onRecvWorldSvr(arrWorldMsg)
                    break
                case MsgId.Login:
                    {
                        let [rpcSnId, result, strMsg] = arr消息 as [number, LoginResult, string]
                        idxArr += 3
                        console.log(result, strMsg)
                        if (result == LoginResult.OK)
                            return

                        thisLocal.scene登录.lableMessage.string = strMsg

                        switch (result) {
                            case LoginResult.客户端版本不匹配:
                                break
                            default:
                                break
                        }

                        thisLocal.websocket.onclose = null
                        thisLocal.websocket.close()
                        thisLocal.websocket = null
                        thisLocal.清零网络数据包序号()
                        thisLocal.scene登录.显示登录界面()
                    }
                    break
            }
            // console.log("sn", sn)

        }

        //连接关闭的回调方法
        this.websocket.onclose = function (e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            console.log(e)

            if (null == thisLocal.websocket)
                return//后台主动通知关闭

            thisLocal.清零网络数据包序号()
            thisLocal.websocket = null


            thisLocal.str在线人数 = '连接已断开，已回到登录场景'
            if (thisLocal.scene登录) {
                thisLocal.scene登录.显示登录界面()
            } else {
                // director.loadScene('scene登录')
                // thisLocal.scene战斗.main = null
                // thisLocal.scene战斗 = null
                // console.log('开始loadScene')
                // director.loadScene('scene登录', (err, scene) => {
                //     console.log('断网回到登录场景', thisLocal.scene登录.nodeSelectSpace.active)
                //     // director.runScene(scene);
                //     // thisLocal.scene登录.显示登录界面()
                // })
                //let fun = ()=>thisLocal.回到登录场景(true)
                // fun()
                // thisLocal.scheduleOnce(fun,0.1)
                thisLocal.回到登录场景()
            }
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.onbeforeunload = function () {
            console.log("onbeforeunload")
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
        thisLocal.recvMsgSnWorldSvr = Main.uint8自增(thisLocal.recvMsgSnWorldSvr)
        // if(thisLocal.recvMsgSnWorldSvr != snFromWorldSvr)
        // console.error('recvMsgSn ', thisLocal.recvMsgSnWorldSvr , 'snFromWorldSvr', snFromWorldSvr)
        // console.log("sn", sn)
        switch (msgId) {
            case MsgId.在线人数:
                {
                    let 人数 = arr[idxArr++] as number
                    let arr昵称 = arr[idxArr++] as string[]
                    this.str在线人数 = 人数 + '人在线:'
                    console.log('arr', arr)

                    if (!this.b登录成功) {
                        this.b登录成功 = true;
                        this.scene登录.nodeSelectSpace.active = true
                    }
                    arr昵称.forEach((str昵称: String) => {
                        this.str在线人数 += str昵称 + '、'
                    })
                    this.显示在线人数()
                }
                break

        }
    }
    显示在线人数(): void {
        console.log(this.str在线人数)
        if (this.scene战斗 && this.scene战斗.battleUI)
            this.scene战斗.battleUI.lable在线人数.string = this.str在线人数

        if (this.scene登录)
            this.scene登录.lableMessage.string = this.str在线人数
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
        thisLocal.recvMsgSnGameSvr = Main.uint8自增(thisLocal.recvMsgSnGameSvr)
        if (thisLocal.recvMsgSnGameSvr != sn) {
            console.error('recvMsgSnGameSvr ', thisLocal.recvMsgSnGameSvr, 'sn', sn)
            thisLocal.recvMsgSnGameSvr = sn;
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
    private 关闭插屏广告() {
        if (window.CC_WECHAT) {
            // 关闭插屏广告
            if (this.interstitialAd) {
                this.interstitialAd.destroy()
                this.interstitialAd = null
            }
        }
    }

    onClickSay(str: string) {
        if (str.length == 0)
            return

        if (this.websocket != undefined) {
            this.sendArray([
                [MsgId.Say, 0, 0],
                str
            ])
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

        director.loadScene('scene登录', (err, scene) => {
            // console.log('回到登录场景,nodeSelectSpace.active=', this.scene登录.nodeSelectSpace.active)
            // director.runScene(scene);
            // this.scene登录.nodeSelectSpace.active = !b重新登录
            // this.scene登录.nodeLoginPanel.active = b重新登录
        })
        // director.loadScene('scene登录')
        // console.log('回到登录场景,nodeSelectSpace.active=', this.scene登录.nodeSelectSpace.active)
        // director.runScene(scene);
        // this.scene登录.nodeSelectSpace.active = !b重新登录
        // this.scene登录.nodeLoginPanel.active = b重新登录

    }
    send离开Space() {
        if (this.websocket != undefined) {
            this.sendArray([
                [MsgId.离开Space, 0, 0],
            ])
        }
    }
    send选中(arr选中: number[]) {
        if (this.websocket != undefined) {
            this.sendArray([
                [MsgId.SelectRoles, ++this.sendMsgSn, 0],
                arr选中,//虽然是整数，但是也强制转成FLOAT64发出去了
                this.b点击活动单位都是追加选中
            ])
        }

        this.arr选中 = arr选中
    }
    onClick出地堡() {
        if (0 == this.arr选中.length) {
            console.log('没选中任何单位')
            return
        }
        this.sendArray([
            [MsgId.出地堡, ++this.sendMsgSn, 0],
            this.arr选中[0]
        ])
    }
    onClick空闲工程车() {
        this.sendArray([[MsgId.切换空闲工程车, ++this.sendMsgSn, 0]])
    }
    onClick解锁近战兵() {
        this.解锁单位(单位类型.近战兵)
    }
    onClick解锁枪虫() {
        this.解锁单位(单位类型.枪虫)
    }
    解锁单位(单位: 单位类型) {
        this.sendArray([[MsgId.解锁单位, ++this.sendMsgSn, 0], 单位])
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

    onClick剧情对话全屏点击() {
        this.sendArray([[MsgId.剧情对话已看完, ++this.sendMsgSn, 0]])
    }
    send原地坚守() {
        this.sendArray([[MsgId.原地坚守, ++this.sendMsgSn, 0]])
    }

    // Ensure the value stays within the range of uint8_t
    static uint8自增(sn: number): number {
        return (sn + 1) % 256
    }
}