import {Node,resources,Prefab,instantiate, _decorator, Component,EditBox,Button,Vec3,NodeEventType,EventMouse,geometry,PhysicsSystem,Camera  } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js";

const { ccclass, property } = _decorator;
class ClientEntityComponent extends Component{
    view :Node
}
@ccclass('UiLogin')
export class UiLogin extends Component {
    entities : { [key: number]: ClientEntityComponent; } ={};
    start() {
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            console.log('MOUSE_DOWN',event)
            var uiPos = event.getLocation();
            var ray = new geometry.Ray();
            // const camera = cc.find("Camera",this.node).getComponent(Camera);
            const camera = cc.find("Main Camera",this.node.parent).getComponent(Camera);
            camera.screenPointToRay(uiPos.x, uiPos.y, ray);
            if (PhysicsSystem.instance.raycast(ray)) {
                const raycastResults = PhysicsSystem.instance.raycastResults;
                for (let i = 0; i < raycastResults.length; i++) {
                    const item = raycastResults[i];
                    console.log('射线碰撞',i,item);
                    if (item.collider.node.name == "Plane") 
                    {
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
        const editNode = cc.find("Name",this.node) as Node;
        console.log(button); 
        console.log(editNode); 

        const editBox = editNode.getComponent(EditBox);
        console.log(editBox.string); 

        let websocket = new WebSocket("ws://192.168.31.138:12345/");

        websocket.binaryType = 'arraybuffer'
        console.log(websocket)
        var gameclient = this

          //连接发生错误的回调方法
          websocket.onerror = function () {
               console.log("WebSocket连接发生错误");
          };

           //连接成功建立的回调方法
           websocket.onopen = function () {
               console.log("WebSocket连接成功");
               const object = [
                editBox.string,
                'Hello, world!pwd',
               ];
              
              const encoded: Uint8Array = msgpack.encode(object);
              console.log(encoded);
              websocket.send(encoded);
           }

           let plane = this.node.parent.getChildByName("Plane");
           let entites = this.entities;
          //接收到消息的回调方法
           websocket.onmessage = function (event: MessageEvent) {
               let data = event.data as ArrayBuffer
               console.log("收到数据：", data, data.byteLength);
               const arr = msgpack.decode(new Uint8Array(data))
               let id = arr[0];
               let posX = arr[1];
               console.log(arr);

               let old = entites[id]
               if( old==undefined)
               {
                    entites[id]=new ClientEntityComponent();
                    resources.load("altman-blue", Prefab, (err, prefab) => 
                    {
                        console.log('resources.load callback:',err,prefab);
                        const newNode = instantiate(prefab);
                        plane.addChild(newNode);
                        newNode.position =new Vec3(posX,0,0);
                        console.log('resources.load newNode',newNode);
                        entites[id].view=newNode;
                    });
                }
                else
                {
                    if( old != undefined )
                        old.view.position=new Vec3(posX,0,0);
                }
          }

           //连接关闭的回调方法
           websocket.onclose = function (e) {
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            console.log(e)
          }

           //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
           window.onbeforeunload = function () {
               console.log("onbeforeunload");
           }
    }

}


