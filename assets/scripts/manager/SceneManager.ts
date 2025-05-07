/**
 * @Author: xiaohui
 * @Date: 2024-05-28 11:28:05
 * @LastEditors: guojiejin
 * @LastEditTime: 2025-04-08 17:55:16
 * @Description: 登录模块
 */

import { JsonAsset, resources } from "cc";
import { UI2Prefab } from "../autobind/UI2Prefab";
import { EC } from "../utils/EC";
import { dialogMgr } from "./DialogManager";
import { dispatcher } from "./event/EventDispatcher";
import { ResourceUtil } from "../utils/ResourceUtil";
import { MainTest } from "../MainTest";

class LoginMgr {
    /** 资源是否加载完毕 */
    private dataInited: boolean = false;
    private resInited: boolean = false;

    private isEnterGame: boolean;
    //重连次数
    private recnTime: number = 0;

    initial(): void {
        dispatcher.on(EC.LOAD_FINISH, this.openLogin, this);
        // Net.dispatcher.on(SocketEvent.CLOSE, this.connectError, this, [false]);
        // Net.dispatcher.on(SocketEvent.ERROR, this.connectError, this, [true]);
        // Net.dispatcher.on("104", this.onKickOut, this);
        // Net.dispatcher.on("96", this.onClientData, this);
        // Net.dispatcher.on("108", this.onOnlineTime, this);
    }
    openLogin() {
        dialogMgr.closeDialog(UI2Prefab.LoadingView_url);
        dialogMgr.openDialog(UI2Prefab.LoginView_url);
    }

}

export let sceneMgr = new LoginMgr();
