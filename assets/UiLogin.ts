import { _decorator, Component,EditBox } from 'cc';
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
        const button = node.getComponent(cc.Button);
        const editNode = cc.find("Canvas/Name",this.node) as Node;
        console.log(button); 
        console.log(editNode); 

        const editBox = editNode.getComponent(EditBox);
        console.log(editBox.string); 
    }

}


