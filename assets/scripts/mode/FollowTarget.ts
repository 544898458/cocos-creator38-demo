import { Vec2 } from 'cc';
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FollowTarget')
export class FollowTarget extends Component {
    @property(Node)
    target: Node
    
    @property(Vec3)
    offset: Vec3 = new Vec3();

    对准此处(posWorld:Vec3){
        posWorld.add(this.offset)
        this.node.position = posWorld
    }
}


