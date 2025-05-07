import { BlockInputEvents, instantiate, Node, Prefab, RichText, Tween, tween, UIOpacity, UITransform, v3 } from "cc";
import { Layer } from "../utils/Enum";
import { ResourceUtil } from "../utils/ResourceUtil";
import { dialogMgr } from "./DialogManager";
import { UI2Prefab } from "../autobind/UI2Prefab";
import { Label } from "cc";
import { poolMgr } from "./PoolManager";


/**
 * 小飘字
 */
class ToastMgr {

    /** 文本提示容器 */
    private txtContent: Node;
    private _startY: number = 120;

    private max: number = 2;
    _prefab: Prefab | null = null;
    private _H: number = 46;

    /** 飘字请求队列 */
    private toastQueue: { txt: string, posY: number, delayTime: number, skillid: number }[] = [];
    /** 是否正在处理飘字请求 */
    private isProcessing: boolean = false;

    constructor() {
        this.txtContent = new Node();
        let uit = this.txtContent.addComponent(UITransform);
        this.txtContent.addComponent(BlockInputEvents);
        uit.setContentSize(800, 0);
        this.txtContent.setPosition(0, this._startY);
    }

    private configure(node: Node, txt: string, posY: number, delayTime: number, skillId: number) {
        let t = this;
        let opacityCom = node.getComponent(UIOpacity);
        if (!opacityCom) {
            opacityCom = node.addComponent(UIOpacity);
        }
        opacityCom.opacity = 255;
        Tween.stopAllByTarget(opacityCom);
        Tween.stopAllByTarget(t.txtContent);

        // 设置新节点的初始位置及特效
        node.setPosition(0, 0);
        tween(node)
            .to(0.05, { scale: v3(1.1, 1.1, 1.1) })
            .delay(0.05)
            .to(0.05, { scale: v3(1, 1, 1) })
            .start();
        //设置旧节点的位置及特效
        let nums = t.txtContent.children.length;
        if (nums > 0) {
            if (nums >= t.max) {
                let node = t.txtContent.children[0];
                if (node.isValid) {
                    t.txtContent.removeChild(node);
                    nums -= 1;
                }
            }
            for (let i = nums - 1; i >= 0; --i) {
                let targetPosition = v3(0, (nums - i - 1) * t._H);
                let currentNode = t.txtContent.children[i];
                let pos = targetPosition;
                t.txtContent.children[i].setPosition(pos)
                tween(currentNode)
                    .to(0.1, { position: v3(0, pos.y + t._H) })
                    .start();
            }
        }

        let labNode = node.getChildByName("lab");
        labNode.active = true;

        labNode.getComponent(Label).string = txt;

        t.txtContent.addChild(node);
        let uit = t.txtContent.getComponent(UITransform);
        uit.setContentSize(800, (t.txtContent.children.length) * t._H);
        t.txtContent.setPosition(v3(0, t._startY));
        if (!t.txtContent.parent) {
            dialogMgr.getContainer(Layer.TOP).addChild(t.txtContent);
        }
        tween(opacityCom).delay(0.7).to(1, { opacity: 55 }).call(t.txtRemove.bind(t)).start();

    }

    private txtRemove(opacityCom: UIOpacity): void {
        poolMgr.putNode(opacityCom.node);
        // if (opacityCom.node.parent) {
        // opacityCom.node.removeFromParent();
        // this.nodePool.unshift(opacityCom.node);
        Tween.stopAllByTarget(opacityCom);
        // }
    }
    private processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        const processNext = () => {
            if (this.toastQueue.length === 0) {
                this.isProcessing = false;
                return;
            }
            const { txt, posY, delayTime, skillid } = this.toastQueue.shift()!;
            this.make(txt, posY, delayTime, skillid);
            // 设置0.1秒后处理下一个请求
            setTimeout(processNext, 150);
        };

        processNext();
    }
    private tweenCall(): void {
        let content = this.txtContent;
        Tween.stopAllByTarget(content);
        content.removeAllChildren();
        if (content.parent) {
            content.parent.removeChild(content);
        }
    }

    private make(txt: string, posY: number, delayTime: number, skillid: number) {
        if (!txt || txt.length <= 0) return;
        let t = this;
        let tip: Node;
        if (!tip) {
            if (!t._prefab) {
                ResourceUtil.loadRes(UI2Prefab.ToastUI_url, Prefab, (err, data) => {
                    t._prefab = data;
                    t.configure(instantiate(t._prefab), txt, posY, delayTime, skillid);
                });
                return;
            } else {
                // 获取对象池
                tip = poolMgr.getNode(this._prefab, null);
            }
        }
        if (tip)
            t.configure(tip, txt, posY, delayTime, skillid);

    }

    /**
     * 显示提示
     * @param txt 提示内容
     * @param posY 提示位置
     * @param delayTime 延迟时间
     * @param skillid 技能id
     */
    showToast(txt: string, posY: number = 0, delayTime: number = 1.5, skillid: number = null) {
        this.toastQueue.push({ txt, posY, delayTime, skillid });
        this.processQueue();//队列处理
    }

    clear() {
        //清理对象池
        // poolMgr.clearPool(this._prefab.name);
    }
}

export let toast: ToastMgr = new ToastMgr();