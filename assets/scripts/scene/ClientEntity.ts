import { Node, Vec3, Animation, Color, Tween } from 'cc';
import { MainTest } from '../MainTest';
import { Glob } from '../utils/Glob';
import { 单位类型, 属性类型 } from '../utils/Enum';
import { 文本3D } from '../component/文本3D';

export class ClientEntity {
    static myNickName: string;
    view: Node
    nodeName: Node
    node描述: Node
    skeletalAnimation: Animation
    initClipName: string = 'idle'
    init初始动作播放速度: number = 1
    init初始动作Loop: boolean = true
    init初始动作起始时刻秒: number = 0
    init初始动作结束时刻秒: number = 0
    nickName: string
    entityName: string
    描述文本: string = ''
    position: Vec3
    eulerAngles: Vec3
    node血条: Node
    hpMax初始: number = 0
    node能量条: Node
    能量Max: number = 0
    prefabName: string
    类型: 单位类型 = 单位类型.单位类型_Invalid_0
    tween移动: Tween<Node>
    苔蔓半径: number
    obj属性数值: object = new Object()

    hp(): number {
        return this.obj属性数值[属性类型.生命] as number
    }
    能量(): number {
        return this.obj属性数值[属性类型.能量] as number
    }
    removeFromParent() {
        let roles回收池 = this.view && MainTest.instance.scene战斗?.roles回收池
        if(roles回收池) {
            this.view.removeFromParent()
            let node = roles回收池.getChildByName(this.prefabName)
            if(!node) {
                node = new Node(this.prefabName)
                roles回收池.addChild(node)
            }
            node.addChild(this.view)
            this.view.active = false
            {
                const node特效根 = this.view.getChildByName('特效根')
                if(node特效根)
                    node特效根.removeAllChildren()
            }
        } else {
            this.view?.removeFromParent()
        }
        this.tween移动?.stop()
        this.nodeName = null
        this.node描述 = null
        this.描述文本 = ''
        this.node血条 = null
        this.node能量条 = null
    }
    显示头顶名字(b显示单位类型: boolean, b显示名字: boolean): void {
        if (this.node血条) {
            this.node血条.active = b显示名字;
        }

        if (this.node能量条) {
            this.node能量条.active = b显示名字;
        }

        if (this.nodeName?.isValid) {
            this.nodeName.active = b显示名字;
            const lableName3D = this.nodeName.getComponent(文本3D);
            if (lableName3D) {
                lableName3D.颜色 = this.获取头顶名字颜色();
                if (b显示单位类型) {
                    lableName3D.文本 = this.nickName + ' ' + this.entityName;
                } else {
                    lableName3D.文本 = this.nickName;
                }
            }
        }

        if (this.node描述?.isValid) {
            this.node描述.active = b显示名字 && !!this.描述文本;
        }
    }

    获取头顶名字颜色(): Color {
        if (this.类型 == 单位类型.晶体矿 || this.类型 == 单位类型.燃气矿) {
            return new Color(170, 255, 255);
        }
        else if (this.类型 == 单位类型.光刺 || this.类型 == 单位类型.特效) {
            return this.判断是否同玩家名着色子弹();
        }
        else if (this.类型 == 单位类型.视口) {
            return new Color(50, 50, 50);
        }
        else if (this.hp() <= 0) {
            return new Color(130, 130, 130);
        }
        else {
            return this.判断是否同玩家名着色单位();
        }
    }
    判断是否同玩家名着色子弹(): Color {
        if (Glob.myNickName != null) {
            if (this.nickName != Glob.myNickName) {
                return new Color(80, 30, 30);
            }
            else {
                return new Color(30, 80, 30);
            }
        }
        return new Color(80, 80, 80);
    }
    判断是否同玩家名着色单位(): Color {
        if (Glob.myNickName != null) {
            if(this.nickName == '敌人'){
                return new Color(255, 80, 80)
            }

            if (this.nickName == Glob.myNickName){
                return new Color(10, 255, 10);
            }

            let 配置 = MainTest.instance.配置.find战局(MainTest.instance.战局)
            if (配置 && 配置.玩家同阵营) {
                return new Color(150, 255, 150);
            }

            return new Color(255, 50, 50);
        }
        return new Color(255, 255, 255);
    }
}
