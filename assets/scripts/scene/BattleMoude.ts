// file: BattleMoude.ts
import { Component, Node } from 'cc';
import { dispatcher } from '../manager/event/EventDispatcher';
import { MsgId } from '../utils/Enum';
import { Glob } from '../utils/Glob';
import { Vec3 } from 'cc';
import { ClientEntityComponent } from './Scene战斗';


export class BattleMoude extends Component {
    // 单例实例
    private static _instance: BattleMoude;

    public static get instance(): BattleMoude {
        return this._instance;
    }
    public static _arr选中: number[] = [];
    public static _追加选中: boolean = false;
    fun点击地面创建消息: (Vec3) => object = null//this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    fun点击单位创建消息: (entity: ClientEntityComponent, id:number) => object = null//this.createMsgMove强行走//点击地面操作 = 点击地面操作类型.移动单位
    // 单例初始化方法
    public static init(): void {
        if (!BattleMoude._instance) {
            BattleMoude._instance = new BattleMoude();
        }
    }
    arr巡逻点: Vec3[] = null;
    send选中(arr选中: number[]): void {
        BattleMoude._arr选中 = arr选中;

        if (Glob.websocket) {
            dispatcher.sendArray([
                [MsgId.SelectRoles, ++Glob.sendMsgSn, 0],
                arr选中,//虽然是整数，但是也强制转成FLOAT64发出去了
                BattleMoude._追加选中
            ]);
        }
    }
    // 创建通用移动消息
    createMsgMove(hitPoint: Vec3, b遇敌自动攻击: boolean): any[] | null {
        if (BattleMoude._arr选中.length === 0) return null;

        return [
            [MsgId.Move, 0],
            [hitPoint.x, hitPoint.y, hitPoint.z],
            b遇敌自动攻击
        ];
    }

    // 遇敌自动攻击模式下的移动消息
    createMsgMove遇敌自动攻击(hitPoint: Vec3): any[] | null {
        return this.createMsgMove(hitPoint, true);
    }

    // 强行走模式下的移动消息
    createMsgMove强行走(hitPoint: Vec3): any[] | null {
        return this.createMsgMove(hitPoint, false);
    }
}