import { _decorator, Component, assetManager, AssetManager, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Start')
export class Start extends Component {
    start() {
        assetManager.loadBundle("scene",(err,bundle:AssetManager.Bundle)=>{
            // director.loadScene("scene登录");
            director.loadScene("main");
        });
    }

    update(deltaTime: number) {
        
    }
}


