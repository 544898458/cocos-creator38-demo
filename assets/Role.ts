import { _decorator, Component, Label, Node,Canvas, Camera, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Role')
export class Role extends Component {
    labelName:Node
    labelNameNoCanvas:Node
    camera3D:Camera
    nodeCanvas:Canvas
    uiTransformCanvas:UITransform
    start() {
        console.log(this.node);

        this.nodeCanvas = cc.find("Canvas", this.node);
        console.log(this.nodeCanvas);

        this.uiTransformCanvas = this.nodeCanvas.getComponent(UITransform);
        console.log(this.uiTransformCanvas);

        this.labelName = cc.find("Name", this.nodeCanvas);
        console.log(this.labelName);
        
        this.labelNameNoCanvas = cc.find("Name", this.node);
        console.log(this.labelNameNoCanvas);

        this.camera3D = cc.find("Main Camera", this.node.parent.parent).getComponent(Camera);
        console.log(this.camera3D);

        // this.node.on(Node.EventType.POSITION_CHANGED, function () {
        //     console.log('节点的位置已变化');
        //     // 在这里可以获取新的位置：
        //     this.labelName.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
        // }, this);
    }

    update(deltaTime: number) {
        
    }

    protected lateUpdate(dt: number): void {
        this.labelName.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
        // this.labelNameNoCanvas.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
    }
    
}


