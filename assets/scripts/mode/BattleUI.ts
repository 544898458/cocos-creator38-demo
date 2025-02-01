import { _decorator, Component } from 'cc';
import { UiLogin } from './UiLogin';
import { director } from 'cc';
import { Scene战斗 } from '../scene/Scene战斗';
import { Label } from 'cc';
import { EditBox } from 'cc';
import { UITransform } from 'cc';
import { Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BattleUI')
export class BattleUI extends Component {
    uiLogin:UiLogin;
    @property(Scene战斗)
    scene战斗:Scene战斗
    @property({ type: Label, displayName: "数量单位" })
    lableCount: Label
    @property({ type: Label, displayName: "晶体矿" })
    lableCrystal: Label
    @property({ type: Label, displayName: "燃气矿" })
    lableGas: Label
    @property({ type: Label, displayName: "活动单位" })
    lableUnit: Label
    @property({ type: Label, displayName: "消息提示" })
    lable消息提示: Label
    @property({ type: Label, displayName: "语音消息提示" })
    lable语音消息提示: Label
    @property({ type: UITransform, displayName: "所有单位头顶名字" })
    uiTransform所有单位头顶名字: UITransform
    @property({ type: UITransform, displayName: "剧情对话根" })
    uiTransform剧情对话根: UITransform
    @property({ type: Label, displayName: "剧情对话内容" })
    lable剧情对话内容: Label
    @property({ type: Sprite, displayName: "剧情对话头像左" })
    sprite剧情对话头像左  : Sprite
    @property({ type: Sprite, displayName: "剧情对话头像右" })
    sprite剧情对话头像右: Sprite
    start() {
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.uiLogin.scene战斗 = this.scene战斗;
    }

    update(deltaTime: number) {
        
    }
    //设置
    on出地堡(event: Event, customEventData: string){
        this.uiLogin.onClick出地堡()
    }
    on强行走(event: Event, customEventData: string){
        this.scene战斗.b强行走 = true
    }
    on框选(event: Event, customEventData: string){
        this.scene战斗.posWorld框选起始点 = null
        this.scene战斗.b框选等待按下起始点 = true
        this.scene战斗.battleUI.lable消息提示.string ='请在地面上拖动框选'
    }
    on聊天框输入结束(editbox:EditBox, customEventData:String)
    {
        console.log(editbox, customEventData)
        this.uiLogin.onClickSay(editbox.textLabel.string)
    }
    onClick取消选中(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.scene战斗.clear选中()
        this.uiLogin.send选中([])
    }
    onClick退出此场景(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.uiLogin.send离开Space()
    }
    onClick镜头投影(event: Event, customEventData: string) {
        this.scene战斗.切换镜头投影()
    }
    onClick镜头放大(event: Event, customEventData: string) {
        this.scene战斗.镜头放大()
    }
    onClick镜头缩小(event: Event, customEventData: string) {
        this.scene战斗.镜头缩小()
    }
    onClickAdd兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵(event,customEventData)
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.uiLogin.onClick造坦克(event,customEventData)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd近战兵(event,customEventData)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd工程车(event,customEventData)
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd基地(event,customEventData)
    }
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd地堡(event,customEventData)
    }
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵厂(event,customEventData)
    }
    onClickAdd民房(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd民房(event,customEventData)
    }
    onClickAdd光子炮(event: Event, customEventData: string): void {
            this.uiLogin.onClickAdd光子炮(event,customEventData)
    }
    onClick空闲工程车(event: Event, customEventData: string): void {
        this.uiLogin.onClick空闲工程车()
    }
    onClick剧情对话全屏点击():void{
        this.uiLogin.onClick剧情对话全屏点击()
        // this.uiTransform剧情对话根.node.active = false
    }
}


