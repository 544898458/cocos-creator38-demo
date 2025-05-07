
import { _decorator, instantiate, isValid, Node, Prefab } from "cc";
import { UI2Prefab } from "../autobind/UI2Prefab";
import { Layer } from "../utils/Enum";
import { AudioMgr } from "../manager/audio/AudioMgr";
import { Panel } from "./Panel";
import { ResourceUtil } from "../utils/ResourceUtil";
import { dispatcher } from "../manager/event/EventDispatcher";
import { EC } from "../utils/EC";

export interface IPageOptions {
    /** 分页容器 */
    pageContainer: Node;
    /** 分页标题 */
    labs?: Array<string>;
    /** 分页皮肤路径 */
    pagePaths: Array<string>;
    /** 分页对应的执行脚本 */
    components: Array<any>
    /** 分页类实例 */
    pageClazzs?: Array<Panel>;
    /** 用于隐藏EnterView的页面路径标记 */
    hideClazzUrl?: string;
}

export class Dialog extends Panel {

    /** true：关闭时隐藏，false：关闭时释放资源 */
    onlyHide: boolean = false;
    /** UI层 */
    layer: Layer = Layer.UI;
    /** 传递参数 */
    args: any;

    /* 当前子页面索引 */
    public currPageIndex: number;
    /* 分页数据 */
    public pageOption: IPageOptions;
    /* 是否带分页界面 */
    public hasPage: boolean = false;

    start() {
        super.start();
        this.onOpened(this.args);
    }

    initalData(args: any) {
        this.args = args;
        if (this._inited) {
            this.onOpened(this.args);
        }
    }

    /**
     * 窗口打开完成后，调用此方法（如果有弹出动画，则在动画完成后执行）
     */
    onOpened(param: any): void {
    }

    /**
     * 关闭窗口调用
     */
    close(): void {
        //TODO  播放关闭音效
        // AudioManager.instance.playSound("ui/dialog_close");
        let clzName = this.name.split(/<|>/g)[1];

        //清除分页数据
        if (this.pageOption != null) {
            this.pageOption.pageClazzs.forEach((value: Panel) => {
                if (isValid(value)) {
                    value.node.destroy();
                }

            });
            this.pageOption.pageClazzs = null;
            this.pageOption = null;
            this.currPageIndex = null;
            this.hasPage = false;
        }

    }

    /** 
     * 初始化分页
     * 
     * @param {IPageOptions} pageOption 分页数据
     */
    initSubPage(pageOption: IPageOptions): void {
        this.pageOption = pageOption;
    }

    setTabPage(index: number, param?: any): void {
        let self = this;
        if (index < 0 || null == self.pageOption) {
            return;
        }

        if (!self.pageOption.pageClazzs) {
            self.pageOption.pageClazzs = [];
        }

        let subPanel: Panel = self.pageOption.pageClazzs[self.currPageIndex];
        if (subPanel) {
            if (self.currPageIndex == index) { //相同标签的时候 更新界面显示就好
                subPanel.refreshPanel(param);
                return;
            }
            subPanel.node.removeFromParent();
        }

        self.currPageIndex = index;
        subPanel = self.pageOption.pageClazzs[index];
        if (!subPanel) {
            ResourceUtil.loadRes<Prefab>(self.pageOption.pagePaths[index], Prefab, (err, prefab: Prefab) => {
                if (err) {
                    console.error(err);
                    return;
                }
                let pageContainer = self.pageOption.pageContainer;
                if (!pageContainer) {
                    return;
                }
                const node: Node = instantiate(prefab);
                self.pageOption.pageContainer.addChild(node);
                subPanel = self.pageOption.pageClazzs[index] = node.getComponent(self.pageOption.components[index]);
                subPanel.pageInit(param);
                if (self.pageOption != null) {
                    //TODO 分页
                    //dispatcher.emit(EC.HIDE_ENTER_VIEW, self.pageOption.hideClazzUrl);
                }
            });
            return;
        }
        if (isValid(subPanel.node) && !subPanel.node.parent) {
            self.pageOption.pageContainer.addChild(subPanel.node);
        }
        if (subPanel._subPageInit) {
            subPanel.refreshPanel(param);
        } else {
            subPanel.pageInit(param);
        }
        if (self.pageOption != null) {
            //TODO
            //dispatcher.emit(EC.HIDE_ENTER_VIEW, self.pageOption.hideClazzUrl);
        }
    }

    /**
     * 关闭完成后，调用此方法（如果有关闭动画，则在动画完成后执行）
     * 1. 清理定时器，tween
     * 2. 清理特效
     * 3. 其他业务逻辑处理
     */
    onClosed(): void { }
}