// file: BattleMoude.ts
import { Component, Node } from 'cc';
import { MainTest } from '../MainTest';
import { dispatcher } from '../manager/event/EventDispatcher';
import { MsgId } from '../utils/Enum';
import { Glob } from '../utils/Glob';
import { director } from 'cc';


export class BattleMoude extends Component {
    // 单例实例
    private static _instance: BattleMoude;

    public static get instance(): BattleMoude {
        return this._instance;
    }
    public static _arr选中: number[] = [];
    public static _追加选中: boolean = false;
    // 单例初始化方法
    public static init(): void {
        if (!BattleMoude._instance) {
            BattleMoude._instance = new BattleMoude();
        }
    }
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

    set追加选中(value: boolean): void {
        BattleMoude._追加选中 = value;
    }

    get选中(): number[] {
        return BattleMoude._arr选中;
    }
}