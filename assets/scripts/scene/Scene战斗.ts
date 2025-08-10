import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director, Animation, Color } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"

import { Vec2 } from 'cc'
import { EventTouch } from 'cc'
import { Graphics } from 'cc'
import { math } from 'cc'
import { UITransform } from 'cc'
import { PhysicsRayResult } from 'cc'
import { Canvas } from 'cc'
import { view } from 'cc'
import { BattleUI } from '../ui/BattleUI'
import { renderer } from 'cc'
import { tween } from 'cc'
import { Sprite } from 'cc'
import { SpriteFrame } from 'cc'
import { ImageAsset } from 'cc'
import { Tween } from 'cc'
import { AudioSource } from 'cc'
import { 苔蔓Component } from '../component/苔蔓Component'
import { Glob } from '../utils/Glob'
import { dispatcher } from '../manager/event/EventDispatcher'
import { Enum } from 'cc'
import { MainTest } from '../MainTest'
import { UI2Prefab } from '../autobind/UI2Prefab'
import { BattleMoude } from './BattleMoude'
import { MsgId, 单位类型, 属性类型 } from '../utils/Enum'

const { ccclass, property } = _decorator
export class ClientEntityComponent {
    static myNickName: string;
    view: Node
    nodeName: Node
    node描述: Node
    labelName: Label
    label描述: Label
    skeletalAnimation: Animation
    initClipName: string = 'idle'
    init初始动作播放速度: number = 1
    init初始动作Loop: boolean = true
    init初始动作起始时刻秒: number = 0
    init初始动作结束时刻秒: number = 0
    nickName: string
    entityName: string
    position: Vec3//刚进地图Load没结束无法设置node坐标，暂存
    eulerAngles: Vec3
    node血条: Node
    hpMax: number = 0
    node能量条: Node
    // 能量: number = 0
    能量Max: number = 0
    prefabName: string
    类型: 单位类型 = 单位类型.单位类型_Invalid_0
    tween移动: Tween<Node>
    苔蔓半径: number
    obj属性数值: object = new Object()

    hp(): number {
        return this.obj属性数值[属性类型.生命] as number
    }
    能量(): number {
        return this.obj属性数值[属性类型.能量] as number
    }
    removeFromParent() {
        this.view?.removeFromParent()
        this.nodeName?.removeFromParent()
        this.node描述?.removeFromParent()
        this.node血条?.removeFromParent()
        this.node能量条?.removeFromParent()
    }
    显示头顶名字(b显示单位类型: boolean): void {
        if (!this.labelName)
            return

        if (b显示单位类型)
            this.labelName.string = this.nickName + ' ' + this.entityName
        else
            this.labelName.string = this.nickName
        this.头顶名字着色()
    }

    头顶名字着色(): void {
        if (this.类型 == 单位类型.晶体矿 || this.类型 == 单位类型.燃气矿) {
            this.labelName.color = new Color(170, 255, 255);
        }
        else if (this.类型 == 单位类型.光刺 || this.类型 == 单位类型.特效) {
            this.labelName.color = new Color(80, 80, 80);
            this.判断是否同玩家名着色子弹();

        }
        else if (this.类型 == 单位类型.视口) {
            // ClientEntityComponent.myNickName = this.nickName
            this.labelName.color = new Color(50, 50, 50);
        }
        else if (this.hp() <= 0) {
            this.labelName.color = new Color(130, 130, 130);
        }
        else {
            this.判断是否同玩家名着色单位();
        }
    }
    判断是否同玩家名着色子弹() {
        if (Glob.myNickName != null) {
            if (this.nickName != Glob.myNickName) {
                this.labelName.color = new Color(80, 30, 30);
            }
            else {
                this.labelName.color = new Color(30, 80, 30);
            }
        }
    }
    判断是否同玩家名着色单位() {
        if (Glob.myNickName != null) {
            if (this.nickName != Glob.myNickName) {
                this.labelName.color = new Color(255, 100, 100);
            }
            else {
                this.labelName.color = new Color(100, 255, 100);
            }
        }
    }
}

const prefabName选中特效: string = 'Select'//这里不能用中文，原因不明
const prefabName范围特效: string = '特效/范围'
const nodeName攻击范围: string = '攻击范围'
const nodeName警戒范围: string = '警戒范围'
const nodeName地图: string = 'map' //地图前称

@ccclass('Scene战斗')
export class Scene战斗 extends Component {
    entities: Map<number, ClientEntityComponent> = new Map<number, ClientEntityComponent>
    entityId = new Map<string, number>//uuid=>服务器ID

    @property({ type: Node, displayName: "走向的目标点" })
    targetFlag: Node

    @property({ type: Camera, displayName: "3D摄像" })
    mainCamera: Camera
    @property({ type: Camera, displayName: "小地图摄像及" })
    camera小地图: Camera
    @property({ type: Node, displayName: "英雄" })
    roles: Node
    @property({ type: AudioSource })
    audioSource: AudioSource

    //鼠标点击世界坐标
    posWorld按下准备拖动地面: Vec3
    posWorld按下准备拖动地面时Camera: Vec3
    pos上次按下: Vec2
    b框选等待按下起始点: boolean = false
    posWorld框选起始点: Vec3 = null
    pos屏幕框选起始点: Vec2 = null
    // b强行走: boolean = false
    graphics: Graphics
    b电脑鼠标操作: boolean = false
    f双指缩放初始值: number = 0
    vec摄像机在Update更新位置: Vec3 = null
    obj已解锁单位: object
    obj属性等级: object
    battleUI: BattleUI = null;
    protected onLoad(): void {
        console.log('Scene战斗.onLoad')
        this.Clear然后显示小地图视口框()
    }

    start() {
        console.log('Scene战斗.start')
        //初始化
        //获取常驻节点

        this.graphics = director.getScene().getChildByName('Canvas').getComponent(Graphics);

        //this.battleUI.lable在线人数.string = Glob.str在线人数.toString();

        //3D摄像机鼠标滑轮（放大缩小）
        this.node.on(NodeEventType.MOUSE_WHEEL, (event: EventMouse) => {
            this.镜头缩放(event.getScrollY())
        })

        this.node.on(NodeEventType.MOUSE_UP, (event: EventMouse) => {
            let button = event.getButton()
            this.b电脑鼠标操作 = true
            this.onMouseUp(event.getLocation(), button == EventMouse.BUTTON_RIGHT)
        })
        this.node.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
            if (this.b电脑鼠标操作)
                return

            console.log('TOUCH_END', event)
            this.f双指缩放初始值 = null
            this.onMouseUp(event.getLocation(), false)
        })


        this.node.on(NodeEventType.TOUCH_MOVE, (event: EventTouch) => {
            // console.log('TOUCH_MOVE', event)
            let arrTouch = event.getAllTouches()
            if (arrTouch.length >= 2)//双指缩放
            {
                if (null != this.f双指缩放初始值) {
                    let f新值 = arrTouch[0].getLocation().clone().subtract(arrTouch[1].getLocation()).length();

                    if (0 == this.f双指缩放初始值) {
                        this.f双指缩放初始值 = f新值
                        return
                    } else if (this.f双指缩放初始值 == f新值) {
                        return
                    }
                    console.log('f新值', f新值, 'f双指缩放初始值', this.f双指缩放初始值)
                    this.镜头缩放((f新值 - this.f双指缩放初始值) * 5)
                    this.f双指缩放初始值 = f新值
                }

                return
            }

            this.f双指缩放初始值 = null
            this.onMove(event.getDelta(), event.getLocation())
        })
        //
        this.node.on(NodeEventType.MOUSE_DOWN, (event: EventMouse) => {
            if (this.f双指缩放初始值 > 0)
                return

            let button = event.getButton()
            let posMouseDown = event.getLocation()
            this.b电脑鼠标操作 = true
            this.onMouseDown(posMouseDown, button == EventMouse.BUTTON_RIGHT)
        })
        this.node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            console.log('TOUCH_START', event)
            if (this.b电脑鼠标操作)
                return

            this.f双指缩放初始值 = 0
            this.onMouseDown(event.getLocation(), false)
        })

        this.scheduleOnce(this.Clear然后显示小地图视口框, 1)
    }

    static 缩放步长: number = 500
    镜头缩小() {
        this.镜头缩放(-Scene战斗.缩放步长)
    }
    镜头放大() {
        this.镜头缩放(Scene战斗.缩放步长)
    }
    镜头缩放(鼠标滚轮变化: number) {
        if (this.是正交投影()) {
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
    点击地面特效(vec3: Vec3) {
        this.targetFlag.position = vec3
        this.targetFlag.active = true
        let ani = this.targetFlag.getChildByName('lightQ').getComponent(Animation)
        ani.play('lightQ')
        let vecLocal = vec3.clone()
        tween(this.targetFlag).delay(3).call(() => {
            if (vecLocal.equals(this.targetFlag.position))
                this.targetFlag.active = false
        }).start()
    }
    onMouseUp(pos: Vec2, b鼠标右键: boolean) {
        console.log('onMouseUp', this.pos上次按下, pos)
        if (this.posWorld按下准备拖动地面) {
            this.posWorld按下准备拖动地面 = null

            if (BattleMoude.instance.arr巡逻点) {

            }
            else if (MainTest.instance.funCreateMsg造建筑 !== BattleMoude.instance.fun点击地面创建消息
                && BattleMoude.instance.createMsgMove强行走 !== BattleMoude.instance.fun点击地面创建消息
            ) {
                this.恢复战斗界面()//正在强行走、正在摆放建筑物
            }
        }
        
        if (this.pos上次按下 && this.pos上次按下.clone().subtract(pos).length() < 5) {//单击
            this.pos上次按下 = null

            var ray = new geometry.Ray()
            // const camera = cc.find("Camera",this.node).getComponent(Camera)
            this.mainCamera.screenPointToRay(pos.x, pos.y, ray)
            if (!PhysicsSystem.instance.raycast(ray)) {
                console.log('raycast does not hit the target node !')
                return false
            }
            let b已处理: boolean = false
            let fun点击地面处理: () => void = null
            console.log('length', PhysicsSystem.instance.raycastResults.length)
            PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
                if (b已处理)
                    return true

                if (item.collider.node.name.substring(0, 3) != nodeName地图) {//单击单位
                    this.点击单位(item, b鼠标右键)
                    b已处理 = true
                    return true
                }


                fun点击地面处理 = () => {
                    let vecHitPoint = item.hitPoint.clone()
                    if (BattleMoude.instance.arr巡逻点) {
                        BattleMoude.instance.arr巡逻点.push(vecHitPoint)

                        //输出vecHitPoint.x vecHitPoint.y vecHitPoint.z时只保留1位小数
                        this.battleUI.lable系统消息.string = vecHitPoint.x.toFixed(1) + ',' + vecHitPoint.y.toFixed(1) + ',' + vecHitPoint.z.toFixed(1) 
                            + ' 已添加为巡逻点，请继续点击地面添加巡逻点，或点击“确定”提交巡逻点列表'
                        return
                    }

                    if (!BattleMoude.instance.fun点击地面创建消息) {
                        return
                    }
                    let object = b鼠标右键 ? BattleMoude.instance.createMsgMove强行走(vecHitPoint) : BattleMoude.instance.fun点击地面创建消息(vecHitPoint)
                    if (object) {

                        const encoded = msgpack.encode(object)

                        console.log('send', encoded)
                        dispatcher.send(encoded)

                        this.点击地面特效(vecHitPoint)
                    }
                    BattleMoude.instance.fun点击地面创建消息 = 0 < BattleMoude._arr选中.length ? BattleMoude.instance.createMsgMove遇敌自动攻击 : null
                    this.恢复战斗界面()
                }
            })

            if (!b已处理 && fun点击地面处理)
                fun点击地面处理()

            return
        }

        if (this.posWorld框选起始点 != null) {
            var ray = new geometry.Ray()
            // const camera = cc.find("Camera",this.node).getComponent(Camera)
            this.mainCamera.screenPointToRay(pos.x, pos.y, ray)
            if (!PhysicsSystem.instance.raycast(ray)) {
                console.log('raycast does not hit the target node !')
                return false
            }

            let b已处理: boolean = false
            PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
                console.log('射线碰撞', item.collider.node.name, item.hitPoint)
                if (b已处理)
                    return

                if (item.collider.node.name.substring(0, 3) != nodeName地图)
                    return
                if (!this.battleUI) {
                    this.battleUI = MainTest.instance.dialogMgr.getDialog(UI2Prefab.BattleUI_url).getComponent(BattleUI);
                }
                if (this.battleUI.b菱形框选) {
                    dispatcher.sendArray([
                        [MsgId.框选, ++Glob.sendMsgSn, 0],
                        [this.posWorld框选起始点.x, this.posWorld框选起始点.z],
                        [item.hitPoint.x, item.hitPoint.z]
                    ])
                } else {//矩形框选
                    let arr选中: Number[] = []
                    this.entities.forEach((entity, id, _) => {
                        let pos屏幕坐标 = this.mainCamera.worldToScreen(entity.position)//纯整数，无小数，左下角为0
                        let 上 = Math.max(this.pos屏幕框选起始点.y, pos.y)
                        let 下 = Math.min(this.pos屏幕框选起始点.y, pos.y)
                        let 左 = Math.min(this.pos屏幕框选起始点.x, pos.x)
                        let 右 = Math.max(this.pos屏幕框选起始点.x, pos.x)
                        console.log(上, 下, 左, 右, pos屏幕坐标)
                        if (左 < pos屏幕坐标.x && pos屏幕坐标.x < 右 &&
                            下 < pos屏幕坐标.y && pos屏幕坐标.y < 上) {
                            arr选中.push(id)
                        }
                    })
                    dispatcher.sendArray([
                        [MsgId.SelectRoles, ++Glob.sendMsgSn, 0],
                        arr选中//虽然是整数，但是也强制转成FLOAT64发出去了
                    ])
                }
                this.恢复战斗界面()
                b已处理 = true
                return
            })
        }
    }
    恢复战斗界面() {
        console.log('恢复战斗界面');
        if (!this.battleUI) {
            this.battleUI = MainTest.instance.dialogMgr.getDialog(UI2Prefab.BattleUI_url).getComponent(BattleUI);
        }
        if (this.posWorld框选起始点) {
            this.posWorld框选起始点 = null
            this.battleUI.lable系统消息.string = '已退出框选状态'
        }

        this.battleUI.恢复战斗界面()
        this.Clear然后显示小地图视口框()// this.graphics.clear()//清掉框选框
    }
    //视角移动
    onMove(vec2Delta: Vec2, vec屏幕坐标) {
        // console.log('鼠标移动了', vec屏幕坐标);
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
            (result: PhysicsRayResult) => {
                // console.log('鼠标移动触碰对象', result.collider.node)
                if (result.collider.node.name.substring(0, 3) == nodeName地图)
                    vec点中地面WorldPos = result.hitPoint.clone()
            })
        if (!vec点中地面WorldPos)
            return false

        if (this.posWorld框选起始点 != null) {
            if (this.battleUI.b菱形框选)
                this.画斜的选中框(this.posWorld框选起始点, vec点中地面WorldPos)
            else
                this.画正矩形选中框(this.pos屏幕框选起始点, vec屏幕坐标)
            return
        }

        // console.log('posWorld按下准备拖动地面', this.posWorld按下准备拖动地面)
        // console.log('posWorld按下准备拖动地面时Camera', this.posWorld按下准备拖动地面时Camera)

        if (this.posWorld按下准备拖动地面) {
            if (this.是正交投影()) {
                let vec3零 = new Vec3(0, 0, 0)//.multiplyScalar(div)
                let vec3 = new Vec3(-vec2Delta.x, -vec2Delta.y, 0)//.multiplyScalar(div)
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
                this.vec摄像机在Update更新位置 = this.posWorld按下准备拖动地面.clone()
                let vec老Camera = this.posWorld按下准备拖动地面时Camera.clone()
                this.vec摄像机在Update更新位置.subtract(vec新)
                this.vec摄像机在Update更新位置.add(vec老Camera)
            }

            this.Clear然后显示小地图视口框()
            if (!this.battleUI) {
                this.battleUI = MainTest.instance.dialogMgr.getDialog(UI2Prefab.BattleUI_url).getComponent(BattleUI);
            }
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
        PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
            if (item.collider.node.name.substring(0, 3) != nodeName地图)
                return

            console.log('射线碰撞', item.collider.node.name, item.hitPoint)

            if (this.b框选等待按下起始点) {//
                this.b框选等待按下起始点 = false
                this.posWorld框选起始点 = item.hitPoint.clone()
                this.pos屏幕框选起始点 = posMouseDown.clone()
                this.battleUI.lable系统消息.string = '已开始框选，请拖动后放开'
                this.battleUI.进入点击地面状态()
                return
            } else if (this.posWorld框选起始点) {
                this.恢复战斗界面()
                return
            } else {
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
    点击单位(item: PhysicsRayResult, b鼠标右键: boolean) {
        this.entityId = MainTest.instance.scene战斗.entityId;
        let id = this.entityId[item.collider.node.uuid]
        let entity = this.entities.get(id)
        let nodeName = item.collider.node.name
        if (BattleMoude.instance.fun点击单位创建消息) {
            let object = BattleMoude.instance.fun点击单位创建消息(entity, id)
            if (object) {
                const encoded = msgpack.encode(object)
                dispatcher.send(encoded)
            }
            BattleMoude.instance.fun点击单位创建消息 = null
        }
        else if (nodeName == "晶体矿" || nodeName == "燃气矿")//点击晶体矿或者燃气矿
        {
            let id = this.entityId[item.collider.node.uuid]

            dispatcher.sendArray([
                [MsgId.采集, ++Glob.sendMsgSn, 0],
                id
            ])
        }
        else if ((nodeName == '地堡' || nodeName == '房虫') && b鼠标右键)//点击地堡
        {
            let id = this.entityId[item.collider.node.uuid]

            let idMsg = entity.类型 == 单位类型.地堡 ? MsgId.出地堡 : MsgId.出房虫
            dispatcher.sendArray([
                [idMsg, ++Glob.sendMsgSn, 0],
                id
            ])
        }
        else if ((nodeName == '地堡' || nodeName == '房虫') && !b鼠标右键 && BattleMoude._arr选中.length > 0)//左键点击地堡或房虫
        {
            let id = this.entityId[item.collider.node.uuid]
            let idMsg = entity.类型 == 单位类型.地堡 ? MsgId.进地堡 : MsgId.进房虫
            let entity选中的第一个 = this.entities.get(BattleMoude._arr选中[0])
            if (entity.类型 == 单位类型.房虫 && 1 == BattleMoude._arr选中.length && entity选中的第一个 && entity选中的第一个.类型 == 单位类型.房虫) {
                this.请求选中此单位(item.collider.node)
            } else
                dispatcher.sendArray([
                    [idMsg, ++Glob.sendMsgSn, 0],
                    id,
                    [0.0]
                ])
        }
        else if (
            nodeName != "晶体矿"
            && nodeName != "燃气矿"
            && nodeName != "视口"
        ) {
            this.请求选中此单位(item.collider.node)
        }
    }
    请求选中此单位(node: Node) {
        let id = this.entityId[node.uuid]
        if (id == undefined) {
            console.log('还没加载')
            return
        }

        this.clear选中()
        BattleMoude.instance.send选中([id])
    }
    update(deltaTime: number) {
        if (this.vec摄像机在Update更新位置) {
            this.mainCamera.node.position = this.vec摄像机在Update更新位置
            this.vec摄像机在Update更新位置 = null
        }
    }

    Clear然后显示小地图视口框() {
        if (!this.graphics)
            return

        this.graphics.clear()
        this.显示小地图视口框()
    }
    显示小地图视口框() {
        let size = view.getVisibleSizeInPixel()
        let vec左下 = this.大屏幕坐标转小地图绘图坐标(0, 0)
        let vec右下 = this.大屏幕坐标转小地图绘图坐标(size.x, 0)
        let vec左上 = this.大屏幕坐标转小地图绘图坐标(0, size.y)
        let vec右上 = this.大屏幕坐标转小地图绘图坐标(size.x, size.y)
        if (!vec左下 || !vec右下 || !vec左上 || !vec右上)
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
    大屏幕坐标转小地图绘图坐标(x: number, y: number): Vec3 {
        var ray = new geometry.Ray()
        this.mainCamera.screenPointToRay(x, y, ray)
        if (!PhysicsSystem.instance.raycast(ray)) {
            console.log('raycast does not hit the target node !')
            return null
        }

        let vec3Grapics: Vec3
        PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
            if (item.collider.node.name.substring(0, 3) != nodeName地图)
                return

            vec3Grapics = this.Wolrd3D转Graphics绘图坐标小地图(item.hitPoint)
            // console.log('item.hitPoint',item.hitPoint, 
            //             'vec3Grapics', vec3Grapics,
            //             'camera小地图', this.camera小地图)

        })
        return vec3Grapics
    }

    clear选中() {
        this.battleUI.node取消选中.active = false
        this.隐藏选中单位专用按钮()
        for (let id of BattleMoude._arr选中) {
            let entity = this.entities.get(id)
            if (entity) {
                entity.view.getChildByName(prefabName选中特效)?.removeFromParent()
                entity.view.getChildByName(nodeName攻击范围)?.removeFromParent()
                entity.view.getChildByName(nodeName警戒范围)?.removeFromParent()
            }
        }
    }

    隐藏选中单位专用按钮() {
        if (!this.battleUI) {
            this.battleUI = MainTest.instance.dialogMgr.getDialog(UI2Prefab.BattleUI_url)?.getComponent(BattleUI);
        }

        this.battleUI.button跟随.node.active = false
        this.battleUI.button强行走.node.active = false
        this.battleUI.button集结点.node.active = false
        this.battleUI.button集结点_房虫.node.active = false
        this.battleUI.button集结点_工虫.node.active = false
        this.battleUI.button集结点_工程车.node.active = false
        this.battleUI.button离开地堡.node.active = false
        this.battleUI.button原地坚守.node.active = false
        this.battleUI.button巡逻.node.active = false
        this.battleUI.button解锁枪虫.node.active = false
        this.battleUI.button解锁近战兵.node.active = false
        this.battleUI.node升级枪兵攻击.active = false
        this.battleUI.node升级近战虫攻击.active = false
        this.battleUI.node升级枪虫防御.active = false
        this.battleUI.node升级近战兵防御.active = false
        this.battleUI.node升级三色坦克移速.active = false
        this.battleUI.node升级飞机攻速.active = false
        this.battleUI.node升级绿色坦克攻速.active = false
        this.battleUI.node升级飞虫移速.active = false
        this.battleUI.node太岁分裂.active = false
        this.battleUI.node离开房虫.active = false
        this.battleUI.node删除自己的单位.active = false
    }

    选中(arr: number[]) {
        this.clear选中()
        BattleMoude._arr选中 = arr

        if (0 < arr.length)
            this.battleUI.node取消选中.active = true

        this.battleUI.onSelectUnits(arr);

        let b第一个: boolean = true
        for (let id of BattleMoude._arr选中) {
            let old = this.entities.get(id)
            if (!old) {
                console.log('找不到:', id)
                return
            }

            if (old.view && old.view.getChildByName(prefabName选中特效))
                continue//已有特效

            resources.load(prefabName选中特效, Prefab, (err, prefab) => {
                console.log('resources.load callback:', err, prefab)
                if (0 > BattleMoude._arr选中.indexOf(id)) {
                    console.log('已取消选中:', id)
                    return
                }
                let old = this.entities.get(id)
                if (!old || !old.view) {
                    console.log('找不到Entity或view:', id)
                    return
                }
                old.view.getChildByName(prefabName选中特效)?.removeFromParent()
                const newNode = instantiate(prefab)
                newNode.name = prefabName选中特效

                old.view.addChild(newNode)
                let 配置 = MainTest.instance.配置.find建筑单位(old.类型)
                if (配置) {
                    let 放大 = 配置.f半边长 / 2
                    newNode.scale = newNode.scale.clone().multiply3f(放大, 1, 放大)
                    console.log('放大', 放大, newNode.scale)

                }

                if (b第一个) {
                    b第一个 = false
                    this.隐藏选中单位专用按钮()

                    if (MainTest.Is活动单位(old.类型)) {
                        this.battleUI.button跟随.node.active = true
                        this.battleUI.button强行走.node.active = true
                        this.battleUI.button原地坚守.node.active = true
                        this.battleUI.button巡逻.node.active = true
                    }

                    switch (old.类型) {
                        case 单位类型.地堡:
                            this.battleUI.button离开地堡.node.active = true
                            break;
                        case 单位类型.兵营:
                            this.battleUI.button集结点.node.active = true
                            if (!this.obj已解锁单位[单位类型.近战兵])
                                this.battleUI.button解锁近战兵.node.active = true

                            this.如果没满级就显示(单位类型.枪兵, 属性类型.攻击, this.battleUI.node升级枪兵攻击)
                            this.如果没满级就显示(单位类型.近战兵, 属性类型.防御, this.battleUI.node升级近战兵防御)
                            break;
                        case 单位类型.虫营:
                            console.log(typeof (this.obj已解锁单位))
                            if (!this.obj已解锁单位[单位类型.枪虫])
                                this.battleUI.button解锁枪虫.node.active = true

                            this.如果没满级就显示(单位类型.枪虫, 属性类型.防御, this.battleUI.node升级枪虫防御)
                            this.如果没满级就显示(单位类型.近战虫, 属性类型.攻击, this.battleUI.node升级近战虫攻击)
                            break
                        case 单位类型.重车厂:
                            this.battleUI.button集结点.node.active = true
                            this.如果没满级就显示(单位类型.三色坦克, 属性类型.移动速度, this.battleUI.node升级三色坦克移速)
                            break
                        case 单位类型.机场:
                            this.battleUI.button集结点.node.active = true
                            this.如果没满级就显示(单位类型.飞机, 属性类型.攻击前摇_伤害耗时, this.battleUI.node升级飞机攻速)
                            break
                        case 单位类型.拟态源:
                            this.如果没满级就显示(单位类型.绿色坦克, 属性类型.攻击前摇_伤害耗时, this.battleUI.node升级绿色坦克攻速)
                            break
                        case 单位类型.飞塔:
                            this.如果没满级就显示(单位类型.飞虫, 属性类型.移动速度, this.battleUI.node升级飞虫移速)
                            break
                        case 单位类型.太岁:
                            this.battleUI.node太岁分裂.active = true
                            break
                        case 单位类型.基地:
                            this.battleUI.button集结点.node.active = true
                            this.battleUI.button集结点_工程车.node.active = true
                            break
                        case 单位类型.虫巢:
                            this.battleUI.button集结点.node.active = true
                            this.battleUI.button集结点_房虫.node.active = true
                            this.battleUI.button集结点_工虫.node.active = true
                            break
                        case 单位类型.房虫:
                            this.battleUI.node离开房虫.active = true
                            break
                        case 单位类型.方墩:
                            this.battleUI.node删除自己的单位.active = true
                            break
                        default:
                            console.log('此单位没有专用菜单' + old.类型)
                            break
                    }
                }
            })

            if (1 == arr.length) {
                resources.load(prefabName范围特效, Prefab, (err, prefab) => {
                    // console.log('resources.load callback:', err, prefab)
                    if (0 > BattleMoude._arr选中.indexOf(id)) {
                        console.log('已取消选中:', id)
                        return
                    }
                    let old = this.entities.get(id)
                    if (!old) {
                        console.log('找不到:', id)
                        return
                    }

                    let 战斗 = MainTest.instance.配置.find战斗(old.类型)
                    if (战斗) {
                        {
                            old.view.getChildByName(nodeName攻击范围)?.removeFromParent()
                            const newNode = instantiate(prefab)
                            newNode.name = nodeName攻击范围
                            old.view.addChild(newNode)
                            let scale = 战斗.f攻击距离
                            newNode.scale = newNode.scale.clone().multiply3f(scale, 1, scale)
                        }
                        {
                            old.view.getChildByName(nodeName警戒范围)?.removeFromParent()
                            const newNode = instantiate(prefab)
                            newNode.name = nodeName警戒范围
                            old.view.addChild(newNode)
                            let scale = 战斗.f警戒距离
                            newNode.scale = newNode.scale.clone().multiply3f(scale, 1, scale)
                        }
                    }
                })
            }
        }
        if (arr.length > 0)
            BattleMoude.instance.fun点击地面创建消息 = BattleMoude.instance.createMsgMove遇敌自动攻击
    }
    worldToGraphics(graphicsNode: Node, worldPoint: Vec3) {
        // 获取graphics节点在世界坐标系中的位置
        let graphicsWorldPos = graphicsNode.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0, 0, 0));
        // 转换为局部坐标
        let localPoint = graphicsNode.getComponent(UITransform).convertToNodeSpaceAR(worldPoint);
        // 转换为graphics的局部坐标
        let graphicsLocalPos = localPoint//.subtract(graphicsWorldPos);
        return graphicsLocalPos;
    }
    Wolrd3D转Graphics绘图坐标(posWorld3D: Vec3): Vec3 {
        return this.Wolrd3D转Graphics绘图坐标3D摄像机(this.mainCamera, posWorld3D)
    }
    Wolrd3D转Graphics绘图坐标小地图(posWorld3D: Vec3): Vec3 {
        return this.Wolrd3D转Graphics绘图坐标3D摄像机(this.camera小地图, posWorld3D)
    }
    Wolrd3D转Graphics绘图坐标3D摄像机(camera: Camera, posWorld3D: Vec3): Vec3 {
        let pos屏幕坐标 = camera.worldToScreen(posWorld3D)//纯整数，无小数，左下角为0
        return this.屏幕坐标转Graphics绘图坐标(pos屏幕坐标)

    }
    屏幕坐标转Graphics绘图坐标(pos屏幕坐标: Vec3): Vec3 {
        let size = view.getVisibleSize()
        let sizeInPixel = view.getVisibleSizeInPixel()
        // console.log('size', size)
        // console.log('sizeInPixel', sizeInPixel)
        pos屏幕坐标.multiply3f(size.x / sizeInPixel.x, size.y / sizeInPixel.y, 1)
        let transform = this.graphics.node.getComponent(UITransform)
        let posGraphics绘图坐标 = transform.convertToNodeSpaceAR(pos屏幕坐标)
        return posGraphics绘图坐标
    }
    画斜的选中框(posWorld起始点: Vec3, posWorld结束点: Vec3) {
        let 上 = Math.min(posWorld起始点.z, posWorld结束点.z)
        let 下 = Math.max(posWorld起始点.z, posWorld结束点.z)
        let 左 = Math.min(posWorld起始点.x, posWorld结束点.x)
        let 右 = Math.max(posWorld起始点.x, posWorld结束点.x)
        // console.log('左',左, '上',上,'右', 右, '下', 下)
        let posWorld3D左上 = new Vec3(左, 0, 上)
        let posWorld3D左下 = new Vec3(左, 0, 下)
        let posWorld3D右上 = new Vec3(右, 0, 上)
        let posWorld3D右下 = new Vec3(右, 0, 下)
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
    画正矩形选中框(pos屏幕起始点: Vec2, pos屏幕结束点: Vec2) {
        let 上 = Math.min(pos屏幕起始点.y, pos屏幕结束点.y)
        let 下 = Math.max(pos屏幕起始点.y, pos屏幕结束点.y)
        let 左 = Math.min(pos屏幕起始点.x, pos屏幕结束点.x)
        let 右 = Math.max(pos屏幕起始点.x, pos屏幕结束点.x)
        // console.log('左',左, '上',上,'右', 右, '下', 下)
        let posWorld3D左上 = new Vec3(左, 上, 0)
        let posWorld3D左下 = new Vec3(左, 下, 0)
        let posWorld3D右上 = new Vec3(右, 上, 0)
        let posWorld3D右下 = new Vec3(右, 下, 0)
        let posNode左上 = this.屏幕坐标转Graphics绘图坐标(posWorld3D左上)
        let posNode左下 = this.屏幕坐标转Graphics绘图坐标(posWorld3D左下)
        let posNode右上 = this.屏幕坐标转Graphics绘图坐标(posWorld3D右上)
        let posNode右下 = this.屏幕坐标转Graphics绘图坐标(posWorld3D右下)
        this.graphics.clear()
        this.graphics.strokeColor = Color.GREEN;
        this.graphics.moveTo(posNode左上.x, posNode左上.y);
        this.graphics.lineTo(posNode左下.x, posNode左下.y);
        this.graphics.lineTo(posNode右下.x, posNode右下.y);
        this.graphics.lineTo(posNode右上.x, posNode右上.y);
        this.graphics.lineTo(posNode左上.x, posNode左上.y);

        // let pos = this.worldToGraphics(this.graphics.node, posWorld结束点)
        // this.graphics.circle(graphicsWorldPos.x,graphicsWorldPos.y,30)
        // this.graphics.circle(0,0,10)
        // this.graphics.circle(pos.x,pos.y,0)
        this.graphics.stroke()
        this.显示小地图视口框()
    }
    视口对准此处(vec: Vec3) {
        //屏幕中心点世界坐标
        let pos屏幕中心点 = new Vec3(view.getVisibleSizeInPixel().x / 2, view.getVisibleSizeInPixel().y / 2)
        console.log('pos屏幕中心点', pos屏幕中心点)
        let ray = new geometry.Ray()
        // const camera = cc.find("Camera",this.node).getComponent(Camera)
        this.mainCamera.screenPointToRay(pos屏幕中心点.x, pos屏幕中心点.y, ray)
        if (!PhysicsSystem.instance.raycast(ray)) {
            console.log('raycast does not hit the target node !')
            return false
        }
        PhysicsSystem.instance.raycastResults.forEach((item: PhysicsRayResult) => {
            if (item.collider.node.name.substring(0, 3) != nodeName地图)
                return

            let vec摄像机偏移 = vec.subtract(item.hitPoint)
            console.log('item.hitPoint', item.hitPoint, 'vec摄像机偏移', vec摄像机偏移)
            console.log('this.mainCamera.node.position', this.mainCamera.node.position)
            this.mainCamera.node.setPosition(this.mainCamera.node.position.clone().add(vec摄像机偏移))
            return true
        })
        this.scheduleOnce(this.Clear然后显示小地图视口框, 1)
    }
    是正交投影(): boolean {
        return this.mainCamera.projection == renderer.scene.CameraProjection.ORTHO
    }
    切换镜头投影() {
        this.mainCamera.projection = this.是正交投影() ?
            renderer.scene.CameraProjection.PERSPECTIVE :
            renderer.scene.CameraProjection.ORTHO

        this.scheduleOnce(this.Clear然后显示小地图视口框, 0.1)
    }

    弹丸特效(idEntity: number, idEntityTarget: number, str特效: string): void {
        resources.load(str特效, Prefab, (err, prefab) => {
            if (!prefab) {
                console.log('resources.load callback:', err, prefab, str特效)
                return
            }
            let entity起始 = this.entities.get(idEntity)
            let entity目标 = this.entities.get(idEntityTarget)
            if (!entity起始 || !entity目标) {
                console.log('找不到:', idEntity)
                return
            }

            const newNode = instantiate(prefab)
            newNode.name = str特效.replace('/', '')
            let 配置起始 = MainTest.instance.配置.find战斗(entity起始.类型)
            let 起始位置 = entity起始.position.clone().add3f(0, 配置起始.f弹丸起始高度, 0)
            let 方向向量 = entity目标.position.clone().subtract(entity起始.position).normalize()
            起始位置.add(方向向量.multiplyScalar(3)) // 提前向目标方向移动
            newNode.position = 起始位置
            newNode.eulerAngles = entity起始.eulerAngles
            let 特效根 = this.roles.getChildByName('特效根')
            特效根.addChild(newNode)
            //获取单位战斗配置
            let 配置目标 = MainTest.instance.配置.find单位(entity目标.类型)
            tween(newNode).to(0.1, { position: entity目标.position.clone().add3f(0, 配置目标.受击高度, 0) }).start()
            this.scheduleOnce(() => { 特效根.removeChild(newNode) }, 0.09)
        })
    }


    刷新单位名字() {
        this.entities.forEach((entity: ClientEntityComponent) => {
            entity.显示头顶名字(MainTest.instance.b显示单位类型)
        })
    }

    如果没满级就显示(单位: 单位类型, 属性: 属性类型, node升级按钮: Node) {
        let 单位属性 = this.obj属性等级[单位]
        let 单位攻击等级 = 单位属性 ? 单位属性[属性] : 0
        let 单位属性等级加数值: number = MainTest.instance.配置.find单位属性等级加数值(单位, 属性, 单位攻击等级 + 1)
        if (null != 单位属性等级加数值)
            node升级按钮.active = true
    }
    Set苔蔓半径(idEntity: number, 半径: number) {
        let entity = this.entities.get(idEntity)
        entity.苔蔓半径 = 半径
        entity.view?.getChildByName('苔蔓').getComponent(苔蔓Component).Set半径(半径)
    }
}


