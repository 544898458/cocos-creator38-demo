import { UI2Prefab } from "../autobind/UI2Prefab";
import { EC } from "../utils/EC";
import { dialogMgr } from "./DialogManager";
import { dispatcher } from "./event/EventDispatcher";
import { LoginView } from "../ui/LoginView";
import { Glob } from "../utils/Glob";
import { Dialog } from '../component/Dialog';
class LoginMgr {

    initial(): void {
        dispatcher.on(EC.LOAD_FINISH, this.openLogin, this);
        // Net.dispatcher.on(SocketEvent.CLOSE, this.connectError, this, [false]);
        // Net.dispatcher.on(SocketEvent.ERROR, this.connectError, this, [true]);
        // Net.dispatcher.on("104", this.onKickOut, this);
        // Net.dispatcher.on("96", this.onClientData, this);
        // Net.dispatcher.on("108", this.onOnlineTime, this);
    }
    openLogin() {
        // dialogMgr.closeDialog(UI2Prefab.LoadingView_url);
        dialogMgr.openDialog(UI2Prefab.LoginView_url, null, null, (dlg: Dialog): void => {
            let loginView = dlg.getComponent(LoginView)
            if (Glob.websocket) {
                loginView.node选择单人或多人.active = true
                loginView.node登录面板.active = false
            }
        })
    }

}

export let sceneMgr = new LoginMgr();
