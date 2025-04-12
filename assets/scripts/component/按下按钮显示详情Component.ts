import { _decorator, Component, Node } from 'cc';
import { BattleUI } from '../mode/BattleUI';
import { Vec2 } from 'cc';
import { EventTouch } from 'cc';
import { Vec3 } from 'cc';
import { UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Component')
export class 按下按钮显示详情Component extends Component {
    @property(BattleUI)
    battleUI: BattleUI
    vec2按下: Vec2 = new Vec2()
    static date上次显示: Date = new Date()
    timeoutId: NodeJS.Timeout = null; // 用于存储 setTimeout 的返回值
    隐藏单位详情(): void {
        if (this.timeoutId){
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
        if (this.battleUI.node按钮详情.active) {
            this.battleUI.node按钮详情.active = false
        }
    }
    start() {
        // 监听按钮的按下事件
        this.node.on(Node.EventType.TOUCH_START, function (event: EventTouch) {
            if (this.battleUI.node按钮详情.active)
                return

            let date现在: Date = new Date()
            //0.2秒内不要重复显示 node按钮详情
            if ((date现在.getTime() - 按下按钮显示详情Component.date上次显示.getTime()) < 300) {
                console.log("间隔太短不显示", this.vec2按下)
                按下按钮显示详情Component.date上次显示 = date现在
                return
            }

            console.log("按钮TOUCH_START", this.vec2按下)
            this.battleUI.richEdit按钮详情.string = this.详情()
            this.vec2按下 = event.getLocation()

            // 将屏幕坐标转换为节点坐标
            let node坐标: Vec3 = this.battleUI.node按钮详情.parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(this.vec2按下.x, this.vec2按下.y, 0));
            console.log("node坐标", node坐标)
            // 设置 node按钮详情 的位置
            let pos = this.battleUI.node按钮详情.position.clone();
            pos.y = node坐标.y + this.node.getComponent(UITransform).height
            this.battleUI.node按钮详情.position = pos
            
            if (this.timeoutId)
                clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.battleUI.node按钮详情.active = true;
                this.timeoutId = null; // 清除定时器 ID
            }, 200);

            //记录当前时刻
            按下按钮显示详情Component.date上次显示 = date现在

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

