import { _decorator, Component, assetManager, AssetManager, director } from 'cc';
import { MainTest } from '../MainTest';
const { ccclass, property } = _decorator;

@ccclass('Start')
export class Start extends Component {
    start() {
        let strUri = "resources"
        if(MainTest.是抖音小游戏()){
            strUri = "https://www.rtsgame.online/bytedance/remote/resources"
        }
        
        assetManager.loadBundle(strUri,(err,bundle:AssetManager.Bundle)=>{
            console.log(err, bundle);
            director.loadScene("main");
        });
    }

    update(deltaTime: number) {
        
    }
}


