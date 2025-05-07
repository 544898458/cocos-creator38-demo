import { _decorator, Component, Node } from 'cc';
import { Dialog } from '../component/Dialog';
import { EditBox } from 'cc';
import { sys } from 'cc';
import { Glob } from '../utils/Glob';
import { RichText } from 'cc';
import { dispatcher, EventDispatcher } from '../manager/event/EventDispatcher';
import { MsgId, LoginResult } from '../utils/Enum';
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { MainTest } from '../MainTest';
import { globalShortcut } from 'electron/main';
import { toast } from '../manager/ToastMgr';
const { ccclass, property } = _decorator;

@ccclass('LoginView')
export class LoginView extends Dialog {
    @property({ type: EditBox })
    editBox登录名: EditBox
    @property({ type: Node, displayName: "主页面" })
    LoginPanel: Node;
    @property({ type: RichText, displayName: "加载提示" })
    lableMessage: RichText;
    @property({ type: Node, displayName: "选择模式" })
    nodeSelectMode: Node;
    @property({ type: Node, displayName: "选择玩法" })
    nodeSelectPlay: Node;
    @property({ type: Node, displayName: "选择种族" })
    nodeSelectRace: Node;
    @property({ type: Node, displayName: "房间" })
    node个人战局列表: Node;

    b登录成功: boolean = false;
    onOpened(param: any): void {
        console.log("LoginView.onOpened", param)
        //显示上次登录昵称
        this.editBox登录名.string = sys.localStorage.getItem(Glob.KEY_登录名)
    }

    //点击登录
    onClickLogin(event: Event, customEventData: string) {
        this.b登录成功 = false
        // this.微信小游戏获得OpenID()
        let str登录名 = this.editBox登录名.string
        Glob.myNickName = str登录名
        sys.localStorage.setItem(Glob.KEY_登录名, str登录名)

        console.log(str登录名 + "登录游戏")
        if (str登录名.length == 0) {
            //飘字
            toast.showToast('请输入昵称（随便什么都可以）')
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
                16,//版本号
            ])

            // this.scene登录.nodeSelectSpace.active = true
        }

        // let lableMessage = this.lableMessage
        let thisLocal = this
        //接收到消息的回调方法
        Glob.websocket.onmessage = function (event: MessageEvent) {
            let data = event.data as ArrayBuffer
            const arr = msgpack.decode(new Uint8Array(data))
            // console.log("msgpack.decode结果：", data, data.byteLength)
            let idxArr = 0
            let msgHead = arr[idxArr++]
            let msgId = msgHead[0] as MsgId
            let sn收到 = msgHead[1] as number
            let arr消息 = arr.slice(idxArr)
            // console.log("收到GateSvr消息,msgId：", msgId, ',sn收到:', sn收到)
            Glob.recvMsgSn = (Glob.recvMsgSn + 1) % 256;// ++thisLocal.recvMsgSn
            if (Glob.recvMsgSn != sn收到)
                console.error('收到GateSvr消息sn不同', Glob.recvMsgSn, 'sn收到:', sn收到)
            switch (msgId) {
                case MsgId.GateSvr转发GameSvr消息给游戏前端:
                    {
                        let arrGameMsg = arr[idxArr++]
                        // console.log('收到GameSvr消息',arrGameMsg)
                        MainTest.instance.onRecvGameSvr(arrGameMsg)
                    }
                    break
                case MsgId.GateSvr转发WorldSvr消息给游戏前端:
                    let arrWorldMsg = arr[idxArr++]
                    // console.log('收到WorldSvr消息',arrWorldMsg)
                    MainTest.instance.onRecvWorldSvr(arrWorldMsg)
                    break
                case MsgId.Login:
                    {
                        let [rpcSnId, result, strMsg] = arr消息 as [number, LoginResult, string]
                        idxArr += 3
                        console.log(result, strMsg)
                        if (result == LoginResult.OK)
                            return

                        thisLocal.lableMessage.string = strMsg

                        switch (result) {
                            case LoginResult.客户端版本不匹配:
                                break
                            default:
                                break
                        }

                        Glob.websocket.onclose = null
                        Glob.websocket.close()
                        Glob.websocket = null
                        thisLocal.清零网络数据包序号()
                        thisLocal.显示登录界面()
                    }
                    break
            }
            // console.log("sn", sn)

        }

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
    显示登录界面(): void {
        this.nodeSelectRace.active = false
        this.nodeSelectMode.active = false
        this.nodeSelectPlay.active = false
        this.node个人战局列表.active = false
        this.LoginPanel.active = true
        if (Glob.websocket)
            this.lableMessage.string = '连接已断开，已回到登录界面'
    }
    回到登录场景(): void {
        console.log("回到登录场景")
    }
    update(deltaTime: number) {

    }
}


