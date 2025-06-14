/**
 * @Author: xiaohui
 * @Date: 2024-04-30 11:11:19
 * @LastEditors: guojiejin
 * @LastEditTime: 2024-12-23 17:17:01
 * @FilePath: \assets\script\framework\manager\DialogManager.ts
 * @Description: 窗口管理（层级，打开关闭）
 */
import { instantiate, isValid, Layers, Node, Prefab, UITransform, Widget } from "cc";
import { UI2Prefab } from "../autobind/UI2Prefab";
import { Dialog } from "../component/Dialog";
import { EC } from "../utils/EC";
import { Layer } from "../utils/Enum";
import { ResourceUtil } from "../utils/ResourceUtil";
import { dispatcher } from "./event/EventDispatcher";

export class DialogManager {

    private _layerNodes: { [key: number]: Node } = {}
    /** 打开中的dialog */
    private _dialogInOpen: { [key: string]: Dialog } = {};
    /** 加载中的dialog */
    private _dialogInLoad: { [key: string]: any[] } = {};
    /** 需要隐藏的界面 */
    private _hideClazz: { [key: string]: string } = {};

    /** breakLoading */
    public breakLoad: Dialog;
    /** 警告弹窗 */
    public customAlert: Dialog;

    inital(canvas: Node) {
        //添加一个UIRoot层
        let uiRoot = this.createUINode("UIRoot", true);
        canvas.addChild(uiRoot)
        //添加层
        Object.keys(Layer).forEach((key) => {
            if (!isNaN(Number(key))) return;
            let node = this.createUINode(key, true);
            uiRoot.addChild(node);
            this._layerNodes[Layer[key]] = node;
        })
        dialogMgr = this;
        //TODO
        //dispatcher.on(EC.HIDE_ENTER_VIEW, this.hideView, this)
    }

    /**
     * 获取容器
     * @param {number} layer layer容器层级
     * @returns 
     * @see {Layer} layer
     */
    getContainer(layer: Layer): Node {
        return this._layerNodes[layer];
    }

    /**
     * 产假
     * @param nodeName 
     * @param full 
     * @returns 
     */
    createUINode(nodeName: string, fullScene: boolean): Node {
        let node: Node = new Node();
        node.name = nodeName;
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform);
        if (fullScene) {
            let widget: Widget = node.addComponent(Widget);
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
        }
        return node;
    }


    /**
     * 打开一个对话
     * @param {string} url dialog资源路径
     * @param {any} args 参数
     * @param {string} hideClazzUrl 需要隐藏的界面
     * @param {boolean} closeOtherView 是否关闭其他页面
     */
    public openDialog(url: string, args: any = undefined, hideClazzUrl?: string, onLoad: (dlg: Dialog) => void = null) {
        let t = this;
        if (t._dialogInLoad[url]) {
            t._dialogInLoad[url] = [url, args];
            t._dialogInOpen[url].onShow()
            if (onLoad) {
                onLoad(t._dialogInOpen[url]);
            }
            
            return;
        } else {
            t._dialogInLoad[url] = [url, args];
        }

        let dialog = t._dialogInOpen[url];
        if (dialog) {
            dialog.node.active = true;
            dialog.initalData(t._dialogInLoad[url][1]);
            delete t._dialogInLoad[url];
            t._dialogInOpen[url].onShow()
            if (onLoad) {
                onLoad(t._dialogInOpen[url]);
            }
            return;
        }

        if (hideClazzUrl != null)
            t._hideClazz[url] = hideClazzUrl;

        console.info('打开界面 Url：', url);
        ResourceUtil.loadRes(url, Prefab, (err, data) => {
            if (err || !data) {
                //TODO
                // Session.isReload = false;
            } else {
                if (t._dialogInLoad[url]) {
                    let node: Node = instantiate(data);
                    let dialog = node.getComponent(Dialog);
                    if (dialog) {
                        let wiget = dialog.getComponent(Widget);
                        if (!wiget) {
                            wiget = dialog.addComponent(Widget);
                            wiget.isAlignLeft = true;
                            wiget.isAlignRight = true;
                        }
                        t._dialogInOpen[url] = dialog;
                        t._layerNodes[dialog.layer].addChild(node);
                        dialog.initalData(t._dialogInLoad[url][1]);
                        //TODO
                        //dispatcher.emit(EC.VIEW_OPENED, url);

                        if (!dialog.hasPage)
                            t.hideView(url);

                        t._dialogInOpen[url].onShow()
                        if (onLoad) {
                            onLoad(dialog);
                        }
                    }
                }
            }
            delete this._dialogInLoad[url];
        })
    }

    //隐藏或关闭某些无须渲染的界面
    private hideView(url: string): void {
        if (this._hideClazz[url] != null) {
            const dialog = this._dialogInOpen[this._hideClazz[url]];
            if (dialog && isValid(dialog)) {
                dialog.node.active = false;
            }
        }
    }

    /**
     * 获取没关闭的对话框
     * @param {string} url dialog资源路径
     * @returns 
     */
    public getDialog(url: string): Dialog {
        return this._dialogInOpen[url]
    }

    /**
     * 关闭对话框
     * @param {string} url dialog资源路径
     * @returns 
     */
    public closeDialog(url: string): void {
        let t = this;
        if (t._dialogInLoad[url]) {
            delete t._dialogInLoad[url];
        }
        let dialog = t._dialogInOpen[url];
        if (!dialog) return;

        if (dialog.onlyHide) {
            dialog.node.active = false;
            dialog.onClosed();
            return;
        }

        //TODO 显示被隐藏的界面
        if (t._hideClazz[url] != null) {
            const hideClazz = t._dialogInOpen[t._hideClazz[url]];
            if (hideClazz && isValid(hideClazz)) {
                hideClazz.node.active = true;
            }
            delete t._hideClazz[url];
        }
        t._layerNodes[dialog.layer].removeChild(dialog.node);
        dialog.offAutoEvt();
        dialog.onClosed();
        dialog.node.destroy();
        delete t._dialogInOpen[url];
        //TODO
        //dispatcher.emit(EC.VIEW_COLSED, url);
    }
    //TODO
    // showCustomAlert(args: AlertParam): void {
    //     let t = this;
    //     if (!this.customAlert) {
    //         this.openDialog(UI2Prefab.CustomAlert_url, args)
    //         return;
    //     }
    //     if (!this.customAlert.node.parent)
    //         t._layerNodes[this.customAlert.layer].addChild(this.customAlert.node);
    //     this.customAlert.initalData(args);
    // }

    /**
     * 关闭其他窗口，保留只留窗口
     * @param keepWinURL 保留窗口
     */
    closeOtherWin(keepWinURL: string | string[]): void {
        let keepWins = [];
        if (typeof keepWinURL == 'string') {
            keepWins.push(keepWinURL)
        } else {
            keepWins = keepWinURL;
        }

        for (let key in this._dialogInLoad) {
            delete this._dialogInLoad[key];
        }

        for (let key in this._dialogInOpen) {
            if (keepWins.indexOf(key) < 0) {
                this.closeDialog(key);
            }
        }

    }

    closeCustomAlert(): void {
        if (!this.customAlert)
            return;
        this.customAlert.close();
    }

    showBreakLoad(): void {
        let t = this;
        if (!this.breakLoad) {
            //TODO
            // this.openDialog(UI2Prefab.Loading_url)
            return;
        }
        if (!this.breakLoad.node.parent)
            t._layerNodes[this.breakLoad.layer].addChild(this.breakLoad.node);
    }

    closeBreakLoad() {
        if (!this.breakLoad) {
            return;
        }
        this.breakLoad.close();
    }
}

export let dialogMgr: DialogManager;