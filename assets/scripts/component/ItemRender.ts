import { EventTouch, Input, Node, _decorator } from 'cc';
import { AutoBind } from './AutoBind';
import { ListType } from './List';
const { ccclass, property } = _decorator;
/**
 * 列表项基类
 */
@ccclass("ItemRender")
export class ItemRender extends AutoBind {
    /**数据 */
    protected _data: any;
    /**选中状态 默认false*/
    protected _selected: boolean = false;

    /**当前项ID，0表示第一项 */
    protected _index: number = -1;
    public own: any;

    public canClick: boolean = true;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    public set index(val: number) {
        this._index = val;
    }

    public get index(): number {
        return this._index;
    }

    /**
     * 刷新
     * @param index 当前项ID
     * @param data   数据
     */
    public set data(value: any) {
        this._data = value;
        this.dataChanged();
    }

    public get data() {
        return this._data;
    }

    /**数据改变 */
    protected dataChanged() {

    }

    protected onClick(evt: EventTouch = null) {
        if (!this.canClick) return;
        if (null != this.own)
            this.own.selectedIndex = this.index;
    }

    public set selected(val: boolean) {
        this._selected = val;
        this.onSelected();
    }

    protected onSelected() {

    }

    // /* 重置嵌套列表scrollview的位置 */
    // protected resetSecondList(): void {
    //     if (this.own && this.own.isSecond) {
    //         if (this.own.type == ListType.Vertical && this.own.scrollView.content.position.y != -this.own.scrollView.view.height / 2) {
    //             this.own.scrollToIndex(0);
    //         } else if (this.own.type == ListType.Horizontal && this.own.scrollView.content.getPosition().x != -this.own.scrollView.view.width / 2) {
    //             this.own.scrollToIndex(0);
    //         }
    //     }
    // }

    public get selected(): boolean {
        return this._selected
    }

    /** item复用时重置状态,在List脚本内调用 */
    public _reset(): void {
        this._data = null;
        this._selected = false;
        this.canClick = true;
        this.index = -1;
    }

    onDestroy() {
        super.onDestroy();
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
        this._data = null;
        this.own = null;
    }
}