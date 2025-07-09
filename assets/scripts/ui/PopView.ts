import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Dialog } from '../component/Dialog';
import { Label } from 'cc';
import { RichText } from 'cc';
import { UI2Prefab } from '../autobind/UI2Prefab';
import { MainTest } from '../MainTest';

@ccclass('PopView')
export class PopView extends Dialog {
    @property(Label)
    label标题: Label;
    @property(RichText)
    richText内容: RichText
    start() {

    }

    update(deltaTime: number) {
        
    }

    onBtn关闭():void{
        MainTest.instance.dialogMgr.closeDialog(UI2Prefab.PopView_url);
    }
}


