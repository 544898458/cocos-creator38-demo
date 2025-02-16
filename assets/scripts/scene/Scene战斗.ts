import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, Animation, Color} from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
import { FollowTarget } from '../mode/FollowTarget'
import { UiLogin, MsgId } from '../mode/UiLogin'
import { Vec2 } from 'cc'
import { EventTouch } from 'cc'
import { Graphics } from 'cc'
import { math } from 'cc'
import { UITransform } from 'cc'
import { PhysicsRayResult } from 'cc'
import { Canvas } from 'cc'
import { view } from 'cc'
import { BattleUI } from '../mode/BattleUI'
import { renderer } from 'cc'
import { tween } from 'cc'
import { Sprite } from 'cc'
import { SpriteFrame } from 'cc'
import { ImageAsset } from 'cc'
import { Tween } from 'cc'

const { ccclass, property } = _decorator
export class ClientEntityComponent {
    view: Node
    nodeName: Node
    node描述: Node
    labelName: Label
    label描述: Label
    skeletalAnimation: Animation
    initClipName: string = 'idle'
    nickName: string
    position: Vec3//刚进地图Load没结束无法设置node坐标，暂存
    hpbar: Node;
    hp: number = 0
    hpMax: number = 0
    prefabName: string
    tween移动: Tween<Node>
    removeFromParent() {
        this.view?.removeFromParent()
        this.nodeName?.removeFromParent()
        this.node描述?.removeFromParent()
        this.hpbar?.removeFromParent()
    }
}

const prefabName选中特效:string = 'Select'//这里不能用中文，原因不明
const nodeName地板:string = 'Plane' //地板对象名字

@ccclass('Scene战斗')
export class Scene战斗 extends Component {
    entities: Map<number, ClientEntityComponent> = new Map<number, ClientEntityComponent>
    entityId = new Map<string, number>//uuid=>服务器ID

    @property({ type: Node, displayName: "走向的目标点" })
    targetFlag: Node
    @property({ type: Component, displayName: "战斗面板" })
    public battleUI: BattleUI
    @property({ type: Camera, displayName: "3D摄像" })
    mainCamera: Camera
    @property({ type: Camera, displayName: "小地图摄像及" })
    camera小地图: Camera
    @property({ type: Node, displayName: "英雄" })
    roles: Node
    //ui登录
    uiLogin: UiLogin
    //摄像
    mainCameraFollowTarget: FollowTarget
    //鼠标点击世界坐标
    posWorld按下准备拖动地面: Vec3
    posWorld按下准备拖动地面时Camera: Vec3
    pos上次按下: Vec2
    b框选等待按下起始点: boolean = false
    posWorld框选起始点: Vec3 = null
    // b强行走: boolean = false
    graphics: Graphics
    b电脑鼠标操作: boolean = false
    f双指缩放初始值: number = 0
    protected onLoad(): void {
        console.log('Scene战斗.onLoad')
        this.Clear然后显示小地图视口框()
    }

    start() {
        console.log('Scene战斗.start')
        //初始化
        //获取常驻节点
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.graphics = director.getScene().getChildByName('Canvas').getComponent(Graphics);
        this.uiLogin.scene战斗 = this.node.getComponent(Scene战斗);
        console.log(this.uiLogin.scene战斗)
        this.mainCameraFollowTarget = this.mainCamera.getComponent(FollowTarget);
        this.battleUI.lable在线人数.string = this.uiLogin.str在线人数

        //3D摄像机鼠标滑轮（放大缩小）
        this.node.on(NodeEventType.MOUSE_WHEEL, (event: EventMouse) => {
            this.镜头缩放(event.getScrollY())
        })
        
        this.node.on(NodeEventType.MOUSE_UP,  (event: EventMouse) =>{
            let button = event.getButton()
            this.b电脑鼠标操作 = true
            this.onMouseUp(event.getLocation(), button == EventMouse.BUTTON_RIGHT)
        })
        this.node.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
            if(this.b电脑鼠标操作)
                return

            console.log('TOUCH_END', event)
            this.f双指缩放初始值 = null
            this.onMouseUp(event.getLocation(), false)
        })


        this.node.on(NodeEventType.TOUCH_MOVE, (event: EventTouch) => {
            console.log('TOUCH_MOVE', event)
            let arrTouch = event.getAllTouches()
            if(arrTouch.length >= 2)//双指缩放
            {
                if( null != this.f双指缩放初始值 )
                {
                    let f新值 = arrTouch[0].getLocation().clone().subtract(arrTouch[1].getLocation()).length();
                    
                    if( 0 == this.f双指缩放初始值 ){
                        this.f双指缩放初始值 = f新值
                        return
                    }else if(this.f双指缩放初始值 == f新值){
                        return
                    }
                    console.log('f新值', f新值, 'f双指缩放初始值', this.f双指缩放初始值)
                    this.镜头缩放((f新值 - this.f双指缩放初始值)*5)
                    this.f双指缩放初始值 = f新值
                }

                return
            }
            
            this.f双指缩放初始值 = null
            this.onMove(event.getDelta(), event.getLocation())
        })
        //
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            if(this.f双指缩放初始值 > 0)
                return

            let button = event.getButton()
            let posMouseDown = event.getLocation()
            this.b电脑鼠标操作 = true
            this.onMouseDown(posMouseDown, button == EventMouse.BUTTON_RIGHT)
        })
        this.node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            console.log('TOUCH_START', event)
            if(this.b电脑鼠标操作)
                return
                
            this.f双指缩放初始值 = 0
            this.onMouseDown(event.getLocation(), false)
        })

        this.scheduleOnce(this.Clear然后显示小地图视口框, 1)
    }
    
    static 缩放步长:number = 500
    镜头缩小() {
        this.镜头缩放(-Scene战斗.缩放步长)
    }
    镜头放大() {
        this.镜头缩放(Scene战斗.缩放步长)
    }
    镜头缩放(鼠标滚轮变化: number){
        if(this.是正交投影())
        {
            var y = 鼠标滚轮变化
            y /= 100
            // vec2Delta = vec2Delta.divide2f(10,10)
            // this.mainCamera.node.position = this.mainCamera.node.position.add3f(0, y, 0)
            this.mainCamera.orthoHeight = Math.min(Math.max(this.mainCamera.orthoHeight - y, 5), 100)
            //console.log('fov', this.mainCamera.fov);

        }
        else//透视投影
        {
            var y = 鼠标滚轮变化
            y /= 300
            // vec2Delta = vec2Delta.divide2f(10,10)
            // this.mainCamera.node.position = this.mainCamera.node.position.add3f(0, y, 0)
            this.mainCamera.fov = Math.max(this.mainCamera.fov - y, 5)
            //console.log('fov', this.mainCamera.fov);
        }
        this.Clear然后显示小地图视口框()
    }
    点击地面特效(vec3:Vec3)
    {
        this.targetFlag.position = vec3
        let ani = this.targetFlag.getChildByName('lightQ').getComponent(Animation)
        ani.play('lightQ')
    }
    onMouseUp(pos:Vec2, b鼠标右键:boolean) {
        if(this.posWorld按下准备拖动地面){
            this.posWorld按下准备拖动地面 = null
            console.log('fun创建消息:', this.uiLogin.fun创建消息)
            console.log('createMsgMove遇敌自动攻击', this.uiLogin.createMsgMove遇敌自动攻击)
            console.log('createMsg造建筑', this.uiLogin.createMsg造建筑)
            console.log('createMsgMove强行走', this.uiLogin.createMsgMove强行走)
            
            if(    this.uiLogin.funCreateMsg造建筑 !== this.uiLogin.fun创建消息 
                && this.uiLogin.createMsgMove强行走 !== this.uiLogin.fun创建消息
                ){ //正在强行走、正在摆放建筑物
                this.恢复战斗界面()
            }
        }
        console.log('onMouseUp', this.pos上次按下, pos)
        
        if(this.pos上次按下 && this.pos上次按下.clone().subtract(pos).length() < 5){//单击
            this.pos上次按下 = null

            var ray = new geometry.Ray()
            // const camera = cc.find("Camera",this.node).getComponent(Camera)
            this.mainCamera.screenPointToRay(pos.x, pos.y, ray)
            if (!PhysicsSystem.instance.raycast(ray)) {
                console.log('raycast does not hit the target node !')
                return false
            }
            let b已处理:boolean = false
            let fun点击地面处理: () => void = null
            console.log('length', PhysicsSystem.instance.raycastResults.length)
            PhysicsSystem.instance.raycastResults.forEach((item:PhysicsRayResult)=>{
                if (item.collider.node.name != nodeName地板) {//单击单位
                    this.点击单位(item, b鼠标右键)
                    b已处理 = true
                    return true
                }
                if(b已处理)
                    return true
                    
                fun点击地面处理 = ()=>{
                    if(!this.uiLogin.fun创建消息)
                        return

                    let object = this.uiLogin.fun创建消息(item.hitPoint)
                    if(object){
                        // this.b强行走 = false
                        // this.uiLogin.fun创建消息 = this.uiLogin.funCreateMsgMove遇敌自动攻击

                        const encoded = msgpack.encode(object)
                        
                        console.log('send', encoded)
                        this.uiLogin.send(encoded)
                        
                        this.点击地面特效(item.hitPoint)
                    }
                    this.uiLogin.fun创建消息 = 0 < this.uiLogin.arr选中.length ? this.uiLogin.createMsgMove遇敌自动攻击 : null
                    this.恢复战斗界面()
                }
            })

            if(!b已处理 && fun点击地面处理)
                fun点击地面处理()

            return
        }
        
        if(this.posWorld框选起始点 != null){
            var ray = new geometry.Ray()
            // const camera = cc.find("Camera",this.node).getComponent(Camera)
            this.mainCamera.screenPointToRay(pos.x, pos.y, ray)
            if (!PhysicsSystem.instance.raycast(ray)) {
                console.log('raycast does not hit the target node !')
                return false
            }
    
            PhysicsSystem.instance.raycastResults.forEach((item:PhysicsRayResult)=>{
                console.log('射线碰撞', item.collider.node.name, item.hitPoint)
                if (item.collider.node.name != nodeName地板) 
                    return

                const object = 
                [
                    [MsgId.框选, ++this.uiLogin.sendMsgSn, 0],
                    [this.posWorld框选起始点.x, this.posWorld框选起始点.z],
                    [item.hitPoint.x, item.hitPoint.z]
                ]
                console.log('send', this.posWorld框选起始点, item.hitPoint)
                const encoded = msgpack.encode(object)
                console.log('send', encoded)
                this.uiLogin.send(encoded)
            
                this.恢复战斗界面()
                return
            })
        }
    }
    恢复战斗界面(){
        console.log('恢复战斗界面');
        if(this.posWorld框选起始点){
            this.posWorld框选起始点 = null
            this.battleUI.lable系统消息.string ='已退出框选状态'
        }
        this.battleUI.下部列表.active = true
        this.Clear然后显示小地图视口框()// this.graphics.clear()//清掉框选框
    }
    //视角移动
    onMove(vec2Delta: Vec2, vec屏幕坐标) {
        console.log('鼠标移动了', vec屏幕坐标);
        // if(event.getButton() != EventMouse.BUTTON_MIDDLE)
        //     return
        var ray = new geometry.Ray()
        // const camera = cc.find("Camera",this.node).getComponent(Camera)
        this.mainCamera.screenPointToRay(vec屏幕坐标.x, vec屏幕坐标.y, ray)
        if (!PhysicsSystem.instance.raycast(ray)) {
            console.log('raycast does not hit the target node !')
            return false
        }

        let vec点中地面WorldPos
        PhysicsSystem.instance.raycastResults.forEach(
            (result:PhysicsRayResult)=>{
                console.log('鼠标移动触碰对象', result.collider.node)
                if (result.collider.node.name == nodeName地板) 
                    vec点中地面WorldPos = result.hitPoint.clone()
            })
        if(!vec点中地面WorldPos)
            return false

        if( this.posWorld框选起始点 != null)
        {
            this.画斜的选中框(this.posWorld框选起始点, vec点中地面WorldPos)
            return
        }

        console.log('posWorld按下准备拖动地面', this.posWorld按下准备拖动地面)
        console.log('posWorld按下准备拖动地面时Camera', this.posWorld按下准备拖动地面时Camera)
        
        if (this.posWorld按下准备拖动地面) {
            if(this.是正交投影())
            {
                let vec3零 =  new Vec3(0, 0, 0)//.multiplyScalar(div)
                let vec3 =  new Vec3(-vec2Delta.x, -vec2Delta.y, 0)//.multiplyScalar(div)
                let vec3World零 = new Vec3()
                let vec3WorldCamera = new Vec3()
                this.mainCamera.screenToWorld(vec3零, vec3World零)
                this.mainCamera.screenToWorld(vec3, vec3WorldCamera)
                console.log('vec3零', vec3零, 'vec3World零', vec3World零)
                console.log('vec3', vec3, 'vec3World', vec3WorldCamera)
                vec3WorldCamera.subtract(vec3World零)
                vec3WorldCamera.add(this.mainCamera.node.position)
                this.mainCamera.node.position = vec3WorldCamera
                vec3WorldCamera = null
            }
            else//透视投影
            {
                let vec新 = vec点中地面WorldPos.clone()
                let vec老 = this.posWorld按下准备拖动地面.clone()
                let vec老Camera = this.posWorld按下准备拖动地面时Camera.clone()
                vec老.subtract(vec新)
                vec老.add(vec老Camera)
                this.mainCamera.node.position = vec老
            }

            this.Clear然后显示小地图视口框()
            this.battleUI.下部列表.active = false
        }
    }
    onMouseDown(posMouseDown: Vec2, b鼠标右键: boolean) {
        console.log('onMouseDown', posMouseDown, b鼠标右键)

        var ray = new geometry.Ray()
        // const camera = cc.find("Camera",this.node).getComponent(Camera)
        this.mainCamera.screenPointToRay(posMouseDown.x, posMouseDown.y, ray)
        if (!PhysicsSystem.instance.raycast(ray)) {
            console.log('raycast does not hit the target node !')
            return false
        }
        // if (!PhysicsSystem.instance.raycastClosest(ray)) {
        //     console.log('raycast does not hit the target node !')
        //     return false
        // }
        this.posWorld按下准备拖动地面 = null
        PhysicsSystem.instance.raycastResults.forEach((item:PhysicsRayResult)=>{
            if(item.collider.node.name != nodeName地板)
                return

            console.log('射线碰撞', item.collider.node.name, item.hitPoint)    
            
            if(this.b框选等待按下起始点){//
                this.b框选等待按下起始点 = false
                this.posWorld框选起始点 = item.hitPoint.clone()
                this.battleUI.lable系统消息.string ='已开始框选，请拖动后放开'
                this.battleUI.下部列表.active = false
                return
            }else if(this.posWorld框选起始点){
                this.恢复战斗界面()
                return
            }else{
                this.pos上次按下 = posMouseDown.clone()
                this.posWorld按下准备拖动地面 = item.hitPoint.clone()
                this.posWorld按下准备拖动地面时Camera = this.mainCamera.node.position
            }
        })
        
        // const item = PhysicsSystem.instance.raycastClosestResult
        // if (item.collider.node.name == nodeName地板) {
        //     if(this.b框选等待按下起始点){//
        //         this.b框选等待按下起始点 = false
        //         this.posWorld框选起始点 = new Vec3(item.hitPoint)
        //         this.battleUI.lable语音消息提示.string ='已开始框选，请拖动后放开'

        //         return
        //     }

        //     this.pos上次按下 = posMouseDown.clone()
        //     this.posWorld按下准备拖动地面 = item.hitPoint.clone()
        //     this.posWorld按下准备拖动地面时Camera = this.mainCamera.node.position
        // }
    }
    点击单位(item:PhysicsRayResult, b鼠标右键:boolean)
    {
        if (item.collider.node.name == "晶体矿" || item.collider.node.name == "燃气矿")//点击晶体矿或者燃气矿
        {
            this.mainCameraFollowTarget.target = item.collider.node
            let id = this.entityId[item.collider.node.uuid]

            const object =
                [
                    [MsgId.采集, ++this.uiLogin.sendMsgSn, 0],
                    id
                ]

            const encoded = msgpack.encode(object)
            console.log('send', encoded)
            this.uiLogin.send(encoded)
            
        }
        else if (item.collider.node.name == "地堡" && b鼠标右键 )//点击地堡
        {
            this.mainCameraFollowTarget.target = item.collider.node
            let id = this.entityId[item.collider.node.uuid]

            const encoded = msgpack.encode([
                [MsgId.出地堡, ++this.uiLogin.sendMsgSn, 0],
                id
            ])

            console.log('send', encoded)
            this.uiLogin.send(encoded)
        }
        else if (item.collider.node.name == "地堡" && !b鼠标右键 && this.uiLogin.arr选中.length > 0)//左键点击地堡
        {
            this.mainCameraFollowTarget.target = item.collider.node
            let id = this.entityId[item.collider.node.uuid]

            const encoded = msgpack.encode([
                [MsgId.进地堡, ++this.uiLogin.sendMsgSn, 0],
                id,
                [0.0]
            ])

            console.log('send', encoded)
            this.uiLogin.send(encoded)
        }
        else if (
               item.collider.node.name == "工程车"
            || item.collider.node.name == "axe-yellow"
            || item.collider.node.name == "地堡"
            || item.collider.node.name == "民房"
            || item.collider.node.name == "兵厂"
            || item.collider.node.name == "基地"//这个名字不带目录
            || item.collider.node.name == "步兵"
            || item.collider.node.name == "三色坦克"
            || item.collider.node.name == "工蜂"
        ) {
            this.mainCameraFollowTarget.target = item.collider.node
            let id = this.entityId[item.collider.node.uuid]
            if (id == undefined) {
                console.log('还没加载')
                return
            }

            this.clear选中()
            this.uiLogin.send选中([id])
        }
    }
    update(deltaTime: number) {
    }

    Clear然后显示小地图视口框()
    {
        if(!this.graphics)
            return

        this.graphics.clear()
        this.显示小地图视口框()
    }
    显示小地图视口框(){
        let size = view.getVisibleSizeInPixel()
        let vec左下 = this.大屏幕坐标转小地图绘图坐标(0, 0)
        let vec右下 = this.大屏幕坐标转小地图绘图坐标(size.x, 0)
        let vec左上 = this.大屏幕坐标转小地图绘图坐标(0, size.y)
        let vec右上 = this.大屏幕坐标转小地图绘图坐标(size.x, size.y)
        if(!vec左下 || !vec右下 || !vec左上 || !vec右上)
            return

        // this.graphics.clear()
        // this.graphics.circle(vec左下.x, vec左下.y, 30)
        // this.graphics.circle(vec右下.x, vec右下.y, 30)
        // this.graphics.circle(vec左上.x, vec左上.y, 30)
        // this.graphics.circle(vec右上.x, vec右上.y, 30)
        this.graphics.strokeColor = Color.WHITE;
        this.graphics.moveTo(vec左上.x, vec左上.y);
        this.graphics.lineTo(vec左下.x, vec左下.y);
        this.graphics.lineTo(vec右下.x, vec右下.y);
        this.graphics.lineTo(vec右上.x, vec右上.y);
        this.graphics.lineTo(vec左上.x, vec左上.y);
        this.graphics.stroke();
    }
    大屏幕坐标转小地图绘图坐标(x:number,y:number):Vec3
    {
        var ray = new geometry.Ray()
        this.mainCamera.screenPointToRay(x, y, ray)
        if (!PhysicsSystem.instance.raycast(ray)) {
            console.log('raycast does not hit the target node !')
            return null
        }

        let vec3Grapics:Vec3
        PhysicsSystem.instance.raycastResults.forEach((item:PhysicsRayResult)=>{
            if(item.collider.node.name != nodeName地板)
                return

            vec3Grapics = this.Wolrd3D转Graphics绘图坐标小地图(item.hitPoint)
            console.log('item.hitPoint',item.hitPoint, 
                        'vec3Grapics', vec3Grapics,
                        'camera小地图', this.camera小地图)

        })
        return vec3Grapics
    }

    clear选中() {
        for (let id of this.uiLogin.arr选中) {
            let entity = this.entities.get(id)
            if (entity) {
                let node选中特效 = entity.view.getChildByName(prefabName选中特效)
                if (node选中特效)
                    node选中特效.removeFromParent()
            }
        }
    }
    选中(arr: number[]) {
        this.clear选中()
        this.uiLogin.arr选中 = arr
        for (let id of this.uiLogin.arr选中) {
            resources.load(prefabName选中特效, Prefab, (err, prefab) => {
                console.log('resources.load callback:', err, prefab)
                let old = this.entities.get(id)
                if(!old)
                {
                    console.log('找不到:', id)
                    return
                }
                
                const newNode = instantiate(prefab)
                newNode.name = prefabName选中特效
                
                old.view.addChild(newNode)
                let ani = newNode.getChildByName('lightQ').getComponent(Animation)
                const [clip] = ani.clips;
                ani.getState(clip.name).repeatCount = Infinity
            })
        }
        if(arr.length>0)
            this.uiLogin.fun创建消息 = this.uiLogin.createMsgMove遇敌自动攻击
    }
    worldToGraphics(graphicsNode:Node, worldPoint:Vec3) {
        // 获取graphics节点在世界坐标系中的位置
        let graphicsWorldPos = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0,0, 0));
        // 转换为局部坐标
        let localPoint = graphicsNode.getComponent(UITransform).convertToNodeSpaceAR(worldPoint);
        // 转换为graphics的局部坐标
        let graphicsLocalPos = localPoint//.subtract(graphicsWorldPos);
        return graphicsLocalPos;
    }
    Wolrd3D转Graphics绘图坐标(posWorld3D:Vec3):Vec3
    {
        return this.Wolrd3D转Graphics绘图坐标3D摄像机(this.mainCamera, posWorld3D)
    }
    Wolrd3D转Graphics绘图坐标小地图(posWorld3D:Vec3):Vec3
    {
        return this.Wolrd3D转Graphics绘图坐标3D摄像机(this.camera小地图, posWorld3D)
    }
    Wolrd3D转Graphics绘图坐标3D摄像机(camera:Camera, posWorld3D:Vec3):Vec3
    {
        let pos屏幕坐标 = camera.worldToScreen(posWorld3D)//纯整数，无小数，左下角为0
        let size = view.getVisibleSize()
        let sizeInPixel = view.getVisibleSizeInPixel()
        console.log('size', size)
        console.log('sizeInPixel', sizeInPixel)
        pos屏幕坐标.multiply3f(size.x/sizeInPixel.x, size.y/sizeInPixel.y, 1)
        let transform = this.graphics.node.getComponent(UITransform)
        let posGraphics绘图坐标 = transform.convertToNodeSpaceAR(pos屏幕坐标)
        return posGraphics绘图坐标
    }
    画斜的选中框(posWorld起始点:Vec3, posWorld结束点:Vec3){
        let 上 = Math.min(posWorld起始点.z, posWorld结束点.z)
        let 下 = Math.max(posWorld起始点.z, posWorld结束点.z)
        let 左 = Math.min(posWorld起始点.x, posWorld结束点.x)
        let 右 = Math.max(posWorld起始点.x, posWorld结束点.x)
        // console.log('左',左, '上',上,'右', 右, '下', 下)
        let posWorld3D左上 = new Vec3(左,0,上)
        let posWorld3D左下 = new Vec3(左,0,下)
        let posWorld3D右上 = new Vec3(右,0,上)
        let posWorld3D右下 = new Vec3(右,0,下)
        let posNode左上 = this.Wolrd3D转Graphics绘图坐标(posWorld3D左上)
        let posNode左下 = this.Wolrd3D转Graphics绘图坐标(posWorld3D左下)
        let posNode右上 = this.Wolrd3D转Graphics绘图坐标(posWorld3D右上)
        let posNode右下 = this.Wolrd3D转Graphics绘图坐标(posWorld3D右下)
        this.graphics.clear()
        this.graphics.strokeColor = Color.GREEN;
        this.graphics.moveTo(posNode左上.x, posNode左上.y);
        this.graphics.lineTo(posNode左下.x, posNode左下.y);
        this.graphics.lineTo(posNode右下.x, posNode右下.y);
        this.graphics.lineTo(posNode右上.x, posNode右上.y);
        this.graphics.lineTo(posNode左上.x, posNode左上.y);

        let pos = this.worldToGraphics(this.graphics.node, posWorld结束点)
        // this.graphics.circle(graphicsWorldPos.x,graphicsWorldPos.y,30)
        // this.graphics.circle(0,0,10)
        // this.graphics.circle(pos.x,pos.y,0)
        this.graphics.stroke()
        this.显示小地图视口框()
    }
    视口对准此处(vec:Vec3)
    {
        this.mainCameraFollowTarget.对准此处(vec)
        this.scheduleOnce(this.Clear然后显示小地图视口框,1)
    }
    是正交投影():boolean
    {
        return this.mainCamera.projection == renderer.scene.CameraProjection.ORTHO
    }
    切换镜头投影() {
        this.mainCamera.projection = this.是正交投影() ?
            renderer.scene.CameraProjection.PERSPECTIVE:
            renderer.scene.CameraProjection.ORTHO
        
        this.scheduleOnce(this.Clear然后显示小地图视口框,0.1)
    }
        
    弹丸特效(idEntity:number, idEntityTarget:number, str特效:string):void{
        resources.load(str特效, Prefab, (err, prefab) => {
                console.log('resources.load callback:', err, prefab)
                let entity起始 = this.entities.get(idEntity)
                let entity目标 = this.entities.get(idEntityTarget)
                if(!entity起始 || !entity目标)
                {
                    console.log('找不到:', idEntity)
                    return
                }
                
                const newNode = instantiate(prefab)
                newNode.name = prefabName选中特效
                newNode.position = entity起始.position.clone()
                let 特效根 = this.roles.getChildByName('特效根')
                特效根.addChild(newNode)
                tween(newNode).to(0.5, {position:entity目标.position}).start()
                this.scheduleOnce(()=>{特效根.removeChild(newNode)}, 2)
            })
    }
    剧情对话(str头像左:string, str名字左:string, str头像右:string, str名字右:string, str对话内容:string, b显示退出面板:boolean):void{
        this.battleUI.uiTransform剧情对话根.node.active = true
        this.battleUI.lable剧情对话内容.string = str对话内容
        this.battleUI.lable剧情对话名字左.string = str名字左
        this.battleUI.lable剧情对话名字右.string = str名字右
        if(str头像左.length > 0){
            resources.load(str头像左, ImageAsset, (err, imageAsset) => {
                console.log(err, imageAsset)
                this.battleUI.sprite剧情对话头像左.spriteFrame = SpriteFrame.createWithImage(imageAsset)
            })
        }else{
            this.battleUI.sprite剧情对话头像左.spriteFrame = null
        }

        if(str头像右.length > 0){
            resources.load(str头像右, ImageAsset, (err, imageAsset) => {
                console.log(err, imageAsset)
                this.battleUI.sprite剧情对话头像右.spriteFrame = SpriteFrame.createWithImage(imageAsset)
            })
        }else{
            this.battleUI.sprite剧情对话头像右.spriteFrame = null
        }

        this.battleUI.uiTransform剧情对话退出面板.node.active = b显示退出面板
    }
}


