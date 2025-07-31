import { _decorator, Component, assetManager, AssetManager, director } from 'cc';
import { MainTest } from '../MainTest';
import { Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Start')
export class Start extends Component {
    @property(Label)
    progressLabel: Label = null;

    UpdateProgress(text:string){
        this.progressLabel.string = text;
        console.log(text);
    }

    start() {
        MainTest.onSecen登录Load()
        let strUri = "resources"
        if(MainTest.是抖音小游戏()){
            strUri = "https://www.rtsgame.online/bytedance/remote/resources"
        }
        assetManager.loadBundle(strUri,(err,bundle:AssetManager.Bundle)=>{
            console.log(err, bundle);
            
            // 输出开始加载场景的信息
            this.UpdateProgress("开始加载场景: main");
            
            director.preloadScene("main", (completedCount: number, totalCount: number, item: any)=>{
                this.UpdateProgress("场景加载进度: " + completedCount + "/" + totalCount);
            },(err: Error | null, scene: any) => {
                this.UpdateProgress("场景加载完成！");
                // 使用 director.loadScene 加载场景
                director.loadScene("main", (err: Error | null, scene: any) => {
                    if (err) {
                        console.error("场景加载失败:", err);
                    } else {
                        console.log("场景加载完成！", scene);
                    }
                });
            });
        });
    }

    update(deltaTime: number) {
        
    }
}


