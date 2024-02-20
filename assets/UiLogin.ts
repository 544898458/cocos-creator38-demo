import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js";

const { ccclass, property } = _decorator;
class ClientEntityComponent extends Component {
    view: Node
}
enum MsgId {
    Login,
    Move,
    LoginRet,
    NotifyPos,
};

@ccclass('UiLogin')
export class UiLogin extends Component {
    entities: { [key: number]: ClientEntityComponent; } = {};
    websocket: WebSocket
    start() {
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            console.log('MOUSE_DOWN', event)
            var uiPos = event.getLocation();
            var ray = new geometry.Ray();
            // const camera = cc.find("Camera",this.node).getComponent(Camera);
            const camera = cc.find("Main Camera", this.node.parent).getComponent(Camera);
            camera.screenPointToRay(uiPos.x, uiPos.y, ray);
            if (PhysicsSystem.instance.raycast(ray)) {
                const raycastResults = PhysicsSystem.instance.raycastResults;
                for (let i = 0; i < raycastResults.length; i++) {
                    const item = raycastResults[i];
                    console.log('射线碰撞', i, item.collider.node.name, item.hitPoint);
                    if (item.collider.node.name == "Plane") {
                        const object = //item.hitPoint;
                            [
                                MsgId.Move,
                                item.hitPoint.x,
                                item.hitPoint.y,
                                item.hitPoint.z
                            ];

                        const encoded: Uint8Array = msgpack.encode(object);
                        if (this.websocket != undefined) {
                            console.log(encoded);
                            this.websocket.send(encoded);
                        }
                    }
                }
            } else {
                console.log('raycast does not hit the target node !');
            }
        }, this);
    }

    update(deltaTime: number) {

    }

    onClickLogin(event: Event, customEventData: string) {
        // 这里 event 是一个 Touch Event 对象，你可以通过 event.target 取到事件的发送节点
        const node = event.target as Node;
        const button = node.getComponent(Button);
        const editNode = cc.find("Name", this.node) as Node;
        console.log(button);
        console.log(editNode);

        const editBox = editNode.getComponent(EditBox);
        console.log(editBox.string);

        //this.websocket = new WebSocket("ws://192.168.31.138:12345/");
        this.websocket = new WebSocket("ws://10.0.35.76:12345/");

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
        //接收到消息的回调方法
        this.websocket.onmessage = function (event: MessageEvent) {
            let data = event.data as ArrayBuffer
            console.log("收到数据：", data, data.byteLength)
            const arr = msgpack.decode(new Uint8Array(data))
            console.log("msgpack.decode结果：", data, data.byteLength)
            let msgId = arr[0] as MsgId
            switch (msgId)
            {
                case MsgId.LoginRet:
                    console.log('登录成功');
                    break;
                case MsgId.NotifyPos:
                    let id = arr[1]
                    let posX = arr[2]
                    let posZ = arr[3]
                    console.log(arr)

                    let old = entites[id]
                    if (old == undefined) {
                        entites[id] = new ClientEntityComponent();
                        resources.load("altman-blue", Prefab, (err, prefab) => {
                            console.log('resources.load callback:', err, prefab);
                            const newNode = instantiate(prefab);
                            roles.addChild(newNode);
                            newNode.position = new Vec3(posX, 0, 0);
                            console.log('resources.load newNode', newNode);
                            entites[id].view = newNode;
                        });
                    }
                    else {
                        if (old != undefined && old.view != undefined)
                            old.view.position = new Vec3(posX, 0, posZ);
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

}


