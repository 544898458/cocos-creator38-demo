import { _decorator, Component, Label, Node,Canvas, Camera, UITransform, utils } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Role')
export class Role extends Component {
    // nodeRoleName:Node
    camera3D:Camera
    nodeCanvas:Node
    uiTransformCanvas:UITransform
    start() {
        // console.log(this.node);

        // this.nodeCanvas = utils.find("Canvas", this.node.parent.parent);
        // console.log(this.nodeCanvas);

        // this.uiTransformCanvas = this.nodeCanvas.getComponent(UITransform);
        // console.log(this.uiTransformCanvas);

        // this.nodeRoleName = cc.find("RoleName", this.nodeCanvas);
        // console.log('RoleName',this.nodeRoleName);
        // this.nodeRoleName.getComponent(HeadScale).target = this.nodeRoleName;
        
        // this.camera3D = utils.find("Main Camera", this.node.parent.parent).getComponent(Camera);
        // console.log('Main Camera',this.camera3D);

        // this.node.on(Node.EventType.POSITION_CHANGED, function () {
        //     console.log('节点的位置已变化');
        //     // 在这里可以获取新的位置：
        //     this.labelName.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
        // }, this);
    }

    update(deltaTime: number) {
        
    }

    protected lateUpdate(dt: number): void {
        //this.nodeRoleName.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
        // this.labelNameNoCanvas.position = this.uiTransformCanvas.convertToNodeSpaceAR(this.camera3D.worldToScreen(this.node.position));
    }
    
}


