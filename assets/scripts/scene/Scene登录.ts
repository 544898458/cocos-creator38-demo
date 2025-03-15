import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
// import yaml from 'js-yaml/dist/js-yaml.min.js'
import { FollowTarget } from '../mode/FollowTarget'
import { Scene战斗, ClientEntityComponent } from './Scene战斗'
import { KEY_登录名, Main } from '../mode/Main'
import { ProgressBar } from 'cc'
import { EventHandler } from 'cc'
import { AudioClip } from 'cc'
import { AudioSource } from 'cc'
import { assetManager } from 'cc'
import { sys } from 'cc'
import { TextAsset } from 'cc'
import { MsgId } from '../配置/配置'

const { ccclass, property } = _decorator

@ccclass('Scene登录')
export class Scene登录 extends Component {
    
    @property({type: EditBox})
    editBox登录名:EditBox

    @property({ type: Node, displayName: "个人战局列表面板" })
    node个人战局列表面板: Node
    @property({ type: Node, displayName: "个人战局列表" })
    node个人战局列表: Node
    @property({ type: Node, displayName: "个人战局按钮模板" })
    node个人战局按钮模板: Node
    nodeLoginPanel: Node
    nodeSelectSpace: Node
    @property({ type: AudioSource})
    audioSource: AudioSource
    main: Main
    lableMessage: Label
    //加载
    @property(Node)
    loadNode:Node;
    //加载时间
    loadtime:number=0;
    //加载时间总长 1s
    loadlen:number=1;
    onLoad() 
    {
        console.log('onLoad')
        this.nodeSelectSpace = utils.find("Canvas/选择玩法", this.node.parent);
        this.nodeLoginPanel = utils.find("Canvas/LoginPanel", this.node.parent);
        this.lableMessage = utils.find("Canvas/Message", this.node.parent).getComponent(Label)
        //获取常驻节点
        this.main = director.getScene().getChildByName('常驻').getComponent(Main);
        this.main.scene登录 = this
        // this.loadNode.active = true;
        if(this.main.str在线人数)
            this.lableMessage.string = this.main.str在线人数

        if(this.main.websocket)
        {
            this.nodeSelectSpace.active = true
            this.nodeLoginPanel.active = false
        }

        this.editBox登录名.string = sys.localStorage.getItem(KEY_登录名)
    }
    start() {
        console.log('Scene登录.start')

        if(this.main.strHttps登录场景音乐Mp3){
            assetManager.loadRemote(this.main.strHttps登录场景音乐Mp3, (err, clip:AudioClip) => {
                console.log('resources.load callback:', err, clip)
                this.audioSource.stop()
                this.audioSource.clip = clip
                this.audioSource.play()
            })
        }
    }

    update(deltaTime: number) {
        //加载进度条
        if(this.loadtime<this.loadlen)
        this.onloading(deltaTime)
       
    }
    onloading(det:number){
        this.loadtime+=det;
        if(this.loadtime>this.loadlen){
            this.loadNode.active=false;
            return;
        }else{
            this.loadNode.getComponentInChildren(ProgressBar).progress=this.loadtime/this.loadlen
        }
    }
    onClickToggle进Space1(event: Event, customEventData: string) {
        this.main.进Scene战斗('scene战斗', msgpack.encode([[MsgId.进Space, 0, 0], 1]))
    }
    onClickToggle进单人剧情副本(event: Event, customEventData: string) {
        this.main.onClickToggle进训练战()
    }
    onClickToggle进单人防守战(event: Event, customEventData: string) {
        this.main.onClickToggle进防守战()
    }
    onClickToggle进单人攻坚战(event: Event, customEventData: string) {
        this.main.onClick进攻坚战()
    }
    onClickLogin(event: Event, customEventData: string) {
       this.main.onClickLogin(event,customEventData)
    }
    onClick别人的个人战局列表(event: Event, customEventData: string) {
        this.main.onClick获取别人的个人战局列表(event,customEventData)
    }
    onClick别人的多人战局列表(event: Event, customEventData: string) {
        this.main.onClick获取别人的多人战局列表(event,customEventData)
    }
    onClick进入别人的个人战局(event: Event, customEventData: string) {
        this.main.onClick进入别人的个人战局(event,customEventData)
    }
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        this.main.onClick进入别人的多人战局(event,customEventData)
    }
    onClick创建四方对战(event: Event, customEventData: string) {
        this.main.onClick创建四方对战()
    }
    onClick返回主界面(event: Event, customEventData: string) {
        this.nodeSelectSpace.active = true
        this.node个人战局列表面板.active = false
    }
    显示战局列表(arrPlayer: string[][], handler:string) {
        this.nodeSelectSpace.active = false
        this.node个人战局列表面板.active = true
        this.node个人战局列表.removeAllChildren()

        for( let arrNikcScene of arrPlayer)
        {
            let nickName = arrNikcScene[0]
            let sceneName = arrNikcScene[1]
            let node按钮 = instantiate(this.node个人战局按钮模板)
            node按钮.active = true
            node按钮.getChildByName('Label').getComponent(Label).string = nickName + ' 的战局'
            let button = node按钮.getComponent(Button)
            const clickEventHandler = new EventHandler();
            clickEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
            clickEventHandler.component = 'Scene登录';// 这个是脚本类名
            clickEventHandler.handler = handler;
            clickEventHandler.customEventData = nickName;
            button.clickEvents.push(clickEventHandler)
            this.node个人战局列表.addChild(node按钮)

            this.main.map玩家场景.set(nickName, sceneName)
        }
    }

    显示登录界面():void
    {
        this.nodeSelectSpace.active = false
        this.node个人战局列表.active = false
        this.nodeLoginPanel.active = true
        if(this.main.websocket)
            this.lableMessage.string = '连接已断开，已回到登录界面'
    }
}


