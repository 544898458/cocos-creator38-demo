import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, AssetManager, Asset, assetManager, Animation} from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from '../component/head-scale'
import { Scene战斗, ClientEntityComponent } from '../scene/Scene战斗'
import { Scene登录 } from '../scene/Scene登录'
import { AudioMgr } from '../manager/AudioMgr'
import { ProgressBar } from 'cc'
import { ParticleSystem } from 'cc'

const { ccclass, property } = _decorator
export enum MsgId {
    Invalid_0,
    Login,
    Move,
    AddRoleRet,
    NotifyPos,
    ChangeSkeleAnim,
    Say,
    SelectRoles,
    AddRole,
    DelRoleRet,
    ChangeMoney,
    ChangeMoneyResponce,
    AddBuilding,
    NotifyeMoney,
    Gate转发,
    GateAddSession,
    GateAddSessionResponce,
    GateDeleteSession,
    GateDeleteSessionResponce,
    采集,
    资源,
    进地堡,
    出地堡,
    进Space,
    进单人剧情副本,
    显示界面,
    离开Space,
    Entity描述,
    播放声音,
    设置视口,
    框选,
    玩家个人战局列表,
    进入别的玩家个人战局,
	创建多人战局,
}

enum 副本ID
{
	训练战,
	防守战,
	多人联机地图,
	四方对战,
};

enum 单位类型
{
	工程车,//空间工程车Space Construction Vehicle。可以采矿，采气，也可以简单攻击
	兵,//陆战队员Marine。只能攻击，不能采矿
	近战兵,//火蝠，喷火兵Firebat
	三色坦克,

	建筑Min非法,

	基地,//指挥中心(Command Center),用来造工程车()
	兵厂,//兵营(Barracks)，用来造兵
	民房,//供给站(Supply Depot)
	地堡,//掩体; 地堡(Bunker),可以进兵
	光子炮,//Photon Cannon

	建筑Max非法,

	特效,
	视口,

	晶体矿,//Minerals
	燃气矿,//Vespene Gas
};

// enum 点击地面操作类型
// {
//     移动单位,
//     放置建筑
// }

enum SayChannel {
    系统,
    语音提示,
};

@ccclass('UiLogin')
export class UiLogin extends Component {
    websocket: WebSocket
    // lableMessage: Label
    // lableMessage语音提示: Label
    @property({type: Asset})
    public wssCacert: Asset = null!;

    recvMsgSn: number = 0
    sendMsgSn: number = 0
    scene战斗: Scene战斗 = null
    scene登录: Scene登录 = null
    arr选中: number[] = []
    map玩家场景 = new Map<string, string>//NickName=>SceneName
    fun创建消息: (Vec3) => object = this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    createMsgMove强行走(hitPoint: Vec3) {
        return this.createMsgMove(hitPoint, false)
    }
    send(buf:Buffer){
        if (this.websocket == undefined) 
        {
            console.error('this.websocket is undefined')
            return
        }
            
        this.websocket.send(buf.buffer)
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
    onClick造坦克(event: Event, customEventData: string): void {
        const encoded = msgpack.encode([[MsgId.AddRole, 0, 0], 单位类型.三色坦克])
        // console.log(encoded)
        this.send(encoded)
    }
    onClickAdd兵(event: Event, customEventData: string): void {
        const encoded = msgpack.encode([[MsgId.AddRole, 0, 0], 单位类型.兵])
        // console.log(encoded)
        this.send(encoded)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        const encoded = msgpack.encode([[MsgId.AddRole, 0, 0], 单位类型.近战兵])
        // console.log(encoded)
        this.send(encoded)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        const encoded = msgpack.encode([[MsgId.AddRole, 0, 0], 单位类型.工程车])
        // console.log(encoded)
        this.send(encoded)
    }
    createMsg造建筑(hitPoint: Vec3, 类型: 单位类型) {
        console.log('createMsg造建筑', hitPoint)
        return [[MsgId.AddBuilding, ++this.sendMsgSn, 0], 类型, [hitPoint.x, hitPoint.z]]
    }
    on点击按钮_造建筑(类型: 单位类型) {
        this.fun创建消息 = (hitPoint: Vec3) => this.createMsg造建筑(hitPoint, 类型)
        this.scene战斗.lableMessage.string = '请点击地面放置建筑'
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
    进Scene战斗(sceneName: string, encoded: Buffer) {
        this.scene登录.nodeSelectSpace.active = false
        director.preloadScene(sceneName, (completedCount: number, totalCount: number, item: AssetManager.RequestItem) => {
            console.log(completedCount, totalCount, item)
            this.scene登录.lableMessage.string = completedCount + '/' + totalCount + '\n' + item.url
        }, () => {
            this.scene登录.uiLogin = null
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
    onClick创建四方对战() {
        this.进Scene战斗('scene四方对战', msgpack.encode([[MsgId.创建多人战局, 0, 0], 副本ID.四方对战]))
    }
    onClick获取别人的个人战局列表(event: Event, customEventData: string) {
        console.log(event,customEventData)
        this.sendArray([[MsgId.玩家个人战局列表, ++this.sendMsgSn, 0, 0]])
    }
    onClick进入别人的个人战局( Event, customEventData: string) {
        console.log(event,customEventData)
        this.进Scene战斗(this.map玩家场景.get(customEventData), msgpack.encode([[MsgId.进入别的玩家个人战局, ++this.sendMsgSn, 0, 0],customEventData]))
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
        this.websocket = new WebSocket("ws://192.168.31.170:12348/")
        // this.websocket = new WebSocket("ws://192.168.43.109:12348/")
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/")
        // this.websocket = new WebSocket("ws://192.168.0.100:12348/")
        // this.websocket = new WebSocket("ws://47.119.184.177:12348/")
        // this.websocket = new WebSocket("wss://wss.iotlabor.cn/")
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
            // console.log("收到数据：", data, data.byteLength)
            const arr = msgpack.decode(new Uint8Array(data))
            // console.log("msgpack.decode结果：", data, data.byteLength)
            let idxArr = 0
            let msgBase = arr[idxArr++]
            let msgId = msgBase[0] as MsgId
            let sn = msgBase[1] as number
            // console.log("msgId：",   msgId)
            ++thisLocal.recvMsgSn
            if(thisLocal.recvMsgSn != sn)
            console.error('recvMsgSn ', thisLocal.recvMsgSn , 'sn', sn)
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
                        console.log(id, nickName, prefabName, '进来了,hpMax', hpMax)
                        let old = thisLocal.scene战斗.entities.get(id)
                        if (old == undefined) {
                            old = new ClientEntityComponent()
                            old.hpMax = hpMax
                            old.prefabName = prefabName
                            thisLocal.scene战斗.entities.set(id, old)
                            if (thisLocal.scene战斗.battleUI.lableCount != undefined)
                                thisLocal.scene战斗.battleUI.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'

                            resources.load(prefabName, Prefab, (err, prefab) => {
                                // console.log('resources.load callback:', err, prefab)
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
                                else if(newNode.name =='工程车')
                                    old.skeletalAnimation = newNode.getChildByPath('scv/Geoset_0').getComponent(Animation)
                                else if(newNode.name == '三色坦克')
                                    old.skeletalAnimation = newNode.getChildByName('p_B_tank_03').getComponent(SkeletalAnimation)
                                else if(newNode.name == '跳虫'){
                                    old.skeletalAnimation = newNode.getChildByName('Zergling').getComponent(SkeletalAnimation)
                                    old.initClipName = 'Take 001'
                                }else if(newNode.name == '刺蛇'){
                                    old.skeletalAnimation = newNode.getChildByName('Hydralisk').getComponent(SkeletalAnimation)
                                    old.initClipName = 'Take 001'
                                }
                                else
                                    old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)

                                if (old.skeletalAnimation != undefined) {
                                    old.skeletalAnimation.play(old.initClipName)
                                }
                                let nodeCanvas = utils.find("Canvas", thisLocal.scene战斗.roles.parent)
                                let nodeRoleName = utils.find("RoleName", nodeCanvas)
                                // console.log('RoleName',this.nodeRoleName)
                                // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName

                                old.nodeName = instantiate(nodeRoleName)
                                nodeCanvas.addChild(old.nodeName)
                                if (newNode.name != "smoke") {
                                    let nodeRoleHp = utils.find("RoleHp", nodeCanvas)
                                    old.hpbar = instantiate(nodeRoleHp)
                                    old.hpbar.active = true;
                                    nodeCanvas.addChild(old.hpbar)
                                    
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
                                nodeCanvas.addChild(old.node描述)
                                old.label描述 = old.node描述.getComponent(Label)
                                {
                                    let headScal = old.node描述.getComponent(HeadScale)
                                    headScal.target = utils.find("描述", newNode)
                                    console.log(headScal.target)
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

                        let old = thisLocal.scene战斗.entities.get(id)
                        if (old == undefined) {
                            //    old = entites[id] = new ClientEntityComponent()
                            //    resources.load("altman-blue", Prefab, (err, prefab) => {
                            //        console.log('resources.load callback:', err, prefab)
                            //        const newNode = instantiate(prefab)
                            //        roles.addChild(newNode)
                            //        newNode.position = new Vec3(posX, 0, 0)
                            //        console.log('resources.load newNode', newNode)
                            //        old.view = newNode
                            //        old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)
                            //        old.skeletalAnimation.play(old.initClipName )
                            //    })
                        }
                        else {
                            if (old && old != undefined) {
                                // old.skeletalAnimation.play('run')
                                old.position = new Vec3(posX, 0, posZ)
                                old.hp = hp
                                if(old.hpbar){
                                    let progressBar = old.hpbar.getComponent(ProgressBar)
                                    if(old.hpMax>0)
                                        progressBar.progress = hp / old.hpMax//todo等后端传最大血量 20测试用
                                    else
                                        old.hpbar.active = false //资源没有血量
                                }
                                //console.log('hp', hp, old.hpMax)
                            }
                            if (old && old.view != undefined) {
                                old.view.position = old.position
                                old.view.eulerAngles = new Vec3(0, eulerAnglesY, 0)
                                // old.labelName.string = old.nickName + '(' + id + ')hp=' + hp
                                old.labelName.string = old.nickName// + 'hp=' + hp
                                // old.hpbar&&(old.hpbar.getComponent(ProgressBar).progress = old.hp / old.hpMax);//todo等后端传最大血量 20测试用

                            }
                        }
                    }
                    break
                case MsgId.ChangeSkeleAnim:
                    {
                        let id = arr[idxArr++]
                        let loop: Boolean = arr[idxArr++]
                        let clipName: string = arr[idxArr++]
                        // console.log(id, '动作改为', clipName)
                        let old = thisLocal.scene战斗.entities.get(id)
                        if (old == undefined) {
                            // console.log(id,"还没加载好,没有播放动作",clipName)
                            return
                        }
                        if (old.skeletalAnimation == undefined){
                            if( ! old.prefabName.endsWith('跳虫') && ! old.prefabName.endsWith('刺蛇'))
                                old.initClipName = clipName
                        }else {
                            // console.log( 'old.view.name', old.view.name)
                            if(old.view.name == '跳虫')
                            {
                                old.skeletalAnimation.play(old.initClipName)
                                let state = old.skeletalAnimation.getState(old.initClipName)
                                if(clipName == 'run'){
                                    state.wrapMode = AnimationClip.WrapMode.Loop
                                    state.playbackRange = {min:31.5, max:33.6}
                                }else if(clipName == 'idle'){
                                    state.wrapMode = AnimationClip.WrapMode.Loop
                                    state.playbackRange = {min:14.8, max:18.3}
                                }else if(clipName == 'attack'){
                                    state.wrapMode =  AnimationClip.WrapMode.Normal
                                    state.playbackRange = {min:5.2, max:5.8} // 动画总长度
                                    state.time = 5.2
                                }else if(clipName == 'died'){
                                    state.wrapMode =  AnimationClip.WrapMode.Normal
                                    state.playbackRange = {min:45.4, max:50.6} // 动画总长度
                                    state.time = 45.4
                                }
                            }
                            else if(old.view.name == '刺蛇')
                            {
                                old.skeletalAnimation.play(old.initClipName)
                                let state = old.skeletalAnimation.getState(old.initClipName)
                                if(clipName == 'run'){
                                    state.wrapMode = AnimationClip.WrapMode.Loop
                                    state.playbackRange = {min:0, max:1.8}
                                }else if(clipName == 'idle'){
                                    state.wrapMode = AnimationClip.WrapMode.Loop
                                    state.playbackRange = {min:14.8, max:18.3}
                                }else if(clipName == 'attack'){
                                    state.wrapMode =  AnimationClip.WrapMode.Normal
                                    state.playbackRange = {min:8.7, max:9.7}
                                    state.time = 8.7
                                }else if(clipName == 'died'){
                                    state.wrapMode =  AnimationClip.WrapMode.Normal
                                    state.playbackRange = {min:11.8, max:13.8} // 动画总长度
                                    state.time = 11.8
                                }
                            }
                            else
                            {
                                old.skeletalAnimation.play(clipName)
                                let state = old.skeletalAnimation.getState(clipName)
                                if(null == state)
                                    console.error(old.view.name, '缺动作:', clipName)

                                state.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
                                if(old.view.name == '步兵')
                                {
                                    if(clipName == 'run')
                                        state.playbackRange = {min:0, max:0.8}
                                    else if(clipName == 'idle')
                                        state.playbackRange = {min:0, max:2.0}
                                }
                            }
                        }
                    }
                    break
                case MsgId.Say:
                    {
                        let content = arr[idxArr++]
                        let channel = arr[idxArr++] as SayChannel
                        console.log(channel, '有人说:', content)
                        switch (channel) {
                            case SayChannel.系统:
                                thisLocal.scene战斗.lableMessage.string = content
                                break
                            case SayChannel.语音提示:
                                thisLocal.scene战斗.lableMessageVoice.string = content
                                break
                        }

                    }
                    break
                case MsgId.DelRoleRet:
                    {
                        let id = arr[idxArr++]
                        console.log('删除:', id)
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
                        thisLocal.scene战斗.battleUI.lableUnit.string = '我的活动单位:' + 活动单位 + '/' + 活动单位上限
                    }
                    break
                case MsgId.进Space:
                    {
                        thisLocal.scene战斗.battleUI.node.active = true
                        // director.loadScene('scene战斗')
                    }
                    break
                case MsgId.显示界面:
                    {
                        //thisLocal.scene战斗.quitGame.active = true
                    }
                    break
                case MsgId.离开Space:
                    {
                        thisLocal.scene战斗.entities.forEach((clientEntityComponent, k, map) => {
                            clientEntityComponent.removeFromParent()
                        })
                        thisLocal.scene战斗.entities.clear()
                        thisLocal.scene战斗.entityId.clear()
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
                        thisLocal.scene战斗.lableMessageVoice.string = str文本
                    }
                    break
                case MsgId.设置视口:
                    {
                        let arrPos视口 = arr[idxArr++] as number[]
                        console.log(arrPos视口)
                        thisLocal.scene战斗.mainCameraFollowTarget.对准此处(new Vec3(arrPos视口[0], 0, arrPos视口[1]))
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
                        thisLocal.scene登录.显示个人战局列表(arr玩家)
                    }
                    break
                default:
                    console.error('msgId=', msgId)
                    break
            }
        }

        //连接关闭的回调方法
        this.websocket.onclose = function (e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            console.log(e)
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.onbeforeunload = function () {
            console.log("onbeforeunload")
        }
    }
    onClickSay(str: string) {
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
    回到登录场景() {
        director.loadScene('scene登录', (err, scene) => {
            console.log('回到登录场景', this.scene登录.nodeSelectSpace.active)
            // director.runScene(scene);
            this.scene登录.nodeSelectSpace.active = true
            this.scene登录.nodeLoginPanel.active = false
        })
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
}


