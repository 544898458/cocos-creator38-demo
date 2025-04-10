import { RichText } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { 单位类型, 配置, 单位配置 } from '../配置/配置';
import { BattleUI } from '../mode/BattleUI';
import { Enum } from 'cc';
import { EventTouch } from 'cc';
import { Vec2 } from 'cc';
import { string } from 'yaml/dist/schema/common/string';
const { ccclass, property } = _decorator;

export class 按下按钮显示详情Component extends Component {
    @property(BattleUI)
    battleUI: BattleUI
    vec2按下: Vec2
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

            console.log("按钮TOUCH_START", this.enum类型)
            this.battleUI.richEdit按钮详情.string = this.详情()
            this.vec2按下 = event.getLocation()
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



@ccclass('按下按钮显示文本详情')
export class 按下按钮显示文本详情Component extends 按下按钮显示详情Component {
    @property(String)
    str详情: string

    详情(): string {
        return this.str详情
    }
}
