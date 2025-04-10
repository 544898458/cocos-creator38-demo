import { _decorator, Component, Node } from 'cc';
import { BattleUI } from '../mode/BattleUI';
import { Vec2 } from 'cc';
import { EventTouch } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Component')
export class 按下按钮显示详情Component extends Component {
    @property(BattleUI)
    battleUI: BattleUI
    vec2按下: Vec2
    date上次显示: Date = new Date()
    隐藏单位详情(): void {
        if (this.battleUI.node按钮详情.active) {
            this.battleUI.node按钮详情.active = false
        }
    }
    start() {
        // 监听按钮的按下事件
        this.node.on(Node.EventType.TOUCH_START, function (event: EventTouch) {
            if (this.battleUI.node按钮详情.active)
                return

            let date现在:Date = new Date()
            //0.2秒内不要重复显示 node按钮详情
            if ((date现在.getTime() - this.date上次显示.getTime()) < 200) {
                console.log("间隔太短不显示", this.vec2按下)    
                this.date上次显示 = date现在
                return
            }

            console.log("按钮TOUCH_START", this.vec2按下)
            this.battleUI.richEdit按钮详情.string = this.详情()
            this.vec2按下 = event.getLocation()
            this.battleUI.node按钮详情.active = true

            //记录当前时刻
            this.date上次显示 = date现在

        }, this);

        this.node.on(Node.EventType.TOUCH_MOVE, function (event: EventTouch) {
            console.log("按钮TOUCH_END");
            let 距离起始点 = event.getLocation().subtract(this.vec2按下).lengthSqr()
            if (距离起始点 > 5)
                this.隐藏单位详情()
        }, this);

        this.node.on(Node.EventType.TOUCH_END, function (event) {
            console.log("按钮TOUCH_END");
            this.隐藏单位详情()
        }, this);
    }
}

