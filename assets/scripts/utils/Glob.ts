import { Rect, ResolutionPolicy, view } from "cc";

export class Glob {
    public static HEIGHT: number = 750;
    public static WIDTH: number = 1334;
    public static myNickName: String = null;

    public static websocket: WebSocket;
    public static sendMsgSn: number = 0;
    public static recvMsgSn: number = 0;
    public static recvMsgSnGameSvr: number = 0
    public static recvMsgSnWorldSvr: number = 0;
    public static str在线人数: string;
    //全局常量  
    public static KEY_登录名: string = '登录名'
    public static strHttps登录场景音乐Mp3: string = "https://www.rtsgame.online/music/suno世界又恢复了和平低音质.mp3"
    /** 全屏大小，非纯色背景放大系数 */
    static scale: number = 1;
    /** 3d场景高度缩小倍率 */
    static rect3D: Rect = new Rect(0, 0, 1, 1);

    static init(): void {
        // 全屏时，非纯色的背景图适配
        // let size = view.getVisibleSize();
        // let scaleX = size.width / Glob.WIDTH;
        // let scaleY = size.height / Glob.HEIGHT;
        // if (scaleX < scaleY) {
        //     view.setResolutionPolicy(ResolutionPolicy.SHOW_ALL);
        //     this.rect3D.height = scaleX;
        //     this.rect3D.y = (1 - scaleX) / 2 + 0.001;
        //     Glob.scale = scaleY
        // } else {
        //     Glob.scale = scaleX
        // }
    }
}