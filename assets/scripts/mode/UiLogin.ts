import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, AssetManager } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from '../../head-scale'
import { Scene战斗, ClientEntityComponent } from '../scene/Scene战斗'
import { Scene登录 } from '../scene/Scene登录'
import { AudioMgr } from '../manager/AudioMgr'

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
}

enum 单人剧情副本ID
{
    训练战,
    防守战
}

enum 建筑单位类型
{
	基地,//指挥中心(Command Center),用来造工程车()
	兵厂,//兵营Barracks，用来造兵
	民房,//供给站(Supply Depot)
    地堡,//掩体; 地堡(Bunker),可以进兵
};

enum 活动单位类型
{
	工程车,//空间工程车Space Construction Vehicle。可以采矿，采气，也可以简单攻击
	兵,//陆战队员Marine。只能攻击，不能采矿
	近战兵,//火蝠，喷火兵Firebat
};

// enum 点击地面操作类型
// {
//     移动单位,
//     放置建筑
// }

enum SayChannel
{
	系统,
	语音提示,
};

@ccclass('UiLogin')
export class UiLogin extends Component {
    websocket: WebSocket
    // lableMessage: Label
    // lableMessage语音提示: Label
    recvMsgSn: number = 0
    sendMsgSn: number = 0
    scene战斗: Scene战斗 = null
    scene登录: Scene登录 = null
    arr选中: number[] = []
    fun创建消息:(Vec3)=>object = this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    createMsgMove强行走(hitPoint:Vec3){
        return this.createMsgMove(hitPoint,false)
    }
    createMsgMove遇敌自动攻击(hitPoint:Vec3){
        return this.createMsgMove(hitPoint,true)
    }
    createMsgMove(hitPoint:Vec3,b遇敌自动攻击:boolean)
    {
        return [[MsgId.Move, 0],
                [hitPoint.x,hitPoint.z],
                b遇敌自动攻击
            ]
    }
    onLoad() 
    {
        console.log('onLoad')
        //添加dataNode为常驻节点
       director.addPersistRootNode(this.node);
    }
    start() {
        console.log('start')
    }

    update(deltaTime: number) {

    }
    onClickAdd兵(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddRole, 0, 0],活动单位类型.兵])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddRole, 0, 0],活动单位类型.近战兵])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddRole, 0, 0],活动单位类型.工程车])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    createMsg造建筑(hitPoint:Vec3,类型:建筑单位类型)
    {
        console.log('createMsg造建筑', hitPoint)
        return[[MsgId.AddBuilding, ++this.sendMsgSn, 0],类型,[hitPoint.x, hitPoint.z]]
    }
    on点击按钮_造建筑(类型:建筑单位类型)
    {
        this.fun创建消息 = (hitPoint:Vec3)=>this.createMsg造建筑(hitPoint,类型)
        this.scene战斗.lableMessage.string = '请点击地面放置建筑'
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(建筑单位类型.基地)
    }
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(建筑单位类型.地堡)
    }
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(建筑单位类型.兵厂)
    }

    onClickAdd民房(event: Event, customEventData: string): void {
        this.on点击按钮_造建筑(建筑单位类型.民房)
    }
    进Scene战斗(sceneName:string, encoded: Uint8Array){
        this.scene登录.nodeSelectSpace.active = false
        director.preloadScene(sceneName, (completedCount: number, totalCount: number, item: AssetManager.RequestItem )=>{
            console.log(completedCount, totalCount, item)
            this.scene登录.lableMessage.string = completedCount + '/' + totalCount + ',' + item.url
        },()=>{
            this.scene登录.uiLogin = null
            this.scene登录 = null
            director.loadScene(sceneName, (err,scene)=>
            {
                // this.nodeSelectSpace.active = false
                
                this.websocket.send(encoded)
            })
        })
    }
    进Scene战斗单人剧情副本(sceneName:string,id:单人剧情副本ID){
        this.进Scene战斗(sceneName, msgpack.encode([[MsgId.进单人剧情副本, 0, 0], id]))
    }
    onClickToggle进训练战() {
        this.进Scene战斗单人剧情副本('scene战斗', 单人剧情副本ID.训练战)
    }
    onClickToggle进防守战() {
        this.进Scene战斗单人剧情副本('scene防守战',单人剧情副本ID.防守战)
    }
    onClickLogin(event: Event, customEventData: string) {
        const node = event.target as Node
        const button = node.getComponent(Button)
        const editNode = utils.find("Name", this.scene登录.nodeLoginPanel) as Node
        console.log(button)
        console.log(editNode)

        const editBox = editNode.getComponent(EditBox)
        console.log(editBox.string)
        if(editBox.string.length == 0)
        {
            this.scene登录.lableMessage.string = '请输入账号名字（随便什么都可以）'
            return
        }

        this.scene登录.nodeLoginPanel.active = false//隐藏
                
        // this.websocket = new WebSocket("ws://192.168.31.194:12348/")
        // this.websocket = new WebSocket("ws://192.168.31.170:12348/")
        // this.websocket = new WebSocket("ws://192.168.43.109:12348/")
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/")
        // this.websocket = new WebSocket("ws://192.168.0.100:12348/")
        this.websocket = new WebSocket("ws://47.119.184.177:12348/")

        this.websocket.binaryType = 'arraybuffer'
        console.log(this.websocket)
        
        //连接发生错误的回调方法
        this.websocket.onerror = () => {
            this.scene登录.lableMessage.string = "连接错误"
        }

        //连接成功建立的回调方法
        this.websocket.onopen = (event: Event) => {
            this.scene登录.lableMessage.string = "连接成功"
            const object = [
                [MsgId.Login, ++this.sendMsgSn, 0, 0],
                editBox.string,
                'Hello, world!pwd',
            ]

            const encoded: Uint8Array = msgpack.encode(object)
            console.log(encoded)
            this.websocket.send(encoded)

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
            console.assert(thisLocal.recvMsgSn == sn)
            // console.log("sn", sn)
            switch (msgId) {
                case MsgId.AddRoleRet:
                    {
                        // console.log('登录成功')
                        let id: number = arr[idxArr++]
                        let nickName: string = arr[idxArr++]
                        let entityName: string = arr[idxArr++]
                        let prefabName: string = arr[idxArr++]
                        console.log(id, nickName, prefabName, '进来了')
                        let old = thisLocal.scene战斗.entities.get(id)
                        if (old == undefined) {
                            old = new ClientEntityComponent()
                            thisLocal.scene战斗.entities.set(id, old)
                            if(thisLocal.scene战斗.lableCount!=undefined)
                                thisLocal.scene战斗.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'

                            resources.load(prefabName, Prefab, (err, prefab) => {
                                // console.log('resources.load callback:', err, prefab)
                                const newNode = instantiate(prefab)
                                thisLocal.scene战斗.roles.addChild(newNode)
                                thisLocal.scene战斗.entityId[newNode.uuid] = id
                                //newNode.position = new Vec3(posX, 0, 0)
                                // console.log('resources.load newNode', newNode)
                                old.view = newNode
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
                                old.nickName = nickName  + '(' + entityName + ')'
                                // old.labelName.string = old.nickName + '(' + id + ')hp=' + old.hp
                                old.labelName.string = old.nickName + ',hp=' + old.hp
                                
                                if (old.position != undefined)
                                    old.view.position = old.position
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
                            if (old != undefined) {
                                // old.skeletalAnimation.play('run')
                                old.position = new Vec3(posX, 0, posZ)
                                old.hp = hp
                                //console.log('angle',old.view.angle)
                            }
                            if (old.view != undefined) {
                                old.view.position = old.position
                                old.view.eulerAngles = new Vec3(0, eulerAnglesY, 0)
                                // old.labelName.string = old.nickName + '(' + id + ')hp=' + hp
                                old.labelName.string = old.nickName + 'hp=' + hp
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
                        if (old.skeletalAnimation == undefined)
                            old.initClipName = clipName
                        else {

                            old.skeletalAnimation.play(clipName)
                            old.skeletalAnimation.getState(clipName).wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal
                        }
                    }
                    break
                case MsgId.Say:
                    {
                        let content = arr[idxArr++]
                        let channel = arr[idxArr++] as SayChannel
                        console.log(channel, '有人说:', content)
                        switch(channel)
                        {
                            case SayChannel.系统:
                                thisLocal.scene战斗.lableMessage.string = content
                            break
                            case SayChannel.语音提示:
                                thisLocal.scene战斗.lableMessage语音提示.string = content
                            break
                        }
                        
                    }
                    break
                case MsgId.DelRoleRet:
                    {
                        let id = arr[idxArr++]
                        console.log('删除:', id)
                        let entity = thisLocal.scene战斗.entities.get(id)
                        if(entity == undefined)
                            return

                        entity.removeFromParent()
                        thisLocal.scene战斗.entities.delete(id)
                        if(thisLocal.scene战斗.lableCount!=undefined)
                            thisLocal.scene战斗.lableCount.string = '共' + thisLocal.scene战斗.entities.size + '单位'
                    }
                    break
                case MsgId.NotifyeMoney:
                    {
                        let finalMoney = arr[idxArr++]
                        thisLocal.scene战斗.lableMoney.string = '晶体矿:' + finalMoney
                    }
                    break
                case MsgId.资源:
                    {
                        let 燃气矿 = arr[idxArr++]
                        let 活动单位 = arr[idxArr++]
                        let 活动单位上限 = arr[idxArr++]
                        thisLocal.scene战斗.lable燃气矿.string = '燃气矿:' + 燃气矿
                        thisLocal.scene战斗.lable我的单位.string = '我的活动单位:' + 活动单位 + '/' + 活动单位上限
                    }
                    break
                case MsgId.进Space:
                    {
                        thisLocal.scene战斗.node战斗面板.active = true
                        // director.loadScene('scene战斗')
                    }
                    break
                case MsgId.显示界面:
                    {
                        thisLocal.scene战斗.node退出此场景.active = true
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
                        if(entity.label描述 != undefined)
                        {
                            entity.label描述.string = desc
                        }
                        
                    }
                    break
                case MsgId.播放声音:
                    {
                        let str声音 = arr[idxArr++]
                        let str文本 = arr[idxArr++]
                        AudioMgr.inst.playOneShot(str声音)
                        thisLocal.scene战斗.lableMessage语音提示.string = str文本
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
    onClickSay(event: Event, customEventData: string) {
        const node = event.target as Node
        const button = node.getComponent(Button)
        const editNode = utils.find("Name", this.node) as Node
        console.log(button)
        console.log(editNode)

        const editBox = editNode.getComponent(EditBox)
        console.log(editBox.string)
        const object = //item.hitPoint
            [
                [MsgId.Say, 0, 0],
                editBox.string
            ]

        const encoded: Uint8Array = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.websocket.send(encoded)
        }
    }
    回到登录场景(){
        director.loadScene('scene登录',(err, scene)=>{
            console.log('回到登录场景', this.scene登录.nodeSelectSpace.active)
            // director.runScene(scene);
            this.scene登录.nodeSelectSpace.active = true
            this.scene登录.nodeLoginPanel.active = false
        })
    }
    send离开Space(){
        const object = //item.hitPoint
        [
            [MsgId.离开Space, 0, 0],
        ]

        const encoded: Uint8Array = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.websocket.send(encoded)
        }        
    }
    send选中(arr选中:number[]){
        const object =
        [
            [MsgId.SelectRoles, ++this.sendMsgSn, 0],
            arr选中//虽然是整数，但是也强制转成FLOAT64发出去了
        ]
    
        const encoded: Uint8Array = msgpack.encode(object)
        if (this.websocket != undefined) {
            console.log('send', encoded)
            this.websocket.send(encoded)
        }

        this.arr选中 = arr选中     
    }
}


