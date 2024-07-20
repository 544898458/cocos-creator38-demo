import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js";
import { HeadScale } from './head-scale';

const { ccclass, property } = _decorator;
class ClientEntityComponent{
    view: Node
    nodeName:Node
    labelName:Label
    skeletalAnimation: SkeletalAnimation 
    initClipName: string = 'idle'
}
enum MsgId {
    Invalid_0,
    Login,
    Move,
    LoginRet,
    NotifyPos,
    ChangeSkeleAnim,
    Say,
};

@ccclass('UiLogin')
export class UiLogin extends Component {
    entities: { [key: number]: ClientEntityComponent; } = {};
    websocket: WebSocket
    targetFlag: Node//走路走向的目标点
    lableMessage: Label
    start() {
        this.targetFlag = utils.find("Roles/TargetFlag", this.node.parent);
        this.lableMessage = utils.find("Canvas/Message", this.node.parent).getComponent(Label);
        let targetFlag = this.targetFlag;
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            console.log('MOUSE_DOWN', event)
            var uiPos = event.getLocation();
            var ray = new geometry.Ray();
            // const camera = cc.find("Camera",this.node).getComponent(Camera);
            const camera = utils.find("Main Camera", this.node.parent).getComponent(Camera);
            camera.screenPointToRay(uiPos.x, uiPos.y, ray);
            if (PhysicsSystem.instance.raycastClosest(ray)) {
                const raycastResults = PhysicsSystem.instance.raycastClosestResult;
                // for (let i = 0; i < raycastResults.length; i++) 
                {
                    const item = raycastResults//[i];
                    console.log('射线碰撞', item.collider.node.name, item.hitPoint);
                    targetFlag.position=item.hitPoint;
                    if (item.collider.node.name == "Plane") {
                        const object = //item.hitPoint;
                            [
                                MsgId.Move,
                                item.hitPoint.x,
                                // item.hitPoint.y,
                                item.hitPoint.z
                            ];

                        const encoded: Uint8Array = msgpack.encode(object);
                        if (this.websocket != undefined) {
                            console.log('send',encoded);
                            this.websocket.send(encoded);
                        }
                    }
                }
            } else {
                console.log('raycast does not hit the target node !');
            }
            return false
        }, this);
    }

    update(deltaTime: number) {

    }

    onClickLogin(event: Event, customEventData: string) {
        // 这里 event 是一个 Touch Event 对象，你可以通过 event.target 取到事件的发送节点
        const node = event.target as Node;
        const button = node.getComponent(Button);
        const editNode = utils.find("Name", this.node) as Node;
        console.log(button);
        console.log(editNode);

        const editBox = editNode.getComponent(EditBox);
        console.log(editBox.string);

        this.websocket = new WebSocket("ws://192.168.31.194:12345/");
        // this.websocket = new WebSocket("ws://10.0.35.76:12345/");

        this.websocket.binaryType = 'arraybuffer'
        console.log(this.websocket)
        var gameclient = this

        //连接发生错误的回调方法
        this.websocket.onerror = function () {
            console.log("WebSocket连接发生错误");
        };

        //连接成功建立的回调方法
        this.websocket.onopen = (event: Event) => {
            console.log("WebSocket连接成功");
            const object = [
                MsgId.Login,
                editBox.string,
                'Hello, world!pwd',
            ];

            const encoded: Uint8Array = msgpack.encode(object);
            console.log(encoded);
            this.websocket.send(encoded);
        }

        let roles = this.node.parent.getChildByName("Roles");
        let entites = this.entities;
        let lableMessage = this.lableMessage
        //接收到消息的回调方法
        this.websocket.onmessage = function (event: MessageEvent) {
            let data = event.data as ArrayBuffer
            console.log("收到数据：", data, data.byteLength)
            const arr = msgpack.decode(new Uint8Array(data))
            console.log("msgpack.decode结果：", data, data.byteLength)
            let msgId = arr[0] as MsgId
            console.log("msgId：",   msgId)
            switch (msgId)
            {
                case MsgId.LoginRet:
                    {
                        console.log('登录成功');
                        let id:number = arr[1]
                        let nickName:string = arr[2]
                        console.log(id, nickName, '进来了');
                        let old = entites[id]
                        if (old == undefined) {
                            old = entites[id] = new ClientEntityComponent();
                            resources.load("altman-blue", Prefab, (err, prefab) => {
                                console.log('resources.load callback:', err, prefab);
                                const newNode = instantiate(prefab);
                                roles.addChild(newNode);
                                //newNode.position = new Vec3(posX, 0, 0);
                                console.log('resources.load newNode', newNode);
                                old.view = newNode;
                                old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)
                                old.skeletalAnimation.play(old.initClipName)
                                let nodeCanvas = utils.find("Canvas", roles.parent);
                                let nodeRoleName = utils.find("RoleName", nodeCanvas);
                                // console.log('RoleName',this.nodeRoleName);
                                // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName;

                                old.nodeName = instantiate(nodeRoleName);
                                nodeCanvas.addChild(old.nodeName)
                                old.labelName = old.nodeName.getComponent(Label);
                                let headScal = old.nodeName.getComponent(HeadScale)
                                headScal.target = utils.find("RootNode/NamePos",newNode);
                                let camera3D = utils.find("Main Camera", roles.parent).getComponent(Camera)
                                console.log('Main Camera',camera3D)
                                //  headScal.camera = camera3D
                                // headScal.distance = 55
                                old.labelName.string = nickName +'('+ id + ')'
                            });
                        }
                        else {
                            console.error('重复进入',id);
                        }
                    }
                    break;
                case MsgId.NotifyPos:
                    {
                        let id = arr[1]
                        let posX = arr[2]
                        let posZ = arr[3]
                        let eulerAnglesY = arr[4]
                        console.log(arr)

                        let old = entites[id]
                        if (old == undefined) {
                        //    old = entites[id] = new ClientEntityComponent();
                        //    resources.load("altman-blue", Prefab, (err, prefab) => {
                        //        console.log('resources.load callback:', err, prefab);
                        //        const newNode = instantiate(prefab);
                        //        roles.addChild(newNode);
                        //        newNode.position = new Vec3(posX, 0, 0);
                        //        console.log('resources.load newNode', newNode);
                        //        old.view = newNode;
                        //        old.skeletalAnimation = newNode.getComponent(SkeletalAnimation)
                        //        old.skeletalAnimation.play(old.initClipName )
                        //    });
                        }
                        else {
                            if (old != undefined && old.view != undefined){
                                // old.skeletalAnimation.play('run')
                                old.view.position = new Vec3(posX, 0, posZ)
                                old.view.eulerAngles = new Vec3(0,eulerAnglesY,0);
                                //console.log('angle',old.view.angle)
                            }
                        }
                    }
                    break;
                case MsgId.ChangeSkeleAnim:
                    {
                        let id = arr[1]
                        let clipName = arr[2]
                        console.log(id, '动作改为', clipName)
                        let old = entites[id]
                        if( old == undefined )
                        {
                            console.log(id,"还没加载好")
                            return
                        }
                        if( old.skeletalAnimation == undefined )
                            old.initClipName = clipName
                        else
                            old.skeletalAnimation.play(clipName)
                    }
                    break;
                case MsgId.Say:
                    {
                        let content = arr[1]
                        console.log('有人说:', content)
                        lableMessage.string = content
                    }
                    break;
            }
        }

        //连接关闭的回调方法
        this.websocket.onclose = function (e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            console.log(e)
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.onbeforeunload = function () {
            console.log("onbeforeunload");
        }
    }
    onClickSay(event: Event, customEventData: string) {
        const node = event.target as Node;
        const button = node.getComponent(Button);
        const editNode = utils.find("Name", this.node) as Node;
        console.log(button);
        console.log(editNode);

        const editBox = editNode.getComponent(EditBox);
        console.log(editBox.string);
        const object = //item.hitPoint;
        [
            MsgId.Say,
            editBox.string
        ];

        const encoded: Uint8Array = msgpack.encode(object);
        if (this.websocket != undefined) {
            console.log('send',encoded);
            this.websocket.send(encoded);
        }
    }
}


