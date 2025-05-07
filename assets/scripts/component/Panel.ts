
import { Node, Widget } from "cc";
import { EC } from "../utils/EC";
import { dispatcher, EventDispatcher } from "../manager/event/EventDispatcher";
import { AutoBind } from "./AutoBind";
import { List } from "./List";

interface DotTabCache {
    /** 标签存储对象 */
    tab: List;
    /** 标签数组对应的类型 */
    types: Array<string>;
}
export class Panel extends AutoBind {
    /** 事件管理数组 */
    private _autoEvents: any[];

    /** 存储类型 - 标签对象 */
    private tabTypes: DotTabCache = {} as DotTabCache;
    /** 存储类型 - 红点对象数组 */
    private dotTypes: { [type: string]: Node[] } = {};

    /** 子页面是否初始化 */
    _subPageInit: boolean = false;
    /** 子页面透传参数 */
    subPageData: any;

    start(): void {
        super.start();
        this._subPageInit = true;
        this.pageOpened(this.subPageData);
    }

    /** 子页面初始化 */
    pageInit(data?: any): void {
        this.subPageData = data;
        if (this._subPageInit) {
            this.pageOpened(data);
        }
    }

    /** 页面打开完成后，调用此方法 */
    pageOpened(param?: any): void {

    }

    /** 
     * 更新界面显示时用
     * 子类覆盖
     */
    public refreshPanel(data?: any): void {

    }

    /**
     * 使用 Glob.eventDispatcher 对象注册指定类型的事件侦听器对象，以使侦听器能够接收事件通知。自动销毁
     * @param sp 控件
     * @param event 事件的类型。
     * @param caller 事件侦听函数的执行域。
     * @param listener 事件侦听函数。
     * @param args (可选)事件侦听函数的回调参数。
     * @returns 
     */
    private onAutoEvt<T extends EventDispatcher>(sp: T, type: string, listener: Function, caller: any, args?: any[]): Panel {
        let data = [sp, type, listener, caller];
        data[0].on(data[1], data[2], data[3], args);
        this._autoEvents = this._autoEvents || [];
        //过滤已经添加的事件
        if (!this._autoEvents.some(val => val[0] == sp && val[1] == type && val[2] == listener && val[3] == caller)) {
            this._autoEvents.push(data);
        }
        // this._autoEvents.push(data);
        return this;
    }

    /**
     * 功能模块之间的事件监听
     */
    onAutoGlobEvt(type: string, listener: Function, caller: any, args?: any[]): Panel {
        return this.onAutoEvt(dispatcher, type, listener, caller, args);
    }

    /**
     * 网络模块的事件监听
     */
    //TODO
    // onAutoNetEvt(type: string, listener: Function, caller: any, args?: any[]): Panel {
    //     return this.onAutoEvt(Net.dispatcher, type, listener, caller, args);
    // }

    /**
     * 清除所有事件
     * @returns 
     */
    public offAutoEvt() {
        if (!this._autoEvents) return;
        for (let i = 0, len = this._autoEvents.length; i < len; i++) {
            let data = this._autoEvents[i];
            data[0].off(data[1], data[2], data[3]);
        }
        this._autoEvents = null;
    }



    onDestroy(): void {
        this.offAutoEvt();
        super.onDestroy();
    }
}