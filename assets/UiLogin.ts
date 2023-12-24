import { _decorator, Component,EditBox,Button } from 'cc';
import msgpack from "msgpack-lite/dist/msgpack.min.js";

const { ccclass, property } = _decorator;

@ccclass('UiLogin')
export class UiLogin extends Component {
    start() {

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

        let websocket = new WebSocket("ws://127.0.0.1:12345/");

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
              websocket.send(encoded);
           }

          //接收到消息的回调方法
           websocket.onmessage = function (event) {
               var data = event.data
               console.log("收到数据：", typeof(data), data.length);
               gameclient.onRecvData(data)
          }

           //连接关闭的回调方法
           websocket.onclose = function () {
              console.log("WebSocket连接关闭");
           }

           //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
           window.onbeforeunload = function () {
               console.log("onbeforeunload");
           }
    }

}


