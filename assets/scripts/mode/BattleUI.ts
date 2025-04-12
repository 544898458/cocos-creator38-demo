import { _decorator, Component, Node } from 'cc';
import { Main } from './Main';
import { director } from 'cc';
import { ClientEntityComponent, Scene战斗 } from '../scene/Scene战斗';
import { Label } from 'cc';
import { EditBox } from 'cc';
import { UITransform } from 'cc';
import { Sprite } from 'cc';
import { AudioMgr } from '../manager/AudioMgr';
import { Button } from 'cc';
import { Toggle } from 'cc';
import { Layers } from 'cc';
import { Vec3 } from 'cc';
import { Color } from 'cc';
import { 制造配置, 单位类型, 战斗配置 } from '../配置/配置';
import { RichText } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BattleUI')
export class BattleUI extends Component {
    main: Main;
    @property(Scene战斗)
    scene战斗: Scene战斗
    @property(Node)
    游戏攻略: Node;
    @property(Node)
    游戏设置: Node;
    @property(Node)
    下部列表: Node;
    @property(Node)
    node取消点击地面: Node
    @property(Node)
    node取消选中: Node
    @property(Node)
    nodeFightPanel: Node
    @property({ type: Label, displayName: "数量单位" })
    lableCount: Label
    @property({ type: Label, displayName: "晶体矿" })
    lableCrystal: Label
    @property({ type: Label, displayName: "燃气矿" })
    lableGas: Label
    @property({ type: Label, displayName: "活动单位" })
    lableUnit: Label
    @property({ type: Label, displayName: "聊天消息" })
    lable聊天消息: Label
    @property({ type: Label, displayName: "系统消息" })
    lable系统消息: Label
    @property({ type: RichText })richText任务提示: Label
    @property({ type: Label })lable单位详情: Label
    @property({ type: Toggle })toggle点击活动单位都是追加选中: Toggle
    @property({ type: Toggle })toggle显示单位类型: Toggle
    
    //根据选中单位类型显示不同的按钮
    @property({ type: Button }) button离开地堡: Button
    @property({ type: Button }) button强行走: Button
    @property({ type: Button }) button原地坚守: Button
    @property({ type: Button }) button集结点: Button
    @property({ type: Button }) button解锁近战兵: Button
    @property({ type: Button }) button解锁枪虫: Button

    @property({ type: UITransform, displayName: "所有单位头顶名字" })
    uiTransform所有单位头顶名字: UITransform
    @property({ type: UITransform, displayName: "剧情对话根" })
    uiTransform剧情对话根: UITransform
    @property({ type: RichText, displayName: "剧情对话内容" })
    richText剧情对话内容: RichText
    @property({ type: Sprite, displayName: "剧情对话头像左" })
    sprite剧情对话头像左: Sprite
    @property({ type: Label, displayName: "剧情对话名字左" })
    lable剧情对话名字左: Label
    @property({ type: Sprite, displayName: "剧情对话头像右" })
    sprite剧情对话头像右: Sprite
    @property({ type: Label, displayName: "剧情对话名字右" })
    lable剧情对话名字右: Label
    @property({ type: UITransform, displayName: "剧情对话退出面板" })
    uiTransform剧情对话退出面板: UITransform
    @property({ type: Label, displayName: "在线人数" })
    lable在线人数: Label

    @property({ type: Node, displayName: "选中单位列表" })
    node_selectedList: Node

    @property(Node)
    node按钮详情: Node
    @property(RichText)
    richEdit按钮详情: RichText

    lastTitle: Node
    b菱形框选: boolean = false //切换菱形框选和矩形框选两种模式

    start() {
        this.main = director.getScene().getChildByName('常驻').getComponent(Main);
        this.main.scene战斗 = this.scene战斗;
        this.lastTitle = this.nodeFightPanel.getChildByName("建筑单位");
    }

    update(deltaTime: number) {

    }

    on出地堡(event: Event, customEventData: string) {
        this.main.onClick出地堡()
    }
    on集结点(event: Event, customEventData: string) {
        if (0 == this.main.arr选中.length) {
            this.scene战斗.battleUI.lable系统消息.string = '请先选中建筑单位'
            AudioMgr.inst.playOneShot('BUZZ')
            return
        }

        this.scene战斗.main.fun创建消息 = this.scene战斗.main.createMsg集结点
        this.scene战斗.battleUI.lable系统消息.string = '请点击地面设置此建筑产出活动单位的集结点'
        this.进入点击地面状态()
    }
    进入点击地面状态() {
        this.下部列表.active = false
        this.node取消点击地面.active = true
    }
    on强行走(event: Event, customEventData: string) {
        if (0 == this.main.arr选中.length) {
            this.scene战斗.battleUI.lable系统消息.string = '请先选中活动单位'
            AudioMgr.inst.playOneShot('BUZZ')
            return
        }
        // this.scene战斗.b强行走 = true
        this.scene战斗.main.fun创建消息 = this.scene战斗.main.createMsgMove强行走
        this.scene战斗.battleUI.lable系统消息.string = '行走过程不会攻击敌人，请点击地面确定目的地'
        this.进入点击地面状态()
    }
    on原地坚守(event: Event, customEventData: string) {
        if (0 == this.main.arr选中.length) {
            this.scene战斗.battleUI.lable系统消息.string = '请先选中活动单位'
            AudioMgr.inst.playOneShot('BUZZ')
            return
        }
        this.scene战斗.main.send原地坚守()
    }
    on框选(event: Event, customEventData: string) {
        this.scene战斗.posWorld框选起始点 = null
        this.scene战斗.b框选等待按下起始点 = true
        this.scene战斗.battleUI.lable系统消息.string = '请在屏幕上下拖动框选活动单位'
        this.进入点击地面状态()
    }
    on聊天框输入结束(editbox: EditBox, customEventData: String) {
        console.log(editbox, customEventData)
        this.main.onClickSay(editbox.textLabel.string)
        editbox.textLabel.string = ''
    }
    onClick取消选中(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.scene战斗.clear选中()
        this.main.send选中([])
    }
    onClick退出此场景(event: Event, customEventData: string) {
        //this.uiLogin.回到登录场景()
        this.main.send离开Space()
    }
    onClick镜头投影(event: Event, customEventData: string) {
        this.scene战斗.切换镜头投影()
    }
    onClick镜头放大(event: Event, customEventData: string) {
        this.scene战斗.镜头放大()
    }
    onClick镜头缩小(event: Event, customEventData: string) {
        this.scene战斗.镜头缩小()
    }
    onClickAdd兵(event: Event, customEventData: string): void {
        this.main.onClickAdd兵(event, customEventData)
    }
    onClick造坦克(event: Event, customEventData: string): void {
        this.main.onClick造坦克(event, customEventData)
    }
    onClickAdd近战兵(event: Event, customEventData: string): void {
        this.main.onClickAdd近战兵(event, customEventData)
    }
    onClickAdd工程车(event: Event, customEventData: string): void {
        this.main.onClickAdd工程车(event, customEventData)
    }
    onClickAdd基地(event: Event, customEventData: string): void {
        this.main.onClickAdd基地(event, customEventData)
    }
    onClickAdd地堡(event: Event, customEventData: string): void {
        this.main.onClickAdd地堡(event, customEventData)
    }
    onClickAdd兵厂(event: Event, customEventData: string): void {
        this.main.onClickAdd兵厂(event, customEventData)
    }
    onClickAdd民房(event: Event, customEventData: string): void {
        this.main.onClickAdd民房(event, customEventData)
    }
    onClickAdd炮台(event: Event, customEventData: string): void {
        this.main.onClickAdd炮台(event, customEventData)
    }
    onClickAdd孵化场(event: Event, customEventData: string): void {
        this.main.onClickAdd孵化场(event, customEventData)
    }
    onClickAdd建筑(event: Event, customEventData: string): void {
        this.main.on点击按钮_造建筑(单位类型[customEventData as keyof typeof 单位类型])
    }
    onClickAdd机场(event: Event, customEventData: string): void {
        this.main.onClickAdd机场(event, customEventData)
    }
    onClickAdd重工厂(event: Event, customEventData: string): void {
        this.main.onClickAdd重工厂(event, customEventData)
    }
    onClickAdd虫营(event: Event, customEventData: string): void {
        this.main.onClickAdd虫营(event, customEventData)
    }
    onClickAdd飞塔(event: Event, customEventData: string): void {
        this.main.onClickAdd飞塔(event, customEventData)
    }
    onClickAdd飞机(event: Event, customEventData: string): void {
        this.main.onClickAdd飞机(event, customEventData)
    }
    onClickAdd工虫(event: Event, customEventData: string): void {
        this.main.onClickAdd工虫(event, customEventData)
    }
    onClickAdd近战虫(event: Event, customEventData: string): void {
        this.main.onClickAdd近战虫()
    }
    onClickAdd枪虫(event: Event, customEventData: string): void {
        this.main.onClickAdd枪虫()
    }
    onClickAdd绿色坦克(event: Event, customEventData: string): void {
        this.main.onClickAdd绿色坦克()
    }
    onClickAdd飞虫(event: Event, customEventData: string): void {
        this.main.onClickAdd飞虫()
    }
    onClickAdd房虫(event: Event, customEventData: string): void {
        this.main.onClickAdd房虫()
    }
    onClick空闲工程车(event: Event, customEventData: string): void {
        this.main.onClick空闲工程车()
    }
    onClick解锁近战兵(event: Event, customEventData: string): void {
        this.main.onClick解锁近战兵()
    }
    onClick解锁枪虫(event: Event, customEventData: string): void {
        this.main.onClick解锁枪虫()
    }
    onClick剧情对话全屏点击(): void {
        this.main.onClick剧情对话全屏点击()
        // this.uiTransform剧情对话根.node.active = false
    }
    onClick剧情对话再看看(): void {
        this.main.onClick剧情对话全屏点击()
        this.uiTransform剧情对话根.node.active = false
    }
    onClick剧情对话退出场景(): void {
        this.main.send离开Space()
    }
    onClick游戏攻略(): void {
        this.游戏攻略.active = !this.游戏攻略.active;
    }
    onClick游戏设置(): void {
        this.游戏设置.active = !this.游戏设置.active;
        this.toggle点击活动单位都是追加选中.isChecked = this.main.b点击活动单位都是追加选中
        this.toggle显示单位类型.isChecked = this.main.b显示单位类型
    }
    onCheck点击活动单位都是追加选中(toggle: Toggle, customEventData: string) {
        this.main.b点击活动单位都是追加选中 = toggle.isChecked
        console.log('toggle.isChecked', toggle.isChecked)
    }
    onCheck显示单位类型(toggle: Toggle, customEventData: string) {
        this.main.b显示单位类型 = toggle.isChecked
        this.scene战斗?.刷新单位名字()
        console.log('b显示单位类型,toggle.isChecked', toggle.isChecked)
    }
    onClickTitle(event: Event, customEventData: string): void {
        console.log('选中', customEventData)
        this.lastTitle.active = false;

        this.lastTitle = this.nodeFightPanel.getChildByName(customEventData);
        this.lastTitle.active = true;
    }
    onClick框选模式(): void {
        this.b菱形框选 = !this.b菱形框选
        this.lable系统消息.string = '已切换到 ' + (this.b菱形框选 ? '菱形框选' : '方形框选') + '模式'
    }

    onSelectUnits(selectUids: number[]): void {
        this.显示选中单位详情(selectUids)

        this.node_selectedList.removeAllChildren();

        const map = new Map<string, number>();
        for (let i = 0; i < selectUids.length; i++) {
            const nickName = this.scene战斗.entities.get(selectUids[i]).entityName;
            if (map.has(nickName)) {
                map.set(nickName, map.get(nickName) + 1);
            } else {
                map.set(nickName, 1);
            }
        }

        let i = 0;
        map.forEach((value, key) => {
            let node = new Node();
            node.layer = Layers.Enum.UI_2D;
            // node.position = new Vec3(0, 0 + i * 20, 0);
            node.addComponent(UITransform).anchorX = 0
            let label = node.addComponent(Label);
            label.fontSize = 15;
            label.lineHeight = 18;
            label.color = new Color("#FFE86D");
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.string = `${key} x${value}`;
            this.node_selectedList.addChild(node);

            i++;
        });
    }
    显示选中单位详情(selectUids: number[]): void {
        if (0 == selectUids.length) {
            this.lable单位详情.string = ''
            return
        }
        let id = selectUids[0]
        let entity = this.scene战斗.entities.get(id)
        let str详情 = this.单位详情(entity, entity.类型)
        this.lable单位详情.string = str详情
    }
     单位详情(entity: ClientEntityComponent, 类型:单位类型): string {
        const 单位 = this.main.配置.find单位(类型)
        const 制造 = this.main.配置.find制造(类型)
        const 战斗 = this.main.配置.find战斗(类型)
        let str详情 = 单位.名字 + '\n'+ 单位.描述 + '\n'
        if (制造) {
            str详情 +=
                '晶体矿:' + 制造.消耗晶体矿 + '\n' +
                '燃气矿:' + 制造.消耗燃气矿 + '\n'
            if (entity)
                str详情 += 'HP:' + entity.hp + '/' + 制造.初始HP + '\n'
            else
                str详情 += '初始HP:' + 制造.初始HP + '\n'
        }
        if (战斗) {
            str详情 +=
                '攻击:' + 战斗.i32攻击 + '\n' +
                '警戒距离:' + 战斗.f警戒距离 + '米\n' +
                '攻击距离:' + 战斗.f攻击距离 + '米\n' +
                '移动速度:' + 战斗.f每帧移动距离 * 10 + '米/秒\n'

            let 前摇毫秒 = 战斗.dura开始播放攻击动作 + 战斗.dura开始伤害
            if (0 < 前摇毫秒)
                str详情 += '攻击前摇:' + 前摇毫秒 + '毫秒\n'

            if (0 < 战斗.dura后摇)
                str详情 += '攻击后摇:' + 战斗.dura后摇 + '毫秒\n'
        }
        return str详情
    }
    on取消点击地面(){
        this.main.fun创建消息 = null
        this.node取消点击地面.active = false
        this.下部列表.active = true
    }
}


