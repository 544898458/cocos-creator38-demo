import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Dialog } from '../component/Dialog';
import { Label } from 'cc';
import { RichText } from 'cc';
import { UI2Prefab } from '../autobind/UI2Prefab';
import { MainTest } from '../MainTest';

@ccclass('Pop升级选项')
export class Pop升级选项 extends Dialog {
    @property(Node)
    node升级选项列表: Node
    @property(Node)
    node升级选项模板: Node
    start() {

    }

    update(deltaTime: number) {
        
    }

    static staticOnBtn关闭():void{
        MainTest.instance.dialogMgr.closeDialog(UI2Prefab.Pop升级选项_url);
    }
}


