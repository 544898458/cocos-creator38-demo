import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, AssetManager, Asset, assetManager, Animation} from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from '../component/head-scale'
import { Scene战斗, ClientEntityComponent } from '../scene/Scene战斗'
import { Scene登录 } from '../scene/Scene登录'
import { AudioMgr } from '../manager/AudioMgr'
import { ProgressBar } from 'cc'
import { ParticleSystem } from 'cc'
import { tween } from 'cc'
import { copyFileSync } from 'original-fs'
import { Quat } from 'cc'
import { AudioClip } from 'cc'

const { ccclass, property } = _decorator

export 
/// <summary>
/// 网页强制要求协议:外层是二进制WS(WebSocket)，二进制用 MsgPack 序列化
/// 微信小程序强制要求协议：外层是WSS，也就是三层，最外层TLS1.3，中间是二进制WS(WebSocket)，最里面是 MsgPack 序列化
/// </summary>
enum MsgId
{
	/// <summary>
	/// 无效
	/// </summary>
	MsgId_Invalid_0,
	/// <summary>
	/// 登录 
	/// C=>S MsgLogin
	/// S=>C 回应MsgLoginResponce
	/// </summary>
	Login,
	/// <summary>
	/// 请求把选中的单位移动到目标位置
	/// C=>S MsgMove
	/// </summary>
	Move,
	/// <summary>
	/// 场景中加单位，通知前端
	/// S=>C MsgAddRoleRet
	/// </summary>
	AddRoleRet,
	/// <summary>
	/// 通知前端，单位位置和血量变化
	/// S=>C MsgNotifyPos
	/// </summary>
	NotifyPos,
	/// <summary>
	/// 通知前端，单位播放骨骼动画（动作）
	/// S=>C MsgChangeSkeleAnim
	/// </summary>
	ChangeSkeleAnim,
	/// <summary>
	/// 系统提示和玩家聊天
	/// S=>C C=>S MsgSay 
	/// </summary>
	Say,
	/// <summary>
	/// 玩家请求选中单位
	/// C=>S	MsgSelectRoles
	/// </summary>
	SelectRoles,
	/// <summary>
	/// 玩家请求造活动单位（训练兵、近战兵，制造工程车、坦克）
	/// C=>S MsgAddRole
	/// </summary>
	AddRole,
	/// <summary>
	/// 通知前端删除一个单位
	/// S=>C MsgDelRoleRet
	/// </summary>
	DelRoleRet,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	ChangeMoney,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	ChangeMoneyResponce,
	/// <summary>
	/// 玩家请求建造建筑单位
	/// C=>S MsgAddBuilding
	/// </summary>
	AddBuilding,
	/// <summary>
	/// 通知前端钱变化（现在钱没用，前端不会显示，所以不用做。从策划上来说，钱属于局外数据）
	/// </summary>
	NotifyeMoney,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	Gate转发,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateAddSession,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateAddSessionResponce,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateDeleteSession,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateDeleteSessionResponce,
	/// <summary>
	/// 玩家请求采集
	/// </summary>
	采集,
	/// <summary>
	/// 通知前端，燃气矿、晶体矿、活动单位数
	/// Msg资源
	/// </summary>
	资源,
	/// <summary>
	/// 玩家请求选中的单位进地堡
	/// </summary>
	进地堡,
	/// <summary>
	/// 玩家请求选中的地堡中的兵全部出来
	/// </summary>
	出地堡,
	/// <summary>
	/// 玩家请求进公共地图（多人联机地图）
	/// C=>S 成功后 S=>C
	/// 注意：进单人剧情副本成功、进多人对局成功，也是发给前端 Msg进Space
	/// </summary>
	进Space,
	/// <summary>
	/// 玩家请求进单人剧情副本（训练战、防守战）
	/// </summary>
	进单人剧情副本,
	/// <summary>
	/// 没用
	/// </summary>
	显示界面_没用到,
	/// <summary>
	/// 玩家请求离开公共地图（多人联机地图）
	/// </summary>
	离开Space,
	/// <summary>
	/// 通知前端显示单位描述（建造进度、训练活动单位进度、采集进度）
	/// </summary>
	Entity描述,
	/// <summary>
	/// 通知前端播放语音或音效
	/// </summary>
	播放声音,
	/// <summary>
	/// 让玩家摄像机对准某处
	/// </summary>
	设置视口,
	/// <summary>
	/// 玩家请求框选单位
	/// C=>S
	/// </summary>
	框选,
	/// <summary>
	/// 玩家拉取全局个人战局列表
	/// </summary>
	玩家个人战局列表,
	/// <summary>
	/// 玩家请求进别人的个人战局（训练战、防守战）
	/// </summary>
	进其他玩家个人战局,
	/// <summary>
	/// 创建多人战局（四方对战）
	/// </summary>
	创建多人战局,
	/// <summary>
	/// 拉取全局多人战局列表
	/// </summary>
	玩家多人战局列表,
	/// <summary>
	/// 进别人的多人战局
	/// </summary>
	进其他玩家多人战局,
	/// <summary>
	/// 选中空闲工程车
	/// </summary>
	切换空闲工程车,
	/// <summary>
	/// 通知前端播放光子炮攻击特效（从光子炮飞向目标）
	/// </summary>
	弹丸特效,
	/// <summary>
	/// 通知前端显示剧情对话界面
	/// S=>C
	/// </summary>
	剧情对话,
	/// <summary>
	/// 前端告诉服务器已经看完此页剧情对话
	/// C=>S
	/// </summary>
	剧情对话已看完,
	在线人数,
    GateSvr转发GameSvr消息给游戏前端,
    GateSvr转发WorldSvr消息给游戏前端,
    建筑产出活动单位的集结点,
    播放音乐,
};

enum 副本ID
{
	单人ID_非法_MIN,
	训练战,
	防守战,
	攻坚战,
	单人ID_非法_MAX,

	多人ID_非法_MIN = 100,
	四方对战,
	多人ID_非法_MAX,

	多人联机地图,
};

export
enum 单位类型
{
	单位类型_Invalid_0,

	特效,
	视口,

	资源Min非法 = 100,
	晶体矿,//Minerals
	燃气矿,//Vespene Gas


	活动单位Min非法 = 200,
	工程车,//空间工程车Space Construction Vehicle。可以采矿，采气，也可以简单攻击
	兵,//陆战队员Marine。只能攻击，不能采矿
	近战兵,//火蝠，喷火兵Firebat
	三色坦克,
	工蜂,
    飞机,

    活动单位Max非法,

	建筑Min非法 = 300,
	基地,//指挥中心(Command Center),用来造工程车()
	兵厂,//兵营(Barracks)，用来造兵
	民房,//供给站(Supply Depot)
	地堡,//掩体; 地堡(Bunker),可以进兵
	光子炮,//Photon Cannon
    孵化场,//hatchery
    机场,
    重工厂,

	建筑Max非法,
};

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

enum LoginResult
{
    OK,
    Busy,
    PwdErr,
    NameErr,
	客户端版本太低,
    客户端版本太高,
}

@ccclass('Main')
export class Main extends Component {
    websocket: WebSocket
    // lableMessage: Label
    // lableMessage语音提示: Label
    @property({type: Asset})
    public wssCacert: Asset = null!;

    recvMsgSnGameSvr: number = 0
    recvMsgSnWorldSvr: number = 0
    recvMsgSn: number = 0
    sendMsgSn: number = 0
    scene战斗: Scene战斗 = null
    scene登录: Scene登录 = null
    arr选中: number[] = []
    str在线人数: string = null
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    fun创建消息: (Vec3) => object = null//this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    funCreateMsg造建筑: (Vec3) => object
    // funCreateMsgMove遇敌自动攻击 = this.createMsgMove遇敌自动攻击
    createMsgMove强行走(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, false)
    }
    createMsg集结点(hitPoint: Vec3) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.建筑产出活动单位的集结点, ++this.sendMsgSn, 0], [hitPoint.x, hitPoint.z]]
    }
    static Is活动单位(类型:单位类型): boolean{
        return 单位类型.活动单位Min非法 < 类型 && 类型 < 单位类型.活动单位Max非法;
    }
    清零网络数据包序号(){
        this.recvMsgSnGameSvr = 0
        this.recvMsgSnWorldSvr = 0
        this.recvMsgSn = 0
        this.sendMsgSn = 0
    }
    send(buf:Buffer){
        if (this.websocket == undefined) 
        {
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
    sendArray(arr:(string|number[])[])
    {
        const encoded = msgpack.encode(arr)
        console.log(encoded)
        this.send(encoded)
    }
    createMsgMove遇敌自动攻击(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, true)
    }
    createMsgMove(hitPoint: Vec3, b遇敌自动攻击: boolean) {
        if (0 == this.arr选中.length )
            return null

        return [[MsgId.Move, 0],
        [hitPoint.x, hitPoint.z],
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
    }

    update(deltaTime: number) {

    }
    造活动单位(类型:单位类型){
        const encoded = msgpack.encode([[MsgId.AddRole, 0, 0], 类型])
        // console.log(encoded)
        this.send(encoded)
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.三色坦克)
    }
    onClickAdd兵(event: Event, customEventData: string): void {
        this.造活动单位(单位类型.兵)
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
    createMsg造建筑(hitPoint: Vec3, 类型: 单位类型) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.AddBuilding, ++this.sendMsgSn, 0], 类型, [hitPoint.x, hitPoint.z]]
    }
    on点击按钮_造建筑(类型: 单位类型) {
        this.fun创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.funCreateMsg造建筑 = this.fun创建消息 
        this.scene战斗.battleUI.lable系统消息.string = '请点击地面放置建筑'
        this.scene战斗.battleUI.下部列表.active = false
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
    onClickAdd光子炮(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.光子炮)
    }
    onClickAdd孵化场(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.孵化场)
    }
    onClickAdd机场(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.机场)
    }
    onClickAdd重工厂(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(单位类型.重工厂)
    }
    
    进Scene战斗(sceneName: string, encoded: Buffer) {
        this.scene登录.nodeSelectSpace.active = false
        director.preloadScene(sceneName, (completedCount: number, totalCount: number, item: AssetManager.RequestItem) => {
            console.log(completedCount, totalCount, item)
            this.scene登录.lableMessage.string = completedCount + '/' + totalCount + '\n' + item.url
        }, () => {
            this.scene登录.main = null
            this.scene登录 = null
            director.loadScene(sceneName, (err, scene) => {
                // this.nodeSelectSpace.active = false

                this.send(encoded)
            })
        })
    }
    进Scene战斗单人剧情副本(sceneName: string, id: 副本ID) {
        this.进Scene战斗(sceneName, msgpack.encode([[MsgId.进单人剧情副本, 0, 0], id]))
    }
    onClickToggle进训练战() {
        this.进Scene战斗单人剧情副本('scene战斗', 副本ID.训练战)
    }
    onClickToggle进防守战() {
        this.进Scene战斗单人剧情副本('scene防守战', 副本ID.防守战)
    }
    onClick进攻坚战(){
        this.进Scene战斗单人剧情副本('scene攻坚战', 副本ID.攻坚战)
    }
    onClick创建四方对战() {
        this.进Scene战斗('scene四方对战', msgpack.encode([[MsgId.创建多人战局, 0, 0], 副本ID.四方对战]))
    }
    onClick获取别人的个人战局列表(event: Event, customEventData: string) {
        console.log(event,customEventData)
        this.sendArray([[MsgId.玩家个人战局列表, ++this.sendMsgSn, 0, 0]])
    }
    onClick获取别人的多人战局列表(event: Event, customEventData: string) {
        console.log(event,customEventData)
        this.sendArray([[MsgId.玩家多人战局列表, ++this.sendMsgSn, 0, 0]])
    }
    onClick进入别人的个人战局(event: Event, customEventData: string) {
        console.log(event, customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), msgpack.encode([[MsgId.进其他玩家个人战局, ++this.sendMsgSn, 0, 0],customEventData]))
    } 
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        console.log(event,customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), msgpack.encode([[MsgId.进其他玩家多人战局, ++this.sendMsgSn, 0, 0],customEventData]))
    }
    
    onClickLogin(event: Event, customEventData: string) {
        const editNode = utils.find("Name", this.scene登录.nodeLoginPanel) as Node
        console.log(editNode)

        const editBox = editNode.getComponent(EditBox)
        console.log(editBox.string)
        if (editBox.string.length == 0) {
            this.scene登录.lableMessage.string = '请输入账号名字（随便什么都可以）'
            return
        }

        this.scene登录.nodeLoginPanel.active = false//隐藏
        this.scene登录.lableMessage.string = '正在连接'
        // this.websocket = new WebSocket("ws://192.168.31.194:12348/")
        // this.websocket = new WebSocket("ws://192.168.31.170:12348/")
        // this.websocket = new WebSocket("ws://192.168.43.186:12348/")
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/")
        // this.websocket = new WebSocket("ws://192.168.0.96:12348/")
        // this.websocket = new WebSocket("ws://47.119.184.177:12348/")
        // this.websocket = new WebSocket("wss://rtsgame.online/")
        // this.websocket = new WebSocket("wss://test.rtsgame.online/")
        this.websocket = new WebSocket("wss://" + customEventData)
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
        this.websocket.binaryType = 'arraybuffer'
        console.log(this.websocket)

        //连接发生错误的回调方法
        this.websocket.onerror = () => {
            this.scene登录.lableMessage.string = "连接错误，您可以再试一次"
            this.scene登录.nodeLoginPanel.active = true//再次显示，可以再点登录
        }

        //连接成功建立的回调方法
        this.websocket.onopen = (event: Event) => {
            this.scene登录.lableMessage.string = "连接成功"
            console.log(this.scene登录.lableMessage.string)
            const object = [
                [MsgId.Login, ++this.sendMsgSn, 0, 0],
                editBox.string,
                'Hello, world!pwd',
                6,//版本号
            ]

            const encoded = msgpack.encode(object)
            console.log(encoded)
            this.send(encoded)

            this.scene登录.nodeSelectSpace.active = true
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
            // console.log("收到GateSvr消息,msgId：", msgId, ',sn收到:', sn收到)
            ++thisLocal.recvMsgSn
            if(thisLocal.recvMsgSn != sn收到)
                console.error('收到GateSvr消息sn不同', thisLocal.recvMsgSn , 'sn收到:', sn收到)
            switch(msgId)
            {
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
                    let result: LoginResult = arr[idxArr++]
                    if(result == LoginResult.OK)
                        return
                    switch(result){
                        case LoginResult.客户端版本太高:
                            thisLocal.scene登录.lableMessage.string = '版本太高，请等服务器更新到最新版'
                            break
                        case LoginResult.客户端版本太低:
                            thisLocal.scene登录.lableMessage.string = '版本太低，请清理缓存再开游戏'
                            break
                        default:
                            thisLocal.scene登录.lableMessage.string = result.toString()
                            break
                    }

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
            
            if(null == thisLocal.websocket)
                return//后台主动通知关闭

            thisLocal.清零网络数据包序号()
            thisLocal.websocket = null


            thisLocal.str在线人数 = '连接已断开，已回到登录场景'
            if(thisLocal.scene登录){
                thisLocal.scene登录.显示登录界面()
            }else{
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
    onRecvWorldSvr(data:ArrayBuffer)
    {
        let thisLocal = this
        // console.log("收到数据：", data, data.byteLength)
        const arr = msgpack.decode(new Uint8Array(data))
        // console.log("msgpack.decode结果：", data, data.byteLength)
        let idxArr = 0
        let msgHead = arr[idxArr++]
        let msgId = msgHead[0] as MsgId
        let snFromWorldSvr = msgHead[1] as number
        // console.log("收到,msgId：", msgId, ',recvMsgSnWorldSvr:', snFromWorldSvr)
        ++thisLocal.recvMsgSnWorldSvr
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
                arr昵称.forEach((str昵称:String)=>{
                    this.str在线人数 += str昵称 + '、'
                })
                this.显示在线人数()
            }
            break
            
        }
    }
    显示在线人数():void
    {
        console.log(this.str在线人数)
        if(this.scene战斗&&this.scene战斗.battleUI)
            this.scene战斗.battleUI.lable在线人数.string = this.str在线人数

        if(this.scene登录)
            this.scene登录.lableMessage.string = this.str在线人数
    }
    onRecvGameSvr(data:ArrayBuffer)
    {
        let thisLocal = this
        // console.log("收到数据：", data, data.byteLength)
        const arr = msgpack.decode(new Uint8Array(data))
        // console.log("msgpack.decode结果：", data, data.byteLength)
        let idxArr = 0
        let msgHead = arr[idxArr++]
        let msgId = msgHead[0] as MsgId
        let sn = msgHead[1] as number
        // console.log("收到,msgId：", msgId, ',sn:', sn)
        ++thisLocal.recvMsgSnGameSvr
        if(thisLocal.recvMsgSnGameSvr != sn){
            console.error('recvMsgSn ', thisLocal.recvMsgSnGameSvr , 'sn', sn)
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
                    let hpMax: number = arr[idxArr++]
                    let 类型: number = arr[idxArr++] as 单位类型
                    console.log(id, nickName, prefabName, '进来了,hpMax', hpMax)
                    if(!thisLocal.scene战斗){
                        // console.log(
                        return   
                    }
                    let old = thisLocal.scene战斗.entities.get(id)
                    if (old == undefined) {
                        old = new ClientEntityComponent()
                        old.hpMax = hpMax
                        old.prefabName = prefabName
                        old.类型 = 类型 
                        thisLocal.scene战斗.entities.set(id, old)
                        if (thisLocal.scene战斗.battleUI.lableCount != undefined)
                            thisLocal.scene战斗.battleUI.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'

                        resources.load(prefabName, Prefab, (err, prefab) => {
                            // console.log('resources.load callback:', err, prefab)
                            if(!thisLocal.scene战斗.roles){
                                console.warn('已离开战斗场景')
                                return
                            }
                            const newNode = instantiate(prefab)
                            thisLocal.scene战斗.roles.addChild(newNode)
                            thisLocal.scene战斗.entityId[newNode.uuid] = id
                            //newNode.position = new Vec3(posX, 0, 0)
                            // console.log('resources.load newNode', newNode)
                            old.view = newNode
                            if(newNode.name =='基地')
                                old.skeletalAnimation = newNode.getChildByName('p_Base_02').getComponent(SkeletalAnimation)
                            else if(newNode.name =='步兵')
                                old.skeletalAnimation = newNode.getChildByName('p_A_rifle_01').getComponent(SkeletalAnimation)
                            else if(newNode.name =='工程车'){
                                // old.skeletalAnimation = newNode.getChildByPath('scv/Geoset_0').getComponent(Animation)
                                old.skeletalAnimation = newNode.getChildByPath('world/mesh_uv.obj').getComponent(Animation)
                            }else if(newNode.name == '三色坦克')
                                old.skeletalAnimation = newNode.getChildByName('p_B_tank_03').getComponent(SkeletalAnimation)
                            else if(newNode.name == '跳虫'){
                                old.skeletalAnimation = newNode.getChildByName('Zergling').getComponent(SkeletalAnimation)
                                // old.initClipName = 'Take 001'
                            }else if(newNode.name == '刺蛇'){
                                old.skeletalAnimation = newNode.getChildByName('Hydralisk').getComponent(SkeletalAnimation)
                                // old.initClipName = 'Take 001'
                            }else if(newNode.name == '工蜂'){
                                old.skeletalAnimation = newNode.getChildByName('Drone').getComponent(SkeletalAnimation)
                                // old.initClipName = 'Take 001'
                                // console.log('工蜂骨骼动画', old.skeletalAnimation)
                            }else if(newNode.name == '光子炮'){
                                old.skeletalAnimation = newNode.getChildByName('平常状态').getComponent(Animation)
                                old.initClipName = '平常状态'
                                // console.log('光子炮骨骼动画', old.skeletalAnimation)
                            }else if(newNode.name == '兵厂'){
                                old.skeletalAnimation = newNode.getChildByName('barracks').getComponent(Animation)
                                // old.initClipName = '平常状态'
                                // console.log('兵厂骨骼动画', old.skeletalAnimation)
                            }else if(newNode.name == '孵化场'){
                                old.skeletalAnimation = newNode.getChildByName('hatchery_skin').getComponent(SkeletalAnimation)
                                // old.initClipName = '平常状态'
                                // console.log('孵化场骨骼动画', old.skeletalAnimation)
                            }else if(newNode.name == '近战兵'){
                                old.skeletalAnimation = newNode.getChildByName('Idle').getComponent(SkeletalAnimation)
                                // old.initClipName = '平常状态'
                                // console.log('近战兵骨骼动画', old.skeletalAnimation)
                            }else if(newNode.name == '地堡'){
                                old.skeletalAnimation = newNode.getChildByName('地堡872面').getComponent(Animation)
                                // old.initClipName = '平常状态'
                                // console.log('近战兵骨骼动画', old.skeletalAnimation)
                            }
                            else if(newNode.name == '飞机'){
                                old.skeletalAnimation = newNode.getChildByName('p_plane_01').getComponent(SkeletalAnimation)
                                old.initClipName = 'flight_04'
                                // console.log('近战兵骨骼动画', old.skeletalAnimation)
                            }
                            else
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
                                let nodeRoleHp = utils.find("RoleHp", node所有单位头顶名字)
                                old.hpbar = instantiate(nodeRoleHp)
                                old.hpbar.active = true;
                                node所有单位头顶名字.addChild(old.hpbar)
                                
                                if(hpMax<=0)
                                    old.hpbar.active = false
                                else
                                    old.hpbar.getComponent(ProgressBar).progress = old.hp / old.hpMax;//todo等后端传最大血量 20测试用

                                let headScal = old.hpbar.getComponent(HeadScale)
                                headScal.target = utils.find("血条", newNode)
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
                            old.nickName = nickName + '(' + entityName + ')'
                            // old.labelName.string = old.nickName + '(' + id + ')hp=' + old.hp
                            old.labelName.string = old.nickName //+ ',hp=' + old.hp

                            if (old.position != undefined)
                                old.view.position = old.position

                            if(old.view.name == '黄光爆闪'){
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
                    let hp = arr[5]
                    // console.log(arr)

                    let old = thisLocal.scene战斗?.entities.get(id)
                    if(!old){
                        console.log('已离开战斗场景', id)
                        return
                    }
                    
                    // old.skeletalAnimation.play('run')
                    let posNew = new Vec3(posX, 0, posZ)
                    old.position = posNew
                    old.hp = hp
                    if(old.hpbar){
                        let progressBar = old.hpbar.getComponent(ProgressBar)
                        if(old.hpMax>0)
                            progressBar.progress = hp / old.hpMax//todo等后端传最大血量 20测试用
                        else
                            old.hpbar.active = false //资源没有血量
                    }
                    //console.log('hp', hp, old.hpMax)
                
                    if (old.view) {

                        if(!old.view.position || old.view.position.clone().subtract(old.position).lengthSqr() > 5)
                            old.view.position = old.position
                        else
                            {
                                old.tween移动?.stop()
                                old.tween移动 = tween(old.view).to(0.1, {position:old.position})
                                old.tween移动.start()
                            }

                        
                        old.view.eulerAngles = new Vec3(0, eulerAnglesY, 0)
                        // old.labelName.string = old.nickName + '(' + id + ')hp=' + hp
                        old.labelName.string = old.nickName// + 'hp=' + hp
                        // old.hpbar&&(old.hpbar.getComponent(ProgressBar).progress = old.hp / old.hpMax);//todo等后端传最大血量 20测试用
                    }
                }
                break
            case MsgId.ChangeSkeleAnim:
                {
                    let id = arr[idxArr++]
                    let loop: boolean = arr[idxArr++]
                    let clipName: string = arr[idxArr++]
                    // console.log(id, '动作改为', clipName)
                    if(!thisLocal.scene战斗){
                        // console.log(
                        return   
                    }
                    let old = thisLocal.scene战斗.entities.get(id)
                    if (old == undefined) {
                        // console.log(id,"还没加载好,没有播放动作",clipName)
                        return
                    }
                    if (old.skeletalAnimation == undefined){
                            old.initClipName = clipName
                    }else {
                        Main.播放动作(old, clipName, loop)
                        old.tween移动?.stop()
                        old.tween移动 = null
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
                    if(thisLocal.scene登录 && thisLocal.scene登录.lableMessage)
                        thisLocal.scene登录.lableMessage.string = content

                    if(!thisLocal.scene战斗 || !thisLocal.scene战斗.battleUI)
                        return

                    switch (channel) {
                        case SayChannel.系统:
                            if(content.length>0)
                                thisLocal.scene战斗.battleUI.lable系统消息.string = content
                            break
                        case SayChannel.聊天:
                            if(content.length>0)
                                thisLocal.scene战斗.battleUI.lable聊天消息.string = content
                            break
                        case SayChannel.任务提示:
                            if(content.length>0)
                                thisLocal.scene战斗.battleUI.lable任务提示.string = content
                            break
                    }

                }
                break
            case MsgId.DelRoleRet:
                {
                    let id = arr[idxArr++]
                    console.log('删除:', id)
                    if(!thisLocal.scene战斗)
                        return

                    let entity = thisLocal.scene战斗.entities.get(id);
                    // entity.hpbar?.destroy();
                    if (entity == undefined){
                        console.warn('无法删除',id)
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
                    if(str文本.length>0)
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
                    thisLocal.scene登录?.显示战局列表(arr玩家,'onClick进入别人的个人战局')
                }
                break
            case MsgId.玩家多人战局列表:
                {
                    let arr玩家 = arr[idxArr++] as string[][]
                    console.log(arr玩家)
                    thisLocal.scene登录.显示战局列表(arr玩家,'onClick进入别人的多人战局')
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
                    assetManager.loadRemote(strHttps, (err, clip:AudioClip) => {
                        console.log('resources.load callback:', err, clip)
                        let audioSource = this.scene登录 ? this.scene登录.audioSource : this.scene战斗.audioSource
                        audioSource.clip = clip
                        audioSource.play()
                    })
                }
                break
            default:
                console.error('msgId=', msgId)
                break
        }
    }
    onClickSay(str: string) {
        if(str.length==0)
            return
        
        const object = //item.hitPoint
            [
                [MsgId.Say, 0, 0],
                str
            ]
            
        console.log('send', object)
        const encoded = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.send(encoded)
        }
    }
    回到登录场景():void {
        if(this.scene战斗){
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
        const object = //item.hitPoint
            [
                [MsgId.离开Space, 0, 0],
            ]

        const encoded = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.send(encoded)
        }
    }
    send选中(arr选中: number[]) {
        const object =
            [
                [MsgId.SelectRoles, ++this.sendMsgSn, 0],
                arr选中//虽然是整数，但是也强制转成FLOAT64发出去了
            ]

        const encoded = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.send(encoded)
        }

        this.arr选中 = arr选中
    }
    onClick出地堡(){
        if(0 == this.arr选中.length){
            console.log('没选中任何单位')
            return
        }
        const object = 
        [
            [MsgId.出地堡, ++this.sendMsgSn, 0],
            this.arr选中[0]
        ]

        const encoded = msgpack.encode(object)
        console.log('send', encoded)
        this.send(encoded)
    }
    onClick空闲工程车() {
        const encoded = msgpack.encode([[MsgId.切换空闲工程车, ++this.sendMsgSn, 0]])
        console.log('send', encoded)
        this.send(encoded)
    }
    
    static 播放动作(old:ClientEntityComponent, strClipName:string, loop:boolean){
        // console.log('strClipName', strClipName, 'old.view.name', old.view.name, 'loop', loop)
        const str星2动作:string = 'Take 001'
        if(old.view.name == '跳虫')
        {
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if(strClipName == 'run'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:31.5, max:33.6}
            }else if(strClipName == 'idle'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:14.8, max:18.3}
            }else if(strClipName == 'attack'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:5.2, max:5.8} // 动画总长度
                state.time = 5.2
            }else if(strClipName == 'died'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:45.4, max:50.6} // 动画总长度
                state.time = 45.4
            }
        }
        else if(old.view.name == '工蜂')
        {
            console.log('工蜂播放动画', strClipName, str星2动作)
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if(strClipName == 'run'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:4.2, max:5.3}
                state.time = 4.2
            }else if(strClipName == 'idle'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:0, max:2}
                state.time = 0
            }else if(strClipName == 'attack'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:7.3, max:8.6} // 动画总长度
                state.time = 7.3
            }else if(strClipName == 'died'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:13.8, max:14.6} // 动画总长度
                state.time = 13.8
            }
        }
        else if(old.view.name == '刺蛇')
        {
            old.skeletalAnimation.play(str星2动作)
            let state = old.skeletalAnimation.getState(str星2动作)
            if(strClipName == 'run'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:0, max:1.8}
            }else if(strClipName == 'idle'){
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:14.8, max:18.3}
            }else if(strClipName == 'attack'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:8.7, max:9.7}
                state.time = 8.7
            }else if(strClipName == 'died'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:11.8, max:13.8} // 动画总长度
                state.time = 11.8
            }
        }
        else if(old.view.name == '兵厂')
        {
            old.skeletalAnimation.play()
            let state = old.skeletalAnimation.getState('barracksdeath')
            if(strClipName == 'idle'){
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = {min:0, max:0.4}
            }else if(strClipName == '兵厂损毁'){
                state.wrapMode =  AnimationClip.WrapMode.Normal
                state.playbackRange = {min:0.4, max:2} // 动画总长度
                state.time = 0.4
            }
        }    
        else if(old.view.name == '孵化场')
        {
            if(strClipName == 'idle'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[0])
                state.wrapMode = AnimationClip.WrapMode.Loop
            }else if(strClipName == '孵化场死亡'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[1])
                state.wrapMode =  AnimationClip.WrapMode.Normal
            }
            old.skeletalAnimation.play()
        }
        else if(old.view.name == '近战兵')
        {
            old.skeletalAnimation.play()
            if(strClipName == 'idle'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[0])
                state.wrapMode = AnimationClip.WrapMode.Loop
                old.skeletalAnimation.play()
            }else if(strClipName == 'died'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[3])
                state.wrapMode =  AnimationClip.WrapMode.Normal
                old.skeletalAnimation.play()
            }else if(strClipName == 'attack'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[2])
                state.wrapMode =  AnimationClip.WrapMode.Normal
                // state.playbackRange = {min:0.4, max:2} // 动画总长度
                state.speed = 4
                state.time = 0.5
                old.skeletalAnimation.play()
            }else if(strClipName == 'run'){
                let state = old.skeletalAnimation.createState(old.skeletalAnimation.clips[1])
                state.wrapMode =  AnimationClip.WrapMode.Loop
                state.speed = 0.8
                old.skeletalAnimation.play()
                // state.time = 0
                // old.skeletalAnimation.play('Take 001')
                // console.log(old.view.name, 'state', state, 'old.skeletalAnimation', old.skeletalAnimation)
            }
        }  
        else if(old.view.name == '飞机')
        {
            if(strClipName == 'idle' || strClipName == 'run'){
                old.skeletalAnimation.play('flight_04')
                let state = old.skeletalAnimation.getState('flight_04')
                state.wrapMode = AnimationClip.WrapMode.Loop
                state.playbackRange = {min:0, max:2}
                state.time = 0
            }else if(strClipName == 'attack'){
                old.skeletalAnimation.play('slide')
                let state = old.skeletalAnimation.getState('slide')
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = {min:0, max:1}
                state.time = 0
            }else if(strClipName == 'died'){
                old.skeletalAnimation.play('slide')
                let state = old.skeletalAnimation.getState('slide')
                state.wrapMode = AnimationClip.WrapMode.Normal
                state.playbackRange = {min:1, max:2}
                state.time = 0
                
                let pos地下 = old.skeletalAnimation.node.position.clone()
                pos地下.y = -10
                let  quat : Quat = new Quat();
                Quat.fromEuler(quat, 0, 180, 0);
                tween(old.skeletalAnimation.node).to(1, {rotation:quat,position:pos地下}).start()
            }
            // old.skeletalAnimation.play()
        }
        else
        {
            old.skeletalAnimation.play(strClipName)
            let state = old.skeletalAnimation.getState(strClipName)
            if(null == state){
                console.error(old.view.name, '缺动作:', strClipName)
            }

            state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
            if(old.view.name == '步兵')
            {
                if(strClipName == 'run')
                    state.playbackRange = {min:0, max:0.8}
                else if(strClipName == 'idle')
                    state.playbackRange = {min:0, max:2.0}
            }
        }
    }
    
    onClick剧情对话全屏点击() {
        const encoded = msgpack.encode([[MsgId.剧情对话已看完, ++this.sendMsgSn, 0]])
        console.log('send', encoded)
        this.send(encoded)
    }
}