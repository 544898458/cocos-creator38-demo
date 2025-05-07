import { ProgressBar } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { dialogMgr } from '../manager/DialogManager';
import { Dialog } from '../component/Dialog';
import { dispatcher } from '../manager/event/EventDispatcher';
import { EC } from '../utils/EC';
const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends Dialog {
    @property(ProgressBar)
    progress: ProgressBar = null;

    private targetTime: number = 0; // 总时间，单位为秒
    private currentTime: number = 0; // 当前累计时间
    onOpened(params: number = 1) {
        console.log("LodingView.onOpened");

        // 假设通过 params 传递 time 参数
        if (params && typeof params === 'number') {
            this.targetTime = params;
            this.currentTime = 0;
        }
    }

    update(deltaTime: number) {
        if (this.progress && this.targetTime > 0) {
            this.currentTime += deltaTime;

            // 根据当前时间和目标时间计算进度
            let progressRatio = Math.min(this.currentTime / this.targetTime, 1);
            this.progress.progress = progressRatio;

            // 加载完毕
            if (progressRatio >= 1) {
                this.progress.progress = 1;
                this.targetTime = 0;
                //抛出事件
                dispatcher.emit(EC.LOAD_FINISH);
            }
        }
    }
}


