import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopView')
export class PopView extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
    close(event: Event, customEventData: string):void{
        this.node.active=false;
    }
}


