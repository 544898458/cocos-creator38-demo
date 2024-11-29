import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from './head-scale'
import { FollowTarget } from './FollowTarget'
import { UiLogin, MsgId } from './UiLogin'

const { ccclass, property } = _decorator
export class ClientEntityComponent {
    view: Node
    nodeName: Node
    node描述: Node
    labelName: Label
    label描述: Label
    skeletalAnimation: SkeletalAnimation
    initClipName: string = 'idle'
    nickName: string
    position: Vec3//刚进地图Load没结束无法设置node坐标，暂存
    hp: number = 0
    removeFromParent()
    {
        this.view?.removeFromParent()
        this.nodeName?.removeFromParent()
        this.node描述?.removeFromParent()
    }
}

@ccclass('Scene战斗')
export class Scene战斗 extends Component {
    entities: Map<number, ClientEntityComponent> = new Map<number, ClientEntityComponent>
    entityId = new Map<string, number>//uuid=>服务器ID
    targetFlag: Node//走路走向的目标点
    node战斗面板: Node
    node退出此场景: Node
    lableMessage: Label
    lableMessage语音提示: Label
    lableCount: Label
    lableMoney: Label
    lable燃气矿: Label
    lable我的单位: Label
    mainCamera: Camera
    roles: Node
    uiLogin: UiLogin
    mainCameraFollowTarget:FollowTarget
    protected onLoad(): void{
        console.log('Scene战斗.onLoad')
        //获取常驻节点
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.uiLogin.scene战斗 = this
    }
            
    start() {
        this.targetFlag = utils.find("Roles/TargetFlag", this.node.parent)
        this.lableMessage = utils.find("Canvas/Message", this.node.parent).getComponent(Label)
        this.lableMessage语音提示 = utils.find("Canvas/Message语音提示", this.node.parent).getComponent(Label)
        this.lableCount = utils.find("Canvas/Count", this.node.parent).getComponent(Label)
        this.lableMoney = utils.find("Canvas/Money", this.node.parent).getComponent(Label)
        this.lable燃气矿 = utils.find("Canvas/燃气矿", this.node.parent).getComponent(Label)
        this.lable我的单位 = utils.find("Canvas/我的单位", this.node.parent).getComponent(Label)
        const nodeMainCamera = utils.find("Main Camera", this.node.parent);
        this.node战斗面板 = utils.find("Canvas/FightPanel", this.node.parent);
        this.node退出此场景 = utils.find("Canvas/Button退出此场景", this.node.parent);
        this.mainCamera = nodeMainCamera.getComponent(Camera);
        this.mainCameraFollowTarget = nodeMainCamera.getComponent(FollowTarget);
        this.roles = this.node.parent.getChildByName("Roles")
        let targetFlag = this.targetFlag
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            console.log('MOUSE_DOWN', event)
            var uiPos = event.getLocation()
            let button = event.getButton()
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

                let object
                if(EventMouse.BUTTON_RIGHT == button)
                {
                    object = this.uiLogin.createMsgMove(item.hitPoint)
                }else{
                    object = this.uiLogin.fun创建消息(item.hitPoint)
                }

                const encoded: Uint8Array = msgpack.encode(object)
                if (this.uiLogin.websocket != undefined) {
                    console.log('send', encoded)
                    this.uiLogin.websocket.send(encoded)
                }
                
                this.uiLogin.fun创建消息 = this.uiLogin.createMsgMove
            }
            else
            {
                this.uiLogin.fun创建消息 = this.uiLogin.createMsgMove
            
                if (item.collider.node.name == "tree_large" || item.collider.node.name == "house_type03" )//点击晶体矿或者燃气矿
                {
                    this.mainCameraFollowTarget.target = item.collider.node
                    let id = this.entityId[item.collider.node.uuid]
                    
                    const object =
                        [
                            [MsgId.采集, ++this.uiLogin.sendMsgSn, 0],
                            id
                        ]

                    const encoded: Uint8Array = msgpack.encode(object)
                    if (this.uiLogin.websocket != undefined) {
                        console.log('send', encoded)
                        this.uiLogin.websocket.send(encoded)
                    }
                }
                else if (item.collider.node.name == "house_type17" )//点击地堡
                {
                    this.mainCameraFollowTarget.target = item.collider.node
                    let id = this.entityId[item.collider.node.uuid]
                    
                    const object = event.getButton() == EventMouse.BUTTON_LEFT ?
                        [
                            [MsgId.进地堡, ++this.uiLogin.sendMsgSn, 0],
                            id
                        ]
                        :
                        [
                            [MsgId.出地堡, ++this.uiLogin.sendMsgSn, 0],
                            id,
                            [0.0]
                        ]

                    const encoded: Uint8Array = msgpack.encode(object)
                    if (this.uiLogin.websocket != undefined) {
                        console.log('send', encoded)
                        this.uiLogin.websocket.send(encoded)
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
                            [MsgId.SelectRoles, ++this.uiLogin.sendMsgSn, 0],
                            [id]//虽然是整数，但是也强制转成FLOAT64发出去了
                        ]

                    const encoded: Uint8Array = msgpack.encode(object)
                    if (this.uiLogin.websocket != undefined) {
                        console.log('send', encoded)
                        this.uiLogin.websocket.send(encoded)
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
            }

            return false
        }, this)
    }

    update(deltaTime: number) {

    }
    onClickAdd兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵(event,customEventData)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd近战兵(event,customEventData)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd工程车(event,customEventData)
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd基地(event,customEventData)
    }
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd地堡(event,customEventData)
    }
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵厂(event,customEventData)
    }

    onClickAdd民房(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd民房(event,customEventData)
    }

    onClickSay(event: Event, customEventData: string) {
        this.uiLogin.onClickSay(event,customEventData)
    }
    onClick退出此场景(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.uiLogin.send离开Space()
    }
}


