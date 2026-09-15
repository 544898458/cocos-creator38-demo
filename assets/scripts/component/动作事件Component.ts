import { _decorator, Component, Node, Vec3, Camera, input, Input, EventTouch, Quat, view } from 'cc';
import { AudioMgr } from '../manager/audio/AudioMgr';
import { game } from 'cc';
import { Glob } from '../utils/Glob';
import { MsgId } from '../utils/Enum';
import { dispatcher } from '../manager/event/EventDispatcher';
const { ccclass } = _decorator;

@ccclass('动作事件')
export class 动作事件Component extends Component {
    private fun击中事件: (() => void) | null = null

    设置击中事件(fun击中事件?: (() => void)) {
        this.fun击中事件 = fun击中事件
    }
    击中() {
        this.fun击中事件?.()
    }

    播放声音(strSoundName: string){
        console.log('动作事件Component 播放声音', strSoundName)
        AudioMgr.inst.播放声音(strSoundName, this.node.parent.worldPosition);
    }
    射击(){
        console.log('动作事件Component 射击')
        //发消息：射击
        dispatcher.sendArray([
            [MsgId.射击, Glob.getSendMsgSn自增(), 0],
        ])
    }
}
