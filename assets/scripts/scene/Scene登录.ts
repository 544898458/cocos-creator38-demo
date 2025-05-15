import { Node, resources, Prefab, instantiate, _decorator, Component, EditBox, Button, Vec3, NodeEventType, EventMouse, geometry, PhysicsSystem, Camera, SkeletalAnimation, Label, utils, AnimationClip, director } from 'cc'
import msgpack from "msgpack-lite/dist/msgpack.min.js"
// import yaml from 'js-yaml/dist/js-yaml.min.js'
import { FollowTarget } from '../mode/FollowTarget'
import { Scene战斗, ClientEntityComponent } from './Scene战斗'
import { KEY_登录名, Main, 副本ID } from '../mode/Main'
import { ProgressBar } from 'cc'
import { EventHandler } from 'cc'
import { AudioClip } from 'cc'
import { AudioSource } from 'cc'
import { assetManager } from 'cc'
import { sys } from 'cc'
import { TextAsset } from 'cc'
import { MsgId } from '../配置/配置'
import { RichText } from 'cc'

const { ccclass, property } = _decorator

@ccclass('Scene登录')
export class Scene登录 extends Component {

    @property({ type: EditBox })
    editBox登录名: EditBox
    @property({ type: Node })
    node跳转社区浏览器H5: Node
    @property({ type: Node })
    node跳转社区微信小游戏: Node
    @property({ type: Node })
    node跳转社区抖音小游戏: Node
    @property({ type: Node, displayName: "个人战局列表面板" })
    node个人战局列表面板: Node
    @property({ type: Node, displayName: "个人战局列表" })
    node个人战局列表: Node
    @property({ type: Node, displayName: "个人战局按钮模板" })
    node个人战局按钮模板: Node
    nodeLoginPanel: Node
    nodeSelectSpace: Node
    @property({ type: AudioSource })
    audioSource: AudioSource
    main: Main
    @property({ type: RichText })
    lableMessage: RichText
    @property(RichText)
    richText公告: RichText

    //加载
    @property(Node)
    loadNode: Node;
    //加载时间
    loadtime: number = 0;
    //加载时间总长 1s
    loadlen: number = 1;

    onLoad() {
        console.log('onLoad')
        this.nodeSelectSpace = utils.find("Canvas/选择玩法", this.node.parent);
        this.nodeLoginPanel = utils.find("Canvas/LoginPanel", this.node.parent);
        //获取常驻节点
        this.main = director.getScene().getChildByName('常驻').getComponent(Main);
        this.main.scene登录 = this
        // this.loadNode.active = true;
        if (this.main.str在线人数)
            this.lableMessage.string = this.main.str在线人数

        if (this.main.websocket) {
            this.nodeSelectSpace.active = true
            this.nodeLoginPanel.active = false
        }

        this.editBox登录名.string = sys.localStorage.getItem(KEY_登录名)
        this.main.微信小游戏允许分享()
        console.log('sys.isBrowser', sys.isBrowser)
        if (sys.isBrowser)
            this.node跳转社区浏览器H5.active = true
        else if(Main.是抖音小游戏())
            this.node跳转社区抖音小游戏.active = true
        else
            this.node跳转社区微信小游戏.active = true

        this.main.onSecen登录Load()
    }
    start() {
        console.log('Scene登录.start')

        if (this.main.strHttps登录场景音乐Mp3) {
            assetManager.loadRemote(this.main.strHttps登录场景音乐Mp3, (err, clip: AudioClip) => {
                console.log('resources.load callback:', err, clip)
                if (!this.audioSource)
                    return

                this.audioSource.stop()
                this.audioSource.clip = clip
                this.audioSource.play()
            })
        }

        assetManager.loadRemote('https://www.rtsgame.online/公告/公告.txt', (err, textAsset: TextAsset) => {
            console.log('resources.load callback:', err, textAsset)
            this.richText公告.string = textAsset.text
        })

        if(Main.是抖音小游戏()){
            // --侧边栏按钮判断--//
            tt.onShow((res) => {
                //判断用户是否是从侧边栏进来的
                let isFromSidebar = (res.launch_from == 'homepage' && res.location == 'sidebar_card')

                if (isFromSidebar) {
                    //如果是从侧边栏进来的，隐藏“去侧边栏”
                    // this.btnSidebar.active = false
                    this.lableMessage.string = '您从侧边栏进入了游戏，可免除一次插屏广告'
                }
                else {
                    //否则 显示“去侧边栏”按钮
                    // this.btnSidebar.active = true
                }
            });
        }
    }

    //销毁时
    onDestroy(): void {
        console.log('Scene登录.onDestroy', this.main)
        this.main?.onDestroy()
    }

    update(deltaTime: number) {
        //加载进度条
        if (this.loadtime < this.loadlen)
            this.onloading(deltaTime)

    }
    onloading(det: number) {
        this.loadtime += det;
        if (this.loadtime > this.loadlen) {
            this.loadNode.active = false;
            return;
        } else {
            this.loadNode.getComponentInChildren(ProgressBar).progress = this.loadtime / this.loadlen
        }
    }
    onClickToggle进Space1(event: Event, customEventData: string) {
        this.main.进Scene战斗('scene战斗', MsgId.进Space, 副本ID.多人混战, '', true)
    }
    onClickToggle进单人剧情副本(event: Event, customEventData: string) {
        this.main.onClickToggle进训练战()
    }
    onClickToggle进训练战_虫(event: Event, customEventData: string) {
        this.main.onClickToggle进训练战_虫()
    }
    onClickToggle进单人防守战(event: Event, customEventData: string) {
        this.main.onClickToggle进防守战()
    }
    onClickToggle进单人防守战_虫(event: Event, customEventData: string) {
        this.main.onClickToggle进防守战_虫()
    }
    onClickToggle进单人攻坚战(event: Event, customEventData: string) {
        this.main.onClick进攻坚战()
    }
    onClickToggle进单人攻坚战_虫(event: Event, customEventData: string) {
        this.main.onClick进攻坚战_虫()
    }
    onClickToggle进单人战局(event: Event, customEventData: string) {
        const id = 副本ID[customEventData as keyof typeof 副本ID]
        this.main.onClick进单人战局(id)
    }
    onClickLogin(event: Event, customEventData: string) {
        this.main.onClickLogin(event, customEventData)
    }
    onClick微信公众号(event: Event, customEventData: string) {
        console.log('window.CC_WECHAT', window.CC_WECHAT)
        if (window.CC_WECHAT) {
            // 调用微信小游戏的跳转方法
            wx.navigateToMiniProgram({
                appId: 'wx2e932efa8e0740f0', // 替换为实际的公众号 AppID
                path: '', // 公众号的路径，如果需要指定特定页面，可以在这里设置
                extraData: {
                    // 可以传递额外的数据，如果需要
                },
                success(res: any) {
                    // 跳转成功后的回调
                    console.log('跳转成功', res);
                },
                fail(res: any) {
                    // 跳转失败后的回调
                    console.log('跳转失败', res);
                }
            });

        } else {
            this.lableMessage.string = '请搜索公众号：<color=#ffff00>即时战略指挥</color>'
        }
    }
    onClick浏览器H5打开游戏圈(event: Event, customEventData: string) {
        window.open('https://game.weixin.qq.com/cgi-bin/comm/openlink?auth_appid=wx62d9035fd4fd2059&url=https%3A%2F%2Fgame.weixin.qq.com%2Fcgi-bin%2Fh5%2Flite%2Fcirclecenter%2Findex.html%3Fwechat_pkgid%3Dlite_circlecenter%26liteapp%3Dliteapp%253A%252F%252Fwxalited17d79803d8c228a7eac78129f40484c%253Fpath%253Dpages%25252Findex%25252Findex%26appid%3Dwx57e5c006d2ac186e%26ssid%3D30%23wechat_redirect')
    }
    onClick微信小游戏内打开游戏圈(event: Event, customEventData: string) {
        const pageManager = wx.createPageManager();

        //在这里获取链接
        // https://mp.weixin.qq.com/wxamp/frame/pluginRedirect/pluginRedirect?title=&action=plugin_redirect&lang=zh_CN&plugin_uin=1029&simple=1&nosidebar=1&custom=jump_page%3Dcontent-manage&token=1691532200
        pageManager.load({
            openlink: '-SSEykJvFV3pORt5kTNpS0deg0PdxuJJSkUnhq8VuwmiCOlSerKbw3_eQMoQsKtG7u7ovcU2tf3Ri8TFTIT7JiRqpt6_p8D30pvzUtRVzPZyRcmFaNgsm5t0jZPvnltbvWo4Wtm_nR4hzmLJVodYYBBYes4VRydM4PXFgtlepB_Lx0tu-_mGT_4EDgkfWYblacfaemzG5t5p5C3a-YGQln7uvJrtBmo9oZ3YFOxrCUroBMr0KyI26YHX3p3ikM4COFCXY3--BYqKqlPpYvp7nNBA9EVIHzNyWHWiUdYyZizvU08S6KxH1XMyUozv-qWvW0NwhaBys1Md-_AcwIhLqw',
        }).then((res: any) => {
            // 加载成功，res 可能携带不同活动、功能返回的特殊回包信息（具体请参阅渠道说明）
            console.log(res);

            // 加载成功后按需显示
            pageManager.show();

        }).catch((err: any) => {
            // 加载失败，请查阅 err 给出的错误信息
            console.error(err);
        })
    }
    onClick玩家QQ群(event: Event, customEventData: string) {
        //在这里获取链接
        //https://qun.qq.com/#/handy-tool/join-group
        window.open("https://qm.qq.com/cgi-bin/qm/qr?k=uKSxRp6smVkEPkKdFTfPJ9LpS_fy1-IH&jump_from=webapi&authKey=94/gex13gRVyrye9ScLqliCQQ3m7kWWRHyYgo82kp1eEuHOdkZOaLHufZDubw6WQ")
    }
    onClick百度贴吧(event: Event, customEventData: string) {
        window.open("https://tieba.baidu.com/f?kw=%E5%8D%B3%E6%97%B6%E6%88%98%E7%95%A5%E6%8C%87%E6%8C%A5")
    }
    onClick抖音小游戏内打开侧边栏(event: Event, customEventData: string) {
         // 抖音小游戏侧边栏跳转逻辑
         tt.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                console.log("navigate to scene success");
                // 跳转成功回调逻辑
            },
            fail: (res) => {
                console.log("navigate to scene fail: ", res);
                // 跳转失败回调逻辑
            },
        });
    }
    onClick别人的个人战局列表(event: Event, customEventData: string) {
        this.main.onClick获取别人的个人战局列表(event, customEventData)
    }
    onClick别人的多人战局列表(event: Event, customEventData: string) {
        this.main.onClick获取别人的多人战局列表(event, customEventData)
    }
    onClick进入别人的个人战局(event: Event, customEventData: string) {
        this.main.onClick进入别人的个人战局(event, customEventData)
    }
    onClick进入别人的多人战局(event: Event, customEventData: string) {
        this.main.onClick进入别人的多人战局(event, customEventData)
    }
    onClick创建四方对战(event: Event, customEventData: string) {
        this.main.onClick创建四方对战()
    }
    onClick返回主界面(event: Event, customEventData: string) {
        this.nodeSelectSpace.active = true
        this.node个人战局列表面板.active = false
    }
    显示战局列表(arrPlayer: string[][], handler: string) {
        this.nodeSelectSpace.active = false
        this.node个人战局列表面板.active = true
        this.node个人战局列表.removeAllChildren()

        for (let arrNikcScene of arrPlayer) {
            let nickName = arrNikcScene[0]
            let sceneName = arrNikcScene[1]
            let node按钮 = instantiate(this.node个人战局按钮模板)
            node按钮.active = true
            node按钮.getChildByName('Label').getComponent(Label).string = nickName + ' 的战局'
            let button = node按钮.getComponent(Button)
            const clickEventHandler = new EventHandler();
            clickEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
            clickEventHandler.component = 'Scene登录';// 这个是脚本类名
            clickEventHandler.handler = handler;
            clickEventHandler.customEventData = nickName;
            button.clickEvents.push(clickEventHandler)
            this.node个人战局列表.addChild(node按钮)

            this.main.map玩家场景.set(nickName, sceneName)
        }
    }

    显示登录界面(): void {
        this.nodeSelectSpace.active = false
        this.node个人战局列表.active = false
        this.nodeLoginPanel.active = true
        if (this.main.websocket)
            this.lableMessage.string = '连接已断开，已回到登录界面'
    }
}


