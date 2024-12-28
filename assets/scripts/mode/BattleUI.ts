import { _decorator, Component } from 'cc';
import { UiLogin } from './UiLogin';
import { director } from 'cc';
import { Scene战斗 } from '../scene/Scene战斗';
import { Label } from 'cc';
import { EditBox } from 'cc';
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
    start() {
        this.uiLogin = director.getScene().getChildByName('常驻').getComponent(UiLogin);
        this.uiLogin.scene战斗 = this.scene战斗;
    }

    update(deltaTime: number) {
        
    }
    //设置
    onSetting(event: Event, customEventData: string){
        this.scene战斗.lableMessageVoice.string="功能待开发"
    }
    on强行走(event: Event, customEventData: string){
        this.scene战斗.b强行走 = true
    }
    on框选(event: Event, customEventData: string){
        this.scene战斗.posWorld框选起始点 = null
        this.scene战斗.b框选等待按下起始点 = true
        this.scene战斗.lableMessageVoice.string ='请在地面上拖动框选'
    }
    on聊天框输入结束(editbox:EditBox, customEventData:String)
    {
        console.log(editbox, customEventData)
        this.uiLogin.onClickSay(editbox.textLabel.string)
    }
    //取消选择
    onClick取消选中(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.scene战斗.clear选中()
        this.uiLogin.send选中([])
    }
    //退出
    onClick退出此场景(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.uiLogin.send离开Space()
    }
    //造兵
    onClickAdd兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵(event,customEventData)
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.uiLogin.onClick造坦克(event,customEventData)
    }
    //造近战
    onClickAdd近战兵(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd近战兵(event,customEventData)
    }
    //造工程车
    onClickAdd工程车(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd工程车(event,customEventData)
    }
    //造基地
    onClickAdd基地(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd基地(event,customEventData)
    }
    //造地堡
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd地堡(event,customEventData)
    }
    //造兵厂
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd兵厂(event,customEventData)
    }
    //造民房
    onClickAdd民房(event: Event, customEventData: string): void {
        this.uiLogin.onClickAdd民房(event,customEventData)
    }
    //造机关枪
    onClickAdd机关枪(event: Event, customEventData: string): void {
        this.scene战斗.lableMessage.string="功能待开发"
    }
}


