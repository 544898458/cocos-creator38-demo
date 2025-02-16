import { view } from "cc";
import { renderer } from "cc";
import { _decorator, Component, Node, Prefab, instantiate, Vec3, Camera } from "cc";
const { ccclass, property } = _decorator;

@ccclass("HeadScale")
export class HeadScale extends Component {
    @property(Node)
    target: Node = null!;
    @property(Camera)
    camera: Camera = null!;
    @property
    distance = 0;
    @property(Camera)
    camera小地图: Camera = null!;
    private _lastWPos: Vec3 = new Vec3();
    private _pos: Vec3 = new Vec3();

    update(){
        let wpos = this.target.worldPosition;
        // @ts-ignore
        if (!this.camera!._camera ){//|| this._lastWPos.equals(wpos)) {
            // console.log(wpos);
            return;
        }

        this._lastWPos.set(wpos);
    //     if(this.node.name == "RoleName"){
    //         this._lastWPos.y += 1;//往上偏差30
    //    }
        const camera = this.camera!;
        // [HACK]
        // @ts-ignore
        camera._camera.update();
        camera.convertToUINode(this._lastWPos, this.node.parent!, this._pos);

        let sizeView = view.getVisibleSize()
        let 小地图左 = sizeView.x*(this.camera小地图.rect.x-0.5)
        let 小地图下 = sizeView.y*(this.camera小地图.rect.y-0.5)
        // console.log(this.node.name , 小地图左,小地图下, '_pos', this._pos)
        if(this._pos.x > 小地图左 && this._pos.y>小地图下)
        {
            // this.node.active=false
            // return
            this.node.setScale(0, 0, 0);//小地图范围不显示头顶血条和名字描述
            return
        }
        // else
            // this.node.active=true
        
        this.node.setPosition(this._pos);
        // @ts-ignore
        Vec3.transformMat4(this._pos, this.target.worldPosition, camera._camera!.matView);

        const ratio = camera.projection == renderer.scene.CameraProjection.ORTHO ?
             this.distance /camera.orthoHeight : this.distance*100/camera.fov / Math.abs(this._pos.z)
        const value = Math.floor(ratio * 100) / 100;
        this.node.setScale(value, value, 1);
        // if(!this.target)
        //     this.node?.destroy();
    }
}
