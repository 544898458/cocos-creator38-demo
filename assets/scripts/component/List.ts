import { CCBoolean, CCInteger, Component, Enum, instantiate, Node, Rect, rect, ScrollView, UITransform, Vec2, Vec3, _decorator, isValid } from 'cc';
import { Handler } from '../utils/Handler';
import { ItemRender } from './ItemRender';
const { ccclass, property, requireComponent } = _decorator;

const _temp_vec3 = new Vec3();
const scrollOffset = new Vec2(0, 0);//初始
/**
 * 列表
 * 根据cocos_example的listView改动而来 * 
 *  1.创建cocos的ScrollView组件，添加List，设置List属性即可
 */

/**列表排列方式 */
export enum ListType {
    /**水平排列 */
    Horizontal = 1,
    /**垂直排列 */
    Vertical = 2,
    /**网格排列 */
    Grid = 3
}

/**网格布局中的方向 */
export enum StartAxisType {
    /**水平排列 */
    Horizontal = 1,
    /**垂直排列 */
    Vertical = 2,
}

interface IItemRednerStruct {
    x: number;
    y: number;
    index: number;
}


@ccclass("List")
@requireComponent(ScrollView)
export class List extends Component {
    //==================== 属性面板 =========================
    /**列表选项 */
    @property({ type: Node, tooltip: "列表项" })
    public itemRender: Node = null;

    /**排列方式 */
    @property({ type: Enum(ListType), tooltip: "排列方式" })
    public type: ListType = ListType.Vertical;

    /**网格布局中的方向 */
    @property({ type: Enum(StartAxisType), tooltip: "网格布局中的方向", visible() { return this.type == ListType.Grid } })
    public startAxis: StartAxisType = StartAxisType.Horizontal;

    /**列表项之间X间隔 */
    @property({ type: CCInteger, tooltip: "列表项X间隔", visible() { return (this.type == ListType.Horizontal || this.type == ListType.Grid) } })
    public spaceX: number = 0;

    /**列表项之间Y间隔 */
    @property({ type: CCInteger, tooltip: "列表项Y间隔", visible() { return this.type == ListType.Vertical || this.type == ListType.Grid } })
    public spaceY: number = 0;

    /**上间距 */
    @property({ type: CCInteger, tooltip: "上间距", visible() { return (this.type == ListType.Vertical || this.type == ListType.Grid) } })
    public padding_top: number = 0;

    /**下间距 */
    @property({ type: CCInteger, tooltip: "下间距", visible() { return (this.type == ListType.Vertical || this.type == ListType.Grid) } })
    public padding_buttom: number = 0;

    /**左间距 */
    @property({ type: CCInteger, tooltip: "左间距", visible() { return (this.type == ListType.Horizontal || this.type == ListType.Grid) } })
    public padding_left: number = 0;


    @property(CCInteger)
    public _padding: number = 0;

    /**右间距 */
    @property({ type: CCInteger, tooltip: "右间距", visible() { return (this.type == ListType.Horizontal || this.type == ListType.Grid) } })
    public padding_right: number = 0;

    /** 是否开启虚拟列表（默认开启） 复用item；在setData之前*/
    @property
    public _virtual: boolean = true;

    @property({ type: CCBoolean, tooltip: "是否开启虚拟列表（默认开启） 复用item", displayOrder: 1 })
    public set virtual(value: boolean) {
        this._virtual = value;
    }

    public get virtual(): boolean {
        return this._virtual;
    }

    /** 是否保持上次滚动位置（默认开启）*/
    @property
    public _keepOffset: boolean = true;

    @property({ type: CCBoolean, tooltip: "是否保持上次滚动位置（默认开启）", displayOrder: 1 })
    public set KeepOffset(value: boolean) {
        this._keepOffset = value;
    }

    public get KeepOffset(): boolean {
        return this._keepOffset;
    }

    @property
    public _frameRenderNum: number = 1;

    @property({ type: CCInteger, tooltip: "逐帧渲染时，默认每帧渲染的1个Item", displayOrder: 1 })
    public set frameRenderNum(value: number) {
        this._frameRenderNum = value;
    }

    public get frameRenderNum(): number {
        return this._frameRenderNum;
    }

    /** 是否开启分层渲染（只对item里面的Label组件做处理） 实验性 */
    public isSeparateRender: boolean = false;
    private _updateDone: boolean = true; //分帧渲染是否完成
    private _doneAfterUpdate: boolean = false;
    private _updateCounter: number = 0;//当前分帧渲染帧数
    private startIndex: number = 0;

    //记录item原始位置
    private _itemStruct: { [key: number]: IItemRednerStruct } = {};

    /** scrollView容器世界坐标包围盒 */
    private scrollBoxRect: Rect = null;

    //====================== 滚动容器 ===============================
    /**列表滚动容器 */
    public scrollView: ScrollView = null;
    /**scrollView的内容容器 */
    private content: Node = null;
    /** 视图窗宽 */
    private _viewW: number = 0;
    /** 视图窗高 */
    private _viewH: number = 0;

    //======================== 列表项 ===========================
    /**列表项数据 */
    private itemDataList: Array<any> = [];
    /**应创建的实例数量 */
    private spawnCount: number = 0;
    /**存放列表项实例的数组 */
    private itemList: Array<ItemRender> = [];
    /**item的高度 */
    private itemHeight: number = 0;
    /**item的宽度 */
    private itemWidth: number = 0;
    /**存放不再使用中的列表项 */
    private itemPool: Array<ItemRender> = [];

    //======================= 计算参数 ==========================
    /**距离scrollView中心点的距离，超过这个距离的item会被重置，一般设置为 scrollVIew.height/2 + item.heigt/2 + space，因为这个距离item正好超出scrollView显示范围 */
    private halfScrollView: number = 0;
    /**上一次content的X值，用于和现在content的X值比较，得出是向左还是向右滚动 */
    private lastContentPosX: number = 0;
    /**上一次content的Y值，用于和现在content的Y值比较，得出是向上还是向下滚动 */
    private lastContentPosY: number = 0;
    /**网格行数 */
    private gridRow: number = 0;
    /**网格列数 */
    private gridCol: number = 0;
    /**刷新时间，单位s */
    private updateTimer: number = 0;
    /**刷新间隔，单位s */
    private updateInterval: number = 0.1;
    /**是否滚动容器 */
    private bScrolling: boolean = false;
    /**刷新的函数 */
    private updateFun: Function = null;

    private itemUITrans: UITransform;
    public contentUITrans: UITransform;

    private _selectedItem: ItemRender = new ItemRender();
    private _selectedIndex: number = -1;
    private firstSelectTag: boolean = false;

    /**选中事件 */
    private _selectHander: Handler;
    private _selectBefore: Handler; //return true 则可选中

    /* 打开List的自动滚动开关功能 */
    private _autoScroll: boolean = false;

    onLoad() {
        let t = this;
        t.itemUITrans = t.itemRender.getComponent(UITransform);
        t.itemHeight = t.itemUITrans.height;
        t.itemWidth = t.itemUITrans.width;

        t.scrollView = t.node.getComponent(ScrollView);
        t.content = t.scrollView.content;
        t.contentUITrans = t.content.getComponent(UITransform);
        t.contentUITrans.setAnchorPoint(0, 1);

        t._viewW = t.scrollView.view.width;
        t._viewH = t.scrollView.view.height;

        // ScrollView 可视区域在世界坐标系中的矩形（碰撞盒）
        const rect1_o = this._get_bounding_box_to_world(this.scrollView.content.parent);
        // ------------------保险范围--------------------------
        rect1_o.width += rect1_o.width * 0.5;
        rect1_o.height += rect1_o.height * 0.5;
        rect1_o.x -= rect1_o.width * 0.25;
        rect1_o.y -= rect1_o.height * 0.25;
        t.scrollBoxRect = rect1_o

        t.content.removeAllChildren();
        t.scrollView.node.on(ScrollView.EventType.SCROLLING, t.onScrolling, t);
    }

    /**获取在世界坐标系下的节点包围盒(不包含自身激活的子节点范围) */
    private _get_bounding_box_to_world(node_o_: Node): Rect {
        const _contentSize = node_o_.getComponent(UITransform);
        let w_n: number = _contentSize.width;
        let h_n: number = _contentSize.height;
        let rect_o = rect(
            -_contentSize.anchorX * w_n,
            -_contentSize.anchorY * h_n,
            w_n,
            h_n
        );
        node_o_.updateWorldTransform();
        rect_o.transformMat4(node_o_.worldMatrix);
        return rect_o;
    }

    /**检测碰撞 */
    private _check_collision(node_o_: Node): boolean {
        let rect2_o = this._get_bounding_box_to_world(node_o_);
        return this.scrollBoxRect.intersects(rect2_o);
    }

    /**
     * 列表数据 (列表数据复制使用，如果列表数据改变，则需要重新设置一遍数据)
     * @param {Array<any>} itemDataList item数据列表
     * @param {number} startIndex item的起始索引 （如需打开界面时移动到第n个item位置时，可设置startIndex）
     */
    public setData(itemDataList: Array<any>, startIndex?: number) {
        this.itemDataList = itemDataList.slice();
        this.firstSelectTag = false;
        if (startIndex != null) {
            startIndex -= 1;
            this.startIndex = Math.max(startIndex, 0);
        }
        if (this.contentUITrans) {
            this.updateContent();
        }
    }

    /**计算列表的各项参数 */
    private countListParam() {
        let t = this;
        let dataLen = t.itemDataList.length;
        let newW = t._viewW;
        let newH = t._viewH;
        const scrollUITrans = t.scrollView.getComponent(UITransform);
        if (t.type == ListType.Vertical) {
            t.scrollView.horizontal = false;
            t.scrollView.vertical = true;

            newH = dataLen * t.itemHeight + (dataLen - 1) * t.spaceY + t.padding_top + t.padding_buttom;
            t.spawnCount = !t.virtual ? dataLen : Math.ceil(scrollUITrans.height / (t.itemHeight + t.spaceY)) + 2; //计算创建的item实例数量，比当前scrollView容器能放下的item数量再加上2个
            t.halfScrollView = scrollUITrans.height / 2 + t.itemHeight / 2 + t.spaceY; //计算bufferZone，item的显示范围
            t.updateFun = t.virtual ? t.updateV : t.updateScrollView999;
        } else if (t.type == ListType.Horizontal) {
            t.scrollView.horizontal = true;
            t.scrollView.vertical = false;
            newW = dataLen * t.itemWidth + (dataLen - 1) * t.spaceX + t.padding_left + t.padding_right;
            t.spawnCount = !t.virtual ? dataLen : Math.ceil(scrollUITrans.width / (t.itemWidth + t.spaceX)) + 2;
            t.halfScrollView = scrollUITrans.width / 2 + t.itemWidth / 2 + t.spaceX;
            t.updateFun = t.virtual ? t.updateH : t.updateScrollView999;
        } else if (t.type == ListType.Grid) {
            if (t.startAxis == StartAxisType.Vertical) {
                t.scrollView.horizontal = false;
                t.scrollView.vertical = true;
                //如果left和right间隔过大，导致放不下一个item，则left和right都设置为0，相当于不生效
                if (t.padding_left + t.padding_right + t.itemWidth + t.spaceX > newW) {
                    t.padding_left = 0;
                    t.padding_right = 0;
                    console.error("padding_left或padding_right过大");
                }

                t.gridCol = Math.floor((newW + t.spaceX - t.padding_left - t.padding_right) / (t.itemWidth + t.spaceX));
                t.gridRow = Math.ceil(dataLen / t.gridCol);
                newH = t.gridRow * t.itemHeight + (t.gridRow - 1) * t.spaceY + t.padding_top + t.padding_buttom;
                t.spawnCount = !t.virtual ? dataLen : Math.ceil(scrollUITrans.height / (t.itemHeight + t.spaceY)) * t.gridCol + t.gridCol * 2;
                // 缓冲区域，半屏加1个item高度
                t.halfScrollView = scrollUITrans.height / 2 + t.itemHeight / 2 + t.spaceY;
                t.updateFun = t.virtual ? t.updateGrid_V : t.updateScrollView999;
            } else if (t.startAxis == StartAxisType.Horizontal) {
                t.scrollView.horizontal = true;
                t.scrollView.vertical = false;
                //计算高间隔
                //如果left和right间隔过大，导致放不下一个item，则left和right都设置为0，相当于不生效
                if (t.padding_top + t.padding_buttom + t.itemHeight + t.spaceY > newH) {
                    t.padding_top = 0;
                    t.padding_buttom = 0;
                    console.error("padding_top或padding_buttom过大");
                }

                t.gridRow = Math.floor((newH + t.spaceY - t.padding_top - t.padding_buttom) / (t.itemHeight + t.spaceY));
                t.gridCol = Math.ceil(dataLen / t.gridRow);
                newW = t.gridCol * t.itemWidth + (t.gridCol - 1) * t.spaceX + t.padding_left + t.padding_right;
                t.spawnCount = !t.virtual ? dataLen : Math.ceil(scrollUITrans.width / (t.itemWidth + t.spaceX)) * t.gridRow + t.gridRow * 2;
                t.halfScrollView = scrollUITrans.width / 2 + t.itemWidth / 2 + t.spaceX;
                t.updateFun = t.virtual ? t.updateGrid_H : t.updateScrollView999;
            }
        }
        if (!t.KeepOffset) {
            t.content.setPosition(-t._viewW / 2, t._viewH / 2);
            t.scrollView.stopAutoScroll();
            t.scrollView.scrollToTop();//回到顶部
        }
        t.contentUITrans.setContentSize(newW, newH);

        //记录原始坐标
        for (let i = 0; i < t.itemDataList.length; ++i) {
            let _x: number = 0;
            let _y: number = 0;
            if (t.type == ListType.Vertical) {
                _x = t.contentUITrans.width / 2;
                _y = -t.itemUITrans.height * (0.5 + i) - t.spaceY * i - t.padding_top;
            } else if (t.type == ListType.Horizontal) {
                _x = t.itemUITrans.width * (0.5 + i) + t.spaceX * i + t.padding_left;
                _y = -t.contentUITrans.height / 2;
            } else if (t.type == ListType.Grid) {
                if (t.startAxis == StartAxisType.Vertical) {
                    var row = Math.floor(i / t.gridCol);
                    var col = i % t.gridCol;
                    _x = t.itemUITrans.width * (0.5 + col) + t.spaceX * col + t.padding_left;
                    _y = -t.itemUITrans.height * (0.5 + row) - t.spaceY * row - t.padding_top;
                } else if (t.startAxis == StartAxisType.Horizontal) {
                    var row = i % t.gridRow;
                    var col = Math.floor(i / t.gridRow);
                    _x = t.itemUITrans.width * (0.5 + col) + t.spaceX * col + t.padding_left;
                    _y = -t.itemUITrans.height * (0.5 + row) - t.spaceY * row - t.padding_top;
                }
            }
            let struct = t._itemStruct[i];
            if (!struct) {
                struct = Object.create(<IItemRednerStruct>{});
                t._itemStruct[i] = struct;
            }
            struct.index = i;
            struct.x = _x;
            struct.y = _y;
        }
    }

    /**
     * 创建列表
     * @param startIndex 起始显示的数据索引 0表示第一项
     * @param offset     scrollView偏移量
     */
    private createList(startIndex: number, offset: Vec2) {
        //当需要显示的数据长度 > 虚拟列表长度， 删除最末尾几个数据时，列表需要重置位置到scrollView最底端
        let t = this;

        if (t.itemDataList.length > t.spawnCount && (startIndex + t.spawnCount - 1) >= t.itemDataList.length) {
            startIndex = t.itemDataList.length - t.spawnCount;
            offset = t.scrollView.getMaxScrollOffset();
            //当需要显示的数据长度 <= 虚拟列表长度， 隐藏多余的虚拟列表项
        } else if (t.itemDataList.length <= t.spawnCount) {
            startIndex = 0;
        }

        let item = null;
        let len = t.itemList.length;
        if (len > (t.itemDataList.length - startIndex)) {
            for (let j = len - 1, len2 = t.itemDataList.length; j >= len2; --j) {
                item = t.itemList.pop();
                if (null != item) {
                    item.node.removeFromParent();
                    //回收清状态
                    item._reset();
                    t.itemPool.unshift(item);
                }
            }
        }

        t.startIndex = startIndex;
        if (t.virtual) {
            if (t.frameRenderNum > 0) {//大于0 进行分帧加载item
                //逐帧渲染
                if (t.itemDataList.length > 0) {
                    if (!t._updateDone) {
                        t._doneAfterUpdate = true;
                    } else {
                        t._updateCounter = 0;
                    }
                    t._updateDone = false;
                } else {
                    t._updateCounter = 0;
                    t._updateDone = true;
                }
            } else {
                //直接渲染
                for (let n: number = 0; n < t.spawnCount; ++n) {
                    t.renderItem(n);
                }
            }
        } else {
            if (t.frameRenderNum > 0) {
                //先渲染几个出来
                let len: number = t.frameRenderNum > t.itemDataList.length ? t.itemDataList.length : t.frameRenderNum;
                for (let n: number = 0; n < len; n++) {
                    t.renderItem(n);
                }
                if (t.frameRenderNum < t.itemDataList.length) {
                    t._updateCounter = t.frameRenderNum;
                    t._updateDone = false;
                }
            } else {
                //直接渲染
                for (let n: number = 0; n < t.spawnCount; ++n) {
                    t.renderItem(n);
                }
            }
        }

        if (t._keepOffset) {
            t.scrollView.scrollToOffset(offset);
        }
    }

    onScrolling() {
        this.bScrolling = true;
        if (this._autoScroll == true) {
            if (this.updateFun) {
                this.updateFun();
            }
        }
    }

    protected update(dt) {
        if (this.frameRenderNum > 0 && !this._updateDone) {
            if (this.virtual) {//是否是虚拟列表
                let len: number = (this._updateCounter + this.frameRenderNum) > this.spawnCount ? this.spawnCount : (this._updateCounter + this.frameRenderNum);
                for (let n: number = this._updateCounter; n < len; n++) {
                    this.renderItem(n)
                }
                if (this._updateCounter >= this.spawnCount - 1) { //最后一个
                    if (this._doneAfterUpdate) {
                        this._updateCounter = 0;
                        this._updateDone = false;
                        this._doneAfterUpdate = false;
                    } else {
                        this._updateDone = true;
                    }
                } else {
                    this._updateCounter += this.frameRenderNum;
                }
            } else {
                if (this._updateCounter < this.itemDataList.length) {
                    let len: number = (this._updateCounter + this.frameRenderNum) > this.itemDataList.length ? this.itemDataList.length : (this._updateCounter + this.frameRenderNum);
                    for (let n: number = this._updateCounter; n < len; n++) {
                        this.renderItem(n);
                    }
                    this._updateCounter += this.frameRenderNum;
                } else {
                    this._updateDone = true;
                }
            }
        }

        if (this._autoScroll == true) {
            //TODO 在自动滚动过程中，如果用户手动拖动列表，则停止自动滚动
            if (!this.scrollView.isAutoScrolling() || this.scrollView.isScrolling()) {
                this._autoScroll = false;
                this.scrollView.stopAutoScroll();
                if (this.updateFun) {
                    this.updateFun();
                }
            }
            return;
        }

        if (this.bScrolling == false) {
            return;
        }
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval) {
            return;
        }
        this.updateTimer = 0;
        this.bScrolling = false;
        if (this.updateFun) {
            this.updateFun();
        }
    }

    private renderItem(index: number): void {
        let t = this;
        let startIndex: number = t.startIndex;
        let item: ItemRender = null;
        //需要显示的数据索引在数据范围内，则item实例显示出来
        if (index + startIndex < t.itemDataList.length) {
            if (t.itemList[index] == null) {
                item = t.getItem();
                t.itemList.unshift(item);
                item.node.parent = t.content;
            } else {
                item = t.itemList[index];
            }
            //需要显示的数据索引超过了数据范围，则item实例隐藏起来
        } else {
            //item实例数量 > 需要显示的数据量
            if (t.itemList.length > (t.itemDataList.length - startIndex)) {
                item = t.itemList.pop();
                if (null != item) {
                    item.node.removeFromParent();
                    //回收清状态
                    item._reset();
                    t.itemPool.unshift(item);
                }
            }
            return;
        }


        const renderIndex: number = index + (t.KeepOffset ? startIndex : 0);
        let struct = t._itemStruct[renderIndex];
        item.node.setPosition(struct.x, struct.y);
        item.index = renderIndex;
        const itemData: any = this.itemDataList[item.index];

        if (this.type == ListType.Grid && (this.startAxis == StartAxisType.Vertical || this.startAxis == StartAxisType.Horizontal)) {
            item.node.active = true;
        }

        if (!t.virtual) {
            // let itemBox = item.node.getComponent(UITransform).getBoundingBoxToWorld();
            // if (this.scrollView.getComponent(UITransform).getBoundingBoxToWorld().intersects(itemBox)) {
            if (t._check_collision(item.node)) {
                item['_selected'] = this._selectedIndex == item.index;
                item.data = itemData;
                item.node.active = true;
            } else {
                item.node.active = false;
            }
        } else {
            //TODO updateListItem 选中状态
            item['_selected'] = this._selectedIndex == item.index;
            item.data = itemData;
        }

        if (this._selectHander && (!this.selectedItem || this.selectedItem.index != item.index) && !this.firstSelectTag) {
            this.firstSelectTag = true;
            this.selectedIndex = this._selectedIndex;
        }

    }

    /**垂直排列 */
    private updateV() {
        let items = this.itemList;
        let item: ItemRender;
        let bufferZone = this.halfScrollView;
        if (this.content.position.y == this.lastContentPosY) return;
        let isUp = this.content.position.y > this.lastContentPosY;
        let offset = (this.itemHeight + this.spaceY) * items.length;
        for (let i = 0; i < items.length; i++) {
            item = items[i];
            // item.node.getPosition(_temp_vec3);
            let viewPos = this.getPositionInView(item);
            let tempIndex = 0;
            if (isUp) {
                //item上滑时，超出了scrollView上边界，将item移动到下方复用，item移动到下方的位置必须不超过content的下边界
                if (viewPos.y > bufferZone && this._itemStruct[item.index].y - offset - this.padding_buttom > -this.contentUITrans.height) {
                    tempIndex = item.index + items.length;
                    item._reset();
                    item.index = tempIndex;
                    //复用item渲染时重置itemRender的选中状态
                    item['_selected'] = this._selectedIndex == tempIndex;
                    item.data = this.itemDataList[tempIndex];
                    // _temp_vec3.y -= offset;
                    item.node.setPosition(this._itemStruct[tempIndex].x, this._itemStruct[tempIndex].y);
                }
            } else {
                //item下滑时，超出了scrollView下边界，将item移动到上方复用，item移动到上方的位置必须不超过content的上边界
                if (viewPos.y < -bufferZone && this._itemStruct[item.index].y + offset + this.padding_top < 0) {
                    tempIndex = item.index - items.length;
                    item._reset();
                    item.index = tempIndex;
                    item['_selected'] = this._selectedIndex == tempIndex;
                    item.data = this.itemDataList[tempIndex];
                    // _temp_vec3.y += offset;
                    item.node.setPosition(this._itemStruct[tempIndex].x, this._itemStruct[tempIndex].y);
                }
            }
        }
        this.lastContentPosY = Math.floor(this.scrollView.content.position.y);
    }

    /**水平排列 */
    private updateH() {
        let items = this.itemList;
        let item: ItemRender;
        let bufferZone = this.halfScrollView;
        if (this.content.position.x == this.lastContentPosX) return;
        let isRight = this.content.position.x > this.lastContentPosX;
        let offset = (this.itemWidth + this.spaceX) * items.length;
        for (let i = 0; i < items.length; i++) {
            item = items[i];
            // item.node.getPosition(_temp_vec3);
            let viewPos = this.getPositionInView(item);
            let tempIndex = 0;
            if (isRight) {
                tempIndex = item.index - items.length;
                //item右滑时，超出了scrollView右边界，将item移动到左方复用，item移动到左方的位置必须不超过content的左边界
                if (viewPos.x > bufferZone && this._itemStruct[item.index].x - offset - this.padding_left > 0) {
                    item._reset();
                    item.index = tempIndex;
                    //复用item渲染时重置itemRender的选中状态
                    item['_selected'] = this._selectedIndex == tempIndex;
                    item.data = this.itemDataList[tempIndex];
                    // _temp_vec3.x -= offset;
                    // item.node.setPosition(_temp_vec3);
                    item.node.setPosition(this._itemStruct[tempIndex].x, this._itemStruct[tempIndex].y);
                }
            } else {
                //item左滑时，超出了scrollView左边界，将item移动到右方复用，item移动到右方的位置必须不超过content的右边界
                if (viewPos.x < -bufferZone && this._itemStruct[item.index].x + offset + this.padding_right < this.contentUITrans.width) {
                    tempIndex = item.index + items.length;
                    item._reset();
                    item.index = tempIndex;
                    //复用item渲染时重置itemRender的选中状态
                    item['_selected'] = this._selectedIndex == tempIndex;
                    item.data = this.itemDataList[tempIndex];
                    // _temp_vec3.x += offset;
                    // item.node.setPosition(_temp_vec3);
                    item.node.setPosition(this._itemStruct[tempIndex].x, this._itemStruct[tempIndex].y);
                }
            }
        }
        this.lastContentPosX = Math.floor(this.scrollView.content.position.x);
    }

    /**网格垂直排列 */
    private updateGrid_V() {
        let items = this.itemList;
        let item: ItemRender;
        let bufferZone = this.halfScrollView;
        if (this.content.position.y == this.lastContentPosY) return;
        let isUp = this.content.position.y > this.lastContentPosY;
        let offset = (this.itemHeight + this.spaceY) * (this.spawnCount / this.gridCol);
        for (let i = 0; i < items.length; i++) {
            item = items[i];
            item.node.getPosition(_temp_vec3);
            let viewPos = this.getPositionInView(item);
            let tempIndex = 0;
            if (isUp) {
                //item上滑时，超出了scrollView上边界，将item移动到下方复用，item移动到下方的位置必须不超过content的下边界
                if (viewPos.y > bufferZone && _temp_vec3.y - offset - this.padding_buttom > -this.contentUITrans.height) {
                    tempIndex = item.index + (this.spawnCount / this.gridCol) * this.gridCol;
                    item._reset();
                    item['_selected'] = this._selectedIndex == tempIndex;
                    if (this.itemDataList[tempIndex] != null) {
                        item.data = this.itemDataList[tempIndex];
                        item.node.active = true;
                    } else {
                        item.node.active = false;
                    }
                    item.index = tempIndex;
                    _temp_vec3.y -= offset
                    item.node.setPosition(_temp_vec3);

                }
            } else {//item下滑时，超出了scrollView下边界，将item移动到上方复用，item移动到上方的位置必须不超过content的上边界
                if (viewPos.y < -bufferZone && _temp_vec3.y + offset + this.padding_top < 0) {
                    tempIndex = item.index - (this.spawnCount / this.gridCol) * this.gridCol;
                    item._reset();
                    item['_selected'] = this._selectedIndex == tempIndex;
                    if (this.itemDataList[tempIndex] != null) {
                        item.data = this.itemDataList[tempIndex];
                        item.node.active = true;
                    } else {
                        item.node.active = false;
                    }
                    item.index = tempIndex;
                    _temp_vec3.y += offset
                    item.node.setPosition(_temp_vec3);
                }
            }
        }
        this.lastContentPosY = Math.floor(this.scrollView.content.position.y);
    }

    /**网格水平排列 */
    private updateGrid_H() {
        let items = this.itemList;
        let item: ItemRender;
        let bufferZone = this.halfScrollView;
        if (this.content.position.x == this.lastContentPosX) return;
        let isRight = this.content.position.x > this.lastContentPosX;
        let offset = (this.itemWidth + this.spaceX) * (this.spawnCount / this.gridRow);
        for (let i = 0; i < items.length; i++) {
            item = items[i];
            item.node.getPosition(_temp_vec3);
            let viewPos = this.getPositionInView(item);
            let tempIndex = 0;
            if (isRight) {
                //item右滑时，超出了scrollView右边界，将item移动到左方复用，item移动到左方的位置必须不超过content的左边界
                if (viewPos.x > bufferZone && _temp_vec3.x - offset - this.padding_left > 0) {
                    tempIndex = item.index - (this.spawnCount / this.gridRow) * this.gridRow;
                    item._reset();
                    item['_selected'] = this._selectedIndex == tempIndex;
                    if (this.itemDataList[tempIndex] != null) {
                        item.data = this.itemDataList[tempIndex];
                        item.node.active = true;
                        item.index = tempIndex;
                    } else {
                        item.node.active = false;
                    }
                    _temp_vec3.x -= offset;
                    item.node.setPosition(_temp_vec3);


                }
            } else {
                //item左滑时，超出了scrollView左边界，将item移动到右方复用，item移动到右方的位置必须不超过content的右边界
                if (viewPos.x < -bufferZone && _temp_vec3.x + offset + this.padding_right < this.contentUITrans.width) {
                    tempIndex = item.index + (this.spawnCount / this.gridRow) * this.gridRow;
                    item._reset();
                    item['_selected'] = this._selectedIndex == tempIndex;
                    if (this.itemDataList[tempIndex] != null) {
                        item.data = this.itemDataList[tempIndex];
                        item.node.active = true;
                    } else {
                        item.node.active = false;
                    }
                    item.index = tempIndex;
                    _temp_vec3.x += offset;
                    item.node.setPosition(_temp_vec3);
                }
            }
            this.lastContentPosX = Math.floor(this.scrollView.content.position.x);
        }
    }

    private updateScrollView999(): void {
        let len = this.itemList.length;
        for (let i = 0; i < len; ++i) {
            let item = this.itemList[i];
            // let itemBox = item.node.getComponent(UITransform).getBoundingBoxToWorld();
            // if (this.scrollView.getComponent(UITransform).getBoundingBoxToWorld().intersects(itemBox)) {
            if (this._check_collision(item.node)) {
                item['_selected'] = this._selectedIndex == item.index;
                if (item.data == null && this.itemDataList[item.index]) {
                    item.data = this.itemDataList[item.index];
                }
                item.node.active = true;
            } else {
                item.node.active = false;
            }
        }
    }

    /**获取item在scrollView的局部坐标 */
    private getPositionInView(item: ItemRender) {
        let worldPos = item.node.parent.getComponent(UITransform).convertToWorldSpaceAR(item.node.position);
        let viewPos = this.scrollView.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        return viewPos;
    }


    /**获取一个列表项 */
    private getItem(): ItemRender {
        if (this.itemPool.length == 0) {
            let item = instantiate(this.itemRender).getComponent(ItemRender);
            item.own = this;
            return item;
        } else {
            return this.itemPool.pop();
        }
    }

    /**获取列表数据 */
    public getListData() {
        return this.itemDataList;
    }

    /** 根据索引获取列表render */
    public getItemRenderByIndex(index: number): ItemRender {
        for (var render of this.itemList) {
            if (render.index == index) {
                return render;
            }
        }
        return null;
    }

    /**
     * 增加一项数据到列表的末尾
     * @param data 数据
     */
    public addItem(data: any) {
        this.itemDataList.push(data);
        this.updateContent();
    }

    public set selectedIndex(idx: number) {
        let t = this;
        if (t.firstSelectTag && (t._selectBefore && !t._selectBefore.runWith(idx))) {
            return;
        }
        if (t._selectedItem && t._selectedItem.index != -1) {
            if (t._selectedItem.index == idx) {
                return;
            } else {
                //重置上一个选中状态
                t._selectedItem.selected = false;
                const tmpTtem: ItemRender = t.getItemRenderByIndex(t._selectedItem.index);
                if (tmpTtem) tmpTtem.selected = false;
            }
        }
        if (idx == -1) {
            t._selectedItem._reset();
            t._selectedIndex = -1;
        } else {
            t._selectedIndex = idx;
            let item: any = t.getItemRenderByIndex(idx);
            if (item) {
                // t.firstSelectTag = true;
                item.selected = true;
                t._selectedItem.selected = true;
                t._selectedItem.data = item.data;
                t._selectedItem.index = item.index;
            }
            if (t._selectHander)
                t._selectHander.runWith([item, idx % t.itemDataList.length]);
        }
    }

    public get selectedIndex(): number {
        return this._selectedIndex;
    }

    public get selectedItem(): ItemRender {
        //item复用会导致selectItem同步变更
        return this._selectedItem.data ? this._selectedItem : null;
    }

    /**
     * 滑动到指定位置, 百分比移动
     * @param index [0 ~ end];
     * @param duration 
     */
    public scrollToIndex(index: number, duration: number = 0.3) {
        const contentUTF = this.contentUITrans;
        let percent: number = 0;
        if (this.type == ListType.Horizontal || (this.type == ListType.Grid && this.startAxis == StartAxisType.Horizontal)) {
            //TODO t.padding_left , t.padding_right
            percent = ((this.itemWidth + this.spaceX) * index) / (contentUTF.width - this._viewW);
            percent = percent > 1 ? 1 : percent;
            this.scrollView.scrollToPercentHorizontal(percent, duration, true);
        } else if (this.type == ListType.Vertical || (this.type == ListType.Grid && this.startAxis == StartAxisType.Vertical)) {
            //TODO 是否需计算? t.padding_top , t.padding_buttom
            percent = ((this.itemHeight + this.spaceY) * index) / (contentUTF.height - this._viewH);
            percent = percent > 1 ? 1 : percent;
            this.scrollView.scrollToPercentVertical(1 - percent, duration);
        }
        this._autoScroll = true;
    }

    /**
     * 回调参数(item,index)=>{} 由于分帧加载关系，item有可能为null
     */
    public set selectHander(hander: Handler) {
        if (this._selectHander) {
            this._selectHander.recover();
        }
        this._selectHander = hander;
    }

    public set selectBefore(hander: Handler) {
        if (this._selectBefore) {
            this._selectBefore.recover();
        }
        this._selectBefore = hander;
    }

    /**
     * 增加一项数据到列表指定位置
     * @param index   位置，0表示第1项
     * @param data  数据
     */
    public addItemAt(index: number, data: any) {
        if (this.itemDataList[index] != null || this.itemDataList.length == index) {
            this.itemDataList.splice(index, 1, data);
            this.updateContent();
        }
    }

    /**
     * 增加一项数据到列表指定位置
     * @param index   位置，0表示第1项
     * @param data  数据
     */
    public updateItemAt(index: number, data: any) {
        this.itemDataList[index] = data;
        for (var render of this.itemList) {
            if (render.index == index) {
                render.data = data;
                return;
            }
        }
    }

    /**
     * 删除一项数据
     * @param index 删除项的位置 ,0表示第1项
     */
    public deleteItem(index: number) {
        if (this.itemDataList[index] != null) {
            this.itemDataList.splice(index, 1);
            this.updateContent();
        }
    }

    /**
     * 改变一项数据
     * @param index   位置,0表示第1项
     * @param data  替换的数据
     */
    public changeItem(index: number, data: any) {
        if (this.itemDataList[index] != null) {
            this.itemDataList[index] = data;
            this.updateContent();
        }
    }

    /**获取第一个Item的位置 */
    private updateContent() {
        //显示列表实例为0个
        if (this.itemList.length == 0) {
            this.countListParam();
            let tmp = scrollOffset.clone();
            if (this.startIndex > 0) {
                if (this.type == ListType.Horizontal || (this.type == ListType.Grid && this.startAxis == StartAxisType.Horizontal)) {
                    tmp.x = ((this.itemWidth + this.spaceX) * (this.startIndex + 1));
                } else if (this.type == ListType.Vertical || (this.type == ListType.Grid && this.startAxis == StartAxisType.Vertical)) {
                    tmp.y = ((this.itemHeight + this.spaceY) * (this.startIndex + 1));
                }
            }
            this.createList(this.startIndex, tmp);
            //显示列表的实例不为0个，则需要重新排列item实例数组
        } else {
            if (this.type == ListType.Vertical) {
                this.itemList.sort((a: any, b: any) => {
                    return b.node.position.y - a.node.position.y;
                });
            } else if (this.type == ListType.Horizontal) {
                this.itemList.sort((a: any, b: any) => {
                    return a.node.position.x - b.node.position.x;
                });
            } else if (this.type == ListType.Grid) {
                if (this.startAxis == StartAxisType.Vertical) {
                    this.itemList.sort((a: any, b: any) => {
                        return a.node.position.x - b.node.position.x;
                    });
                    this.itemList.sort((a: any, b: any) => {
                        return b.node.position.y - a.node.position.y;
                    });
                } else if (this.startAxis == StartAxisType.Horizontal) {
                    this.itemList.sort((a: any, b: any) => {
                        return b.node.position.y - a.node.position.y;
                    });
                    this.itemList.sort((a: any, b: any) => {
                        return a.node.position.x - b.node.position.x;
                    });
                }
            }

            this.countListParam();

            //获取第一个item实例需要显示的数据索引
            var startIndex = this.itemList[0].getComponent(ItemRender).index;


            //getScrollOffset()和scrollToOffset()的x值是相反的
            var offset: Vec2 = this.scrollView.getScrollOffset();
            offset.x = -offset.x;

            if (this.type == ListType.Grid && this.startAxis == StartAxisType.Vertical) {
                startIndex += (startIndex + this.spawnCount) % this.gridCol;
            } else if (this.type == ListType.Grid && this.startAxis == StartAxisType.Horizontal) {
                startIndex += (startIndex + this.spawnCount) % this.gridRow;
            }

            this.createList(startIndex, offset);
        }
    }

    /**销毁 */
    public onDestroy() {
        if (isValid(this.itemRender)) {
            this.itemRender.destroy();
        }
        //清理列表项
        this.itemList = null;
        //清理对象池
        this.itemPool = null;
        //清理列表数据
        this.itemDataList = null;
        this.updateFun = null;
        this._selectedItem = null;
        if (this._selectBefore) {
            this._selectBefore.recover();
            this._selectBefore = null;
        }
        //清理事件
        if (this._selectHander) {
            this._selectHander.recover();
            this._selectHander = null;
        }
    }
}

// /**
//  * 分帧执行
//  * @param loopTimes 实际数量
//  * @param func
//  * @param frameTime
//  * @param __index
//  */
// private frameLoad(loopTimes: number, func: Function, frameTime: number = 16, __index: number = 0) {
//     let loop = loopTimes;
//     let start = new Date().getTime();
//     let end = 0;
//     let dt = 0;
//     let t = this;
//     for (let i = 0; i < loop; ++i) {
//         if (__index >= loop) {
//             break;
//         }
//         try {
//             func && func(__index);
//         } catch (e) {
//             error(e);
//         }
//         __index++;
//         end = new Date().getTime();
//         dt = end - start;
//         if (dt > frameTime) {
//             setTimeout(() => {
//                 t.frameLoad(loop, func, frameTime, __index);
//             }, 10);
//             break;
//         }
//     }
// }