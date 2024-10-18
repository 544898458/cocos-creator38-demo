import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from './head-scale'
import { FollowTarget } from './FollowTarget'

const { ccclass, property } = _decorator
class ClientEntityComponent {
    view: Node
    nodeName: Node
    labelName: Label
    skeletalAnimation: SkeletalAnimation
    initClipName: string = 'idle'
    nickName: string
    position: Vec3//刚进地图Load没结束无法设置node坐标，暂存
    hp: number = 0
}
enum MsgId {
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
}
enum 建筑类型
{
	基地,//造工人
	兵厂,//造兵
};

@ccclass('UiLogin')
export class UiLogin extends Component {
    entities: Map<number, ClientEntityComponent> = new Map<number, ClientEntityComponent>
    entityId = new Map<string, number>//uuid=>服务器ID
    websocket: WebSocket
    targetFlag: Node//走路走向的目标点
    lableMessage: Label
    lableCount: Label
    lableMoney: Label
    recvMsgSn: number = 0
    sendMsgSn: number = 0
    mainCamera: Camera
    mainCameraFollowTarget:FollowTarget
    start() {
        this.targetFlag = utils.find("Roles/TargetFlag", this.node.parent)
        this.lableMessage = utils.find("Canvas/Message", this.node.parent).getComponent(Label)
        this.lableCount = utils.find("Canvas/Count", this.node.parent).getComponent(Label)
        this.lableMoney = utils.find("Canvas/Money", this.node.parent).getComponent(Label)
        const nodeMainCamera = utils.find("Main Camera", this.node.parent);
        this.mainCamera = nodeMainCamera.getComponent(Camera);
        this.mainCameraFollowTarget = nodeMainCamera.getComponent(FollowTarget);
        let targetFlag = this.targetFlag
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            console.log('MOUSE_DOWN', event)
            var uiPos = event.getLocation()
            var ray = new geometry.Ray()
            // const camera = cc.find("Camera",this.node).getComponent(Camera)
            this.mainCamera.screenPointToRay(uiPos.x, uiPos.y, ray)
            if (!PhysicsSystem.instance.raycastClosest(ray)) {
                console.log('raycast does not hit the target node !')
                return false
            }

            const raycastResults = PhysicsSystem.instance.raycastClosestResult

            const item = raycastResults//[i]
            console.log('射线碰撞', item.collider.node.name, item.hitPoint)
            if (item.collider.node.name == "Plane") {
                targetFlag.position = item.hitPoint

                const object = //item.hitPoint
                    [
                        [MsgId.Move, 0],
                        item.hitPoint.x,
                        // item.hitPoint.y,
                        item.hitPoint.z
                    ]

                const encoded: Uint8Array = msgpack.encode(object)
                if (this.websocket != undefined) {
                    console.log('send', encoded)
                    this.websocket.send(encoded)
                }
            }
            else if (item.collider.node.name == "tree_large")//点击晶体矿
            {
                this.mainCameraFollowTarget.target = item.collider.node
                let id = this.entityId[item.collider.node.uuid]
                
                const object =
                    [
                        [MsgId.采集, ++this.sendMsgSn, 0],
                        id
                    ]

                const encoded: Uint8Array = msgpack.encode(object)
                if (this.websocket != undefined) {
                    console.log('send', encoded)
                    this.websocket.send(encoded)
                }
            }
            else// if (item.collider.node.name == "altman-blue")//|| item.collider.node.name == "altman-red") 
            {
                this.mainCameraFollowTarget.target = item.collider.node
                let id = this.entityId[item.collider.node.uuid]
                if (id == undefined) {
                    console.log('还没加载')
                    return
                }
                const object =
                    [
                        [MsgId.SelectRoles, ++this.sendMsgSn, 0],
                        [id]//虽然是整数，但是也强制转成FLOAT64发出去了
                    ]

                const encoded: Uint8Array = msgpack.encode(object)
                if (this.websocket != undefined) {
                    console.log('send', encoded)
                    this.websocket.send(encoded)
                }
                const prefabName = 'colorBar'
                this.entities.forEach((clientEntityComponent, k, map) => {
                    let nodEffect = clientEntityComponent.view.getChildByName(prefabName)
                    console.log('准备删除', nodEffect)
                    clientEntityComponent.view.removeChild(nodEffect)
                })
                resources.load(prefabName, Prefab, (err, prefab) => {
                    console.log('resources.load callback:', err, prefab)
                    const newNode = instantiate(prefab)
                    newNode.name = prefabName
                    this.entities.get(id).view.addChild(newNode)
                })
            }

            return false
        }, this)
    }

    update(deltaTime: number) {

    }
    onClickAddRole(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddRole, 0]])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddBuilding, 0],建筑类型.基地])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    
    onClickAdd兵厂(event: Event, customEventData: string): void {
        const encoded: Uint8Array = msgpack.encode([[MsgId.AddBuilding, 0],建筑类型.兵厂])
        // console.log(encoded)
        this.websocket.send(encoded)
    }
    onClickLogin(event: Event, customEventData: string) {
        // 这里 event 是一个 Touch Event 对象，你可以通过 event.target 取到事件的发送节点
        const node = event.target as Node
        const button = node.getComponent(Button)
        const editNode = utils.find("Name", this.node) as Node
        console.log(button)
        console.log(editNode)

        const editBox = editNode.getComponent(EditBox)
        console.log(editBox.string)

        this.websocket = new WebSocket("ws://192.168.31.196:12348/")
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/")

        this.websocket.binaryType = 'arraybuffer'
        console.log(this.websocket)
        var gameclient = this

        //连接发生错误的回调方法
        this.websocket.onerror = function () {
            console.log("WebSocket连接发生错误")
        }

        //连接成功建立的回调方法
        this.websocket.onopen = (event: Event) => {
            console.log("WebSocket连接成功")
            const object = [
                [MsgId.Login, ++gameclient.sendMsgSn, 0, 0],
                editBox.string,
                'Hello, world!pwd',
            ]

            const encoded: Uint8Array = msgpack.encode(object)
            console.log(encoded)
            this.websocket.send(encoded)
        }

        let roles = this.node.parent.getChildByName("Roles")
        let entities = this.entities
        let entityId = this.entityId
        let lableMessage = this.lableMessage
        let lableCount = this.lableCount
        let lableMoney = this.lableMoney
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
                        // console.log(id, nickName, prefabName, '进来了')
                        let old = entities.get(id)
                        if (old == undefined) {
                            old = new ClientEntityComponent()
                            entities.set(id, old)
                            lableCount.string = '共' + entities.size + '单位'
                            resources.load(prefabName, Prefab, (err, prefab) => {
                                // console.log('resources.load callback:', err, prefab)
                                const newNode = instantiate(prefab)
                                roles.addChild(newNode)
                                entityId[newNode.uuid] = id
                                //newNode.position = new Vec3(posX, 0, 0)
                                // console.log('resources.load newNode', newNode)
                                old.view = newNode
                                old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)
                                if (old.skeletalAnimation != undefined) {
                                    old.skeletalAnimation.play(old.initClipName)
                                }
                                let nodeCanvas = utils.find("Canvas", roles.parent)
                                let nodeRoleName = utils.find("RoleName", nodeCanvas)
                                // console.log('RoleName',this.nodeRoleName)
                                // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName

                                old.nodeName = instantiate(nodeRoleName)
                                nodeCanvas.addChild(old.nodeName)
                                old.labelName = old.nodeName.getComponent(Label)
                                let headScal = old.nodeName.getComponent(HeadScale)
                                headScal.target = utils.find("NamePos", newNode)
                                let camera3D = utils.find("Main Camera", roles.parent).getComponent(Camera)
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

                        let old = entities.get(id)
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
                        let old = entities.get(id)
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
                        console.log('有人说:', content)
                        lableMessage.string = content
                    }
                    break
                case MsgId.DelRoleRet:
                    {
                        let id = arr[idxArr++]
                        console.log('删除:', id)
                        let old = entities.get(id)
                        old.view?.removeFromParent()
                        old.nodeName?.removeFromParent()
                        entities.delete(id)
                        lableCount.string = '共' + entities.size + '单位'
                    }
                    break;
                case MsgId.NotifyeMoney:
                    {
                        let finalMoney = arr[idxArr++]
                        lableMoney.string = '晶体矿:' + finalMoney
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
}


