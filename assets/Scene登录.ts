import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { HeadScale } from './head-scale'
import { FollowTarget } from './FollowTarget'
import { Scene战斗, ClientEntityComponent } from './Scene战斗'
import { UiLogin, MsgId } from './UiLogin'

const { ccclass, property } = _decorator

@ccclass('Scene登录')
export class Scene登录 extends Component {
    nodeLoginPanel: Node
    nodeSelectSpace: Node
    uiLogin: UiLogin
    onLoad() 
    {
        console.log('onLoad')
        this.nodeSelectSpace = utils.find("Canvas/选择玩法", this.node.parent);
        this.nodeLoginPanel = utils.find("Canvas/LoginPanel", this.node.parent);

        //获取常驻节点
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.uiLogin.scene登录 = this
    }
    start() {
        console.log('start')
    }

    update(deltaTime: number) {

    }
    onClickToggle进Space1(event: Event, customEventData: string) {
        this.uiLogin.进Scene战斗(msgpack.encode([[MsgId.进Space, 0, 0]]))
    }
    onClickToggle进单人剧情副本(event: Event, customEventData: string) {
        this.uiLogin.onClickToggle进训练战()
    }
    onClickToggle进单人防守战(event: Event, customEventData: string) {
        this.uiLogin.onClickToggle进防守战()
    }

    onClickLogin(event: Event, customEventData: string) {
       this.uiLogin.onClickLogin(event,customEventData)
    }
}


