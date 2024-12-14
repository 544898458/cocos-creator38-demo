import { Vec2 } from 'cc';
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FollowTarget')
export class FollowTarget extends Component {
    @property(Node)
    target: Node
    
    @property(Vec3)
    offset: Vec3 = new Vec3();

    tmpPos = new Vec3();
    start() {

    }

    update(deltaTime: number) {
        // if(this.target == undefined)
        //     return
        
        // this.target.getPosition(this.tmpPos)
        // this.tmpPos.add(this.offset)
        // this.node.position = this.tmpPos
    }
    对准此处(posWorld:Vec3){
        posWorld.add(this.offset)
        this.node.position = posWorld
    }
}


