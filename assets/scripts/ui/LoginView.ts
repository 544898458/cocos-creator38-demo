import { _decorator, Node } from 'cc';
import { Dialog } from '../component/Dialog';
import { EditBox } from 'cc';
import { sys } from 'cc';
import { Glob } from '../utils/Glob';
import { RichText } from 'cc';
import { dispatcher } from '../manager/event/EventDispatcher';
import { MsgId, 战局类型 } from '../utils/Enum';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { MainTest } from '../MainTest';
import { toast } from '../manager/ToastMgr';
import { Label } from 'cc';
import { assetManager } from 'cc';
import { AudioClip } from 'cc';
import { AudioSource } from 'cc';
import { TextAsset } from 'cc';
import { NetMessage } from '../manager/NetMessage';
import { EC } from '../utils/EC';
import { JsonAsset } from 'cc';
const { ccclass, property } = _decorator;
declare const tt: any;
@ccclass('LoginView')
export class LoginView extends Dialog {
    @property({ type: EditBox })
    editBox登录名: EditBox
    @property({ type: Node, displayName: "主页面" })
    LoginPanel: Node;
    @property({ type: RichText, displayName: "加载提示" })
    lableMessage: RichText;
    @property({ type: Node })
    nodeSelectMode: Node;
    @property({ type: Node })
    nodeSelectPlay: Node;
    @property({ type: Node })
    nodeSelectRace: Node;
    @property({ type: Node })
    node个人战局列表: Node

    @property({ type: Node })
    node跳转社区浏览器H5: Node
    @property({ type: Node })
    node跳转社区微信小游戏: Node
    @property({ type: Node })
    node跳转社区抖音小游戏: Node

    @property(RichText)
    richText公告: RichText;

    @property(Node) node登录面板: Node
    @property(Node) node选择模式: Node

    个人战模式: number = -1;
    onOpened(param: any): void {
        // // 登录失败监听
        // dispatcher.on(EC, ({ result, message }) => {
        //     this.lableMessage.string = message;
        // },this);

        // 显示登录界面
        dispatcher.on(EC.SHOW_LOGIN_UI, this.显示登录界面, this);

        console.log("LoginView.onOpened", param)
        MainTest.instance.scene登录 = this
        // this.loadNode.active = true;
        if (Glob.str在线人数)
            this.lableMessage.string = Glob.str在线人数

        if (Glob.websocket) {
            this.node选择模式.active = true
            this.node登录面板.active = false
        }
        //显示上次登录昵称
        this.editBox登录名.string = sys.localStorage.getItem(Glob.KEY_登录名) || ""
        // this.显示登录界面();

        MainTest.instance.微信小游戏允许分享()
        if (sys.isBrowser)
            this.node跳转社区浏览器H5.active = true
        else if (LoginView.是抖音小游戏())
            this.node跳转社区抖音小游戏.active = true
        else
            this.node跳转社区微信小游戏.active = true

        MainTest.instance.onSecen登录Load()

        if (Glob.strHttps登录场景音乐Mp3) {
            assetManager.loadRemote(Glob.strHttps登录场景音乐Mp3, (err, clip: AudioClip) => {
                console.log('resources.load callback:', err, clip)
                let audioSource = MainTest.instance.audioManager.getComponent(AudioSource)
                if (!audioSource)
                    return

                audioSource.stop()
                audioSource.clip = clip
                audioSource.play()
            })
        }

        assetManager.loadRemote('https://www.rtsgame.online/公告/公告.txt', (err, textAsset: TextAsset) => {
            console.log('resources.load callback:', err, textAsset)
            this.richText公告.string = textAsset.text
        })

        //遍历 战局类型
          for(let 战局 = 战局类型.单人ID_非法_MIN+1;战局<战局类型.单人ID_非法_MAX;战局++){
            assetManager.loadRemote(`https://www.rtsgame.online/排行榜/战局_${战局}_赢.json`, (err, jsonAsset: JsonAsset) => {
                console.log('resources.load callback:', err, jsonAsset)
                let playerStats = jsonAsset.json
                console.log(playerStats)
            })
                 
            assetManager.loadRemote(`https://www.rtsgame.online/排行榜/战局_${战局}_输.json`, (err, jsonAsset: JsonAsset) => {
                console.log('resources.load callback:', err, jsonAsset)
                let playerStats = jsonAsset.json
                console.log(playerStats)
            })
        }
        if (LoginView.是抖音小游戏()) {
            // --侧边栏按钮判断--//
            tt.onShow((res) => {
                //判断用户是否是从侧边栏进来的
                let isFromSidebar = (res.launch_from == 'homepage' && res.location == 'sidebar_card')

                if (isFromSidebar) {
                    //如果是从侧边栏进来的，隐藏“去侧边栏”
                    // this.btnSidebar.active = false
                    this.lableMessage.string = '您从侧边栏进入了游戏，可免除一次插屏广告'
                }
                else {
                    //否则 显示“去侧边栏”按钮
                    // this.btnSidebar.active = true
                }
            });
        }
    }
    static 是抖音小游戏(): boolean {
        return typeof tt !== 'undefined' && tt != null
    }
    //点击登录
    onClickLogin(event: Event, customEventData: string) {
        MainTest.instance.b登录成功 = false
        // this.微信小游戏获得OpenID()
        let str登录名 = this.editBox登录名.string
        Glob.myNickName = str登录名
        sys.localStorage.setItem(Glob.KEY_登录名, str登录名)

        console.log(str登录名 + "登录游戏")
        if (str登录名.length == 0) {
            //飘字
            toast.showToast('请输入昵称（随便什么都可以）', 100)
            return
        }

        this.LoginPanel.active = false//隐藏主页面
        this.lableMessage.string = '正在连接'
        // this.websocket = new WebSocket("ws://192.168.31.194:12348/")
        // this.websocket = new WebSocket("ws://192.168.31.170:12348/")
        // this.websocket = new WebSocket("ws://192.168.43.186:12348/")
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/")
        // this.websocket = new WebSocket("ws://192.168.0.96:12348/")
        // this.websocket = new WebSocket("ws://47.119.184.177:12348/")
        // this.websocket = new WebSocket("wss://rtsgame.online/")
        // this.websocket = new WebSocket("wss://test.rtsgame.online/")
        Glob.websocket = new WebSocket("wss://" + customEventData)
        // this.websocket = new WebSocket("ws://127.0.0.1:443")
        // We should pass the cacert to libwebsockets used in native platform, otherwise the wss connection would be closed.
        // let url = this.wssCacert.nativeUrl;
        // if (assetManager.cacheManager) {
        //     url = assetManager.cacheManager.getCache(url) || assetManager.cacheManager.getTemp(url) || url;
        // }
        // We should pass the cacert to libwebsockets used in native platform, otherwise the wss connection would be closed.
        // this._wsiSendBinary = new WebSocket('wss://echo.websocket.events', [], url);
        // console.log(url)

        // this.websocket = new WebSocket('wss://wss2.iotlabor.cn:12348/',[])//, url)
        // this.websocket = new WebSocket('wss://wss.iotlabor.cn/',[], url)
        // this.websocket = new WebSocket('wss://echo.websocket.events', [])//, url);
        Glob.websocket.binaryType = 'arraybuffer'
        console.log(Glob.websocket)

        //连接发生错误的回调方法
        Glob.websocket.onerror = () => {
            this.lableMessage.string = "连接错误，您可以再试一次"
            this.LoginPanel.active = true//再次显示，可以再点登录
        }

        //连接成功建立的回调方法
        Glob.websocket.onopen = (event: Event) => {
            this.lableMessage.string = "连接成功，请等待登录结果……"
            console.log(this.lableMessage.string)
            dispatcher.sendArray([
                [MsgId.Login, ++Glob.sendMsgSn],
                0,
                str登录名,
                'Hello, world!pwd',
                20,//版本号
            ])

            this.选择模式();
        }

        let thisLocal = this
        // 原来的 onmessage 改写如下：
        Glob.websocket.onmessage = (event: MessageEvent) => {
            NetMessage.instance.handle(event);
        };

        //连接关闭的回调方法
        Glob.websocket.onclose = function (e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            console.log(e)

            if (null == Glob.websocket)
                return//后台主动通知关闭

            thisLocal.清零网络数据包序号()
            Glob.websocket = null


            thisLocal.lableMessage.string = '连接已断开，已回到登录场景'
            if (thisLocal) {
                thisLocal.显示登录界面()
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
                thisLocal.回到登录场景();
            }
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.onbeforeunload = function () {
            console.log("onbeforeunload")
        }
    }

    onSetting(): void {
        toast.showToast('暂未开放设置')
    }
    清零网络数据包序号() {
        Glob.recvMsgSnGameSvr = 0
        Glob.recvMsgSnWorldSvr = 0
        Glob.recvMsgSn = 0
        Glob.sendMsgSn = 0
    }
    //连接成功，打开选择战役模式
    选择模式() {
        this.LoginPanel.active = false;
        this.nodeSelectMode.active = true
    }
    选择战役(event: Event, customEventData: string) {
        this.nodeSelectMode.active = false
        this.nodeSelectPlay.active = true
        let des = this.nodeSelectPlay.getChildByName('操作说明').getComponent(Label)
        if (customEventData == '1')//单人战役
        {
            des.string = "单人战役：有训练战，防守战，攻坚战\n请选择你的玩法类型\n\n\n\n"
            this.nodeSelectPlay.getChildByName("单人战役").active = true;
            this.nodeSelectPlay.getChildByName("多人战役").active = false;

        }
        else if (customEventData == '2')//多人战役
        {

            des.string = "多人战役：\n多人全图混战：无限玩家同台地图竞技\n四方对战：四人玩家同台竞技，地图采用东西南北区域限制\n请选择你的玩法类型\n\n\n\n"
            this.nodeSelectPlay.getChildByName("单人战役").active = false;
            this.nodeSelectPlay.getChildByName("多人战役").active = true;
        }
    }

    个人战类型(event: Event, customEventData: string) {
        this.个人战模式 = parseInt(customEventData);
        this.nodeSelectPlay.active = false;
        this.nodeSelectRace.active = true;
    }
    选择种族(event: Event, customEventData: string) {

        if (this.个人战模式 > 0) {
            switch (this.个人战模式) {
                case 1:
                    //MainTest.instance.onClick进单人战局(customEventData == '1' ? 战局类型.新手训练_单位介绍_人 : 战局类型.新手训练_单位介绍_虫)
                    MainTest.instance.onClick进单人战局(customEventData == '1' ? 战局类型.新手训练_战斗_人 : 战局类型.新手训练_战斗_虫)
                    break;
                case 2:
                    MainTest.instance.onClick进单人战局(customEventData == '1' ? 战局类型.防守战_人 : 战局类型.防守战_虫)
                    break;
                case 3:
                    MainTest.instance.onClick进单人战局(customEventData == '1' ? 战局类型.攻坚战_人 : 战局类型.攻坚战_虫)
                    break;
            }
        }
    }
    打开房间(event: Event, customEventData: string): void {
        this.nodeSelectPlay.active = false
        this.node个人战局列表.active = true
    }
    显示登录界面(): void {
        this.nodeSelectRace.active = false
        this.nodeSelectMode.active = false
        this.nodeSelectPlay.active = false
        this.node个人战局列表.active = false
        this.nodeSelectPlay.getChildByName("单人战役").active = false;
        this.nodeSelectPlay.getChildByName("多人战役").active = false;
        this.LoginPanel.active = true
        if (Glob.websocket)
            this.lableMessage.string = '连接已断开，已回到登录界面'
    }

    回到登录场景(): void {
        console.log("回到登录场景")
    }
    //游戏讨论关于
    onClick浏览器H5打开游戏圈(event: Event, customEventData: string) {
        window.open('https://game.weixin.qq.com/cgi-bin/comm/openlink?auth_appid=wx62d9035fd4fd2059&url=https%3A%2F%2Fgame.weixin.qq.com%2Fcgi-bin%2Fh5%2Flite%2Fcirclecenter%2Findex.html%3Fwechat_pkgid%3Dlite_circlecenter%26liteapp%3Dliteapp%253A%252F%252Fwxalited17d79803d8c228a7eac78129f40484c%253Fpath%253Dpages%25252Findex%25252Findex%26appid%3Dwx57e5c006d2ac186e%26ssid%3D30%23wechat_redirect')
    }
    onClick微信小游戏内打开游戏圈(event: Event, customEventData: string) {
        const pageManager = (window as any).wx.createPageManager();

        //在这里获取链接
        // https://mp.weixin.qq.com/wxamp/frame/pluginRedirect/pluginRedirect?title=&action=plugin_redirect&lang=zh_CN&plugin_uin=1029&simple=1&nosidebar=1&custom=jump_page%3Dcontent-manage&token=1691532200
        pageManager.load({
            openlink: '-SSEykJvFV3pORt5kTNpS0deg0PdxuJJSkUnhq8VuwmiCOlSerKbw3_eQMoQsKtG7u7ovcU2tf3Ri8TFTIT7JiRqpt6_p8D30pvzUtRVzPZyRcmFaNgsm5t0jZPvnltbvWo4Wtm_nR4hzmLJVodYYBBYes4VRydM4PXFgtlepB_Lx0tu-_mGT_4EDgkfWYblacfaemzG5t5p5C3a-YGQln7uvJrtBmo9oZ3YFOxrCUroBMr0KyI26YHX3p3ikM4COFCXY3--BYqKqlPpYvp7nNBA9EVIHzNyWHWiUdYyZizvU08S6KxH1XMyUozv-qWvW0NwhaBys1Md-_AcwIhLqw',
        }).then((res: any) => {
            // 加载成功，res 可能携带不同活动、功能返回的特殊回包信息（具体请参阅渠道说明）
            console.log(res);

            // 加载成功后按需显示
            pageManager.show();

        }).catch((err: any) => {
            // 加载失败，请查阅 err 给出的错误信息
            console.error(err);
        })
    }
    onClick微信公众号(event: Event, customEventData: string) {
        console.log('window.CC_WECHAT', (window as any).CC_WECHAT)
        if ((window as any).CC_WECHAT) {
            // 调用微信小游戏的跳转方法
            (window as any).wx.navigateToMiniProgram({
                appId: 'wx2e932efa8e0740f0', // 替换为实际的公众号 AppID
                path: '', // 公众号的路径，如果需要指定特定页面，可以在这里设置
                extraData: {
                    // 可以传递额外的数据，如果需要
                },
                success(res: any) {
                    // 跳转成功后的回调
                    console.log('跳转成功', res);
                },
                fail(res: any) {
                    // 跳转失败后的回调
                    console.log('跳转失败', res);
                }
            });

        } else {
            this.lableMessage.string = '请搜索公众号：<color=#ffff00>即时战略指挥</color>'
        }
    }
    onClick玩家QQ群(event: Event, customEventData: string) {
        //在这里获取链接
        //https://qun.qq.com/#/handy-tool/join-group
        window.open("https://qm.qq.com/cgi-bin/qm/qr?k=uKSxRp6smVkEPkKdFTfPJ9LpS_fy1-IH&jump_from=webapi&authKey=94/gex13gRVyrye9ScLqliCQQ3m7kWWRHyYgo82kp1eEuHOdkZOaLHufZDubw6WQ")
    }
    onClick百度贴吧(event: Event, customEventData: string) {
        window.open("https://tieba.baidu.com/f?kw=%E5%8D%B3%E6%97%B6%E6%88%98%E7%95%A5%E6%8C%87%E6%8C%A5")
    }

    //进入游戏
    onClickToggle进Space1(event: Event, customEventData: string) {//混战
        MainTest.instance.进Scene战斗('scene战斗', MsgId.进Space, 战局类型.多玩家混战, '', true)
    }
    onClick创建四方对战(event: Event, customEventData: string) {
        MainTest.instance.onClick创建四方对战()
    }
}


