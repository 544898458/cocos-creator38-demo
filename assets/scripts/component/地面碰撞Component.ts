import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

/**
 * 标记组件: 挂在带碰撞体的地面节点上, 用于射线过滤识别地面
 * 代替之前的节点名前缀('map')判断
 */
@ccclass('地面碰撞Component')
export class 地面碰撞Component extends Component {
}
