

import { Component, NodeEventType, resources, _decorator } from 'cc';
import { UI2Prefab } from '../autobind/UI2Prefab';
const { ccclass, property } = _decorator;

@ccclass('AutoBind')
export class AutoBind extends Component {
    /**是否已初始化完毕 */
    _inited: boolean;

    onLoad() {
    }

    start() {
        this._inited = true;
    }

    onDestroy() {
        this._inited = false;
        let clzName = this.name.split(/<|>/g)[1];
        let asset = resources.get(UI2Prefab[clzName + "_url"]);
        if (!asset || asset.refCount == 0) {
            resources.release(UI2Prefab[clzName + "_url"])
        }
    }
}