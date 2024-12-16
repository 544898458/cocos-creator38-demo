import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, Animation } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { FollowTarget } from '../mode/FollowTarget'
import { UiLogin, MsgId } from '../mode/UiLogin'
import { Vec2 } from 'cc'
import { EventTouch } from 'cc'

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
    hpbar: Node;
    hp: number = 0
    hpMax: number = 0
    removeFromParent() {
        this.view?.removeFromParent()
        this.nodeName?.removeFromParent()
        this.node描述?.removeFromParent()
        this.hpbar?.removeFromParent()
    }
}

@ccclass('Scene战斗')
export class Scene战斗 extends Component {
    entities: Map<number, ClientEntityComponent> = new Map<number, ClientEntityComponent>
    entityId = new Map<string, number>//uuid=>服务器ID

    @property({ type: Node, displayName: "走向的目标点" })
    targetFlag: Node
    @property({ type: Node, displayName: "战斗面板" })
    public battleUI: Node
    @property({ type: Label, displayName: "消息提示" })
    lableMessage: Label
    @property({ type: Label, displayName: "语言提示" })
    lableMessageVoice: Label
    @property({ type: Label, displayName: "数量单位" })
    lableCount: Label
    @property({ type: Label, displayName: "晶体矿" })
    lableCrystal: Label
    @property({ type: Label, displayName: "燃气矿" })
    lableGas: Label
    @property({ type: Label, displayName: "活动单位" })
    lableUnit: Label
    @property({ type: Camera, displayName: "3D摄像" })
    mainCamera: Camera
    @property({ type: Node, displayName: "英雄" })
    roles: Node
    //ui登录
    uiLogin: UiLogin
    //摄像
    mainCameraFollowTarget: FollowTarget
    //鼠标点击世界坐标
    posWorldMouseDown: Vec3
    //选中特效
    prefabName选中特效 = 'Select'//这里不能用中文，原因不明

    protected onLoad(): void {
        console.log('Scene战斗.onLoad')

    }

    start() {
        //初始化
        //获取常驻节点
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.uiLogin.scene战斗 = this.node.getComponent(Scene战斗);
        this.mainCameraFollowTarget = this.mainCamera.getComponent(FollowTarget);


        //3D摄像机鼠标滑轮（放大缩小）
        this.node.on(NodeEventType.MOUSE_WHEEL, (event: EventMouse) => {
            var y = event.getScrollY()
            y /= 300
            // vec2Delta = vec2Delta.divide2f(10,10)
            // this.mainCamera.node.position = this.mainCamera.node.position.add3f(0, y, 0)
            this.mainCamera.fov = Math.max(this.mainCamera.fov - y, 5)
            //console.log('fov', this.mainCamera.fov);
        })
        //不知道有啥用
        // this.node.on(NodeEventType.MOUSE_UP, this.onMouseUp)
        this.node.on(NodeEventType.TOUCH_END, (event: TouchEvent) => {
            console.log('TOUCH_END', event)
            if (this.posWorldMouseDown == undefined)
                return

            this.onMouseUp()
        })
        //视角移动
        this.node.on(NodeEventType.MOUSE_MOVE, (event: EventMouse) => {
            this.onMove(event.getDelta())
        })
        this.node.on(NodeEventType.TOUCH_MOVE, (event: EventTouch) => {
            if (this.posWorldMouseDown == undefined)
                return

            this.onMove(event.getDelta())
        })
        //
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            let button = event.getButton()
            let posMouseDown = event.getLocation()
            if (button == EventMouse.BUTTON_RIGHT) {
                this.onMouseDown(posMouseDown, true)
                return true
            }
            return false
        })
        this.node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {

            this.onMouseDown(event.getLocation(), false)
        })
    }
    onMouseUp() {
        this.posWorldMouseDown = undefined
    }
    //视角移动
    onMove(vec2Delta: Vec2) {
        // console.log('鼠标移动了', event.getButton());
        // if(event.getButton() != EventMouse.BUTTON_MIDDLE)
        //     return


        if (this.posWorldMouseDown) {
            // var vec2Delta = event.getDelta()
            var div = this.mainCamera.fov / 400;
            vec2Delta = vec2Delta.multiply2f(div, div)
            this.mainCamera.node.position = this.mainCamera.node.position.add3f(-vec2Delta.x, 0, vec2Delta.y)
        }
    }
    //点击处理
    onMouseDown(posMouseDown: Vec2, b鼠标右键: boolean) {
        console.log('MOUSE_DOWN', posMouseDown)


        var ray = new geometry.Ray()
        // const camera = cc.find("Camera",this.node).getComponent(Camera)
        this.mainCamera.screenPointToRay(posMouseDown.x, posMouseDown.y, ray)
        if (!PhysicsSystem.instance.raycastClosest(ray)) {
            console.log('raycast does not hit the target node !')
            return false
        }

        const raycastResults = PhysicsSystem.instance.raycastClosestResult

        const item = raycastResults//[i]
        this.posWorldMouseDown = undefined
        console.log('射线碰撞', item.collider.node.name, item.hitPoint)
        if (item.collider.node.name == "Plane") {
            this.posWorldMouseDown = item.hitPoint
            if (0 == this.uiLogin.arr选中.length)
                return

            this.targetFlag.position = item.hitPoint
            let ani = this.targetFlag.getChildByName('lightQ').getComponent(Animation)
            ani.play('lightQ')

            let object
            if (b鼠标右键) {
                object = this.uiLogin.createMsgMove强行走(item.hitPoint)
            } else {
                object = this.uiLogin.fun创建消息(item.hitPoint)
            }

            const encoded: Uint8Array = msgpack.encode(object)
            if (this.uiLogin.websocket != undefined) {
                console.log('send', encoded)
                this.uiLogin.websocket.send(encoded)
            }

            this.uiLogin.fun创建消息 = this.uiLogin.createMsgMove遇敌自动攻击
        }
        else {
            this.uiLogin.fun创建消息 = this.uiLogin.createMsgMove遇敌自动攻击

            if (item.collider.node.name == "tree_large" || item.collider.node.name == "house_type03")//点击晶体矿或者燃气矿
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
            else if (item.collider.node.name == "house_type17")//点击地堡
            {
                this.mainCameraFollowTarget.target = item.collider.node
                let id = this.entityId[item.collider.node.uuid]

                const object = b鼠标右键 ?
                    [
                        [MsgId.出地堡, ++this.uiLogin.sendMsgSn, 0],
                        id
                    ]
                    :
                    [
                        [MsgId.进地堡, ++this.uiLogin.sendMsgSn, 0],
                        id,
                        [0.0]
                    ]

                const encoded: Uint8Array = msgpack.encode(object)
                if (this.uiLogin.websocket != undefined) {
                    console.log('send', encoded)
                    this.uiLogin.websocket.send(encoded)
                }
            }
            else if (item.collider.node.name == "altman-blue"
                || item.collider.node.name == "altman-yellow"
                || item.collider.node.name == "axe-yellow"
                || item.collider.node.name == "house_type06"
                || item.collider.node.name == "house_type17"
                || item.collider.node.name == "house_type19"
                || item.collider.node.name == "house_type21"
            ) {
                this.mainCameraFollowTarget.target = item.collider.node
                let id = this.entityId[item.collider.node.uuid]
                if (id == undefined) {
                    console.log('还没加载')
                    return
                }

                this.clear选中()
                this.uiLogin.send选中([id])


                this.entities.forEach((clientEntityComponent, k, map) => {
                    let nodEffect = clientEntityComponent.view.getChildByName(this.prefabName选中特效)
                    console.log('准备删除', nodEffect)
                    clientEntityComponent.view.removeChild(nodEffect)
                })
                resources.load(this.prefabName选中特效, Prefab, (err, prefab) => {
                    console.log('resources.load callback:', err, prefab)
                    const newNode = instantiate(prefab)
                    newNode.name = this.prefabName选中特效
                    this.entities.get(id).view.addChild(newNode)
                    let ani = newNode.getChildByName('lightQ').getComponent(Animation)
                    const [clip] = ani.clips;
                    ani.getState(clip.name).repeatCount = Infinity
                })
            }
        }
    }
    update(deltaTime: number) {

    }


    onClickSay(event: Event, customEventData: string) {
        this.uiLogin.onClickSay(event, customEventData)
    }


    clear选中() {
        for (let id of this.uiLogin.arr选中) {
            let entity = this.entities.get(id)
            if (entity) {
                let node选中特效 = entity.view.getChildByName(this.prefabName选中特效)
                if (node选中特效)
                    node选中特效.removeFromParent()
            }
        }
    }
}


