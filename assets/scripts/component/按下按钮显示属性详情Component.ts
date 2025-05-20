import { _decorator, Component, Node } from 'cc';
import { 按下按钮显示详情Component } from './按下按钮显示详情Component';
import { 属性类型, 单位类型 } from '../配置/配置';
import { Enum } from 'cc';
import { MainTest } from '../MainTest';
const { ccclass, property } = _decorator;

@ccclass('按下按钮显示属性详情')
export class 按下按钮显示属性详情Component extends 按下按钮显示详情Component {
    @property({ type: Enum(单位类型) })
    enum单位: 单位类型

    @property({ type: Enum(属性类型) })
    enum属性: 属性类型

    详情(): string {
        // 获取枚举键名
        const enumKeys = Object.keys(属性类型);
        const enumValues = Object.values(属性类型);
        const 属性名称 = enumKeys[enumValues.indexOf(this.enum属性)];


        let 单位属性 = MainTest.instance.scene战斗.obj属性等级[this.enum单位]
        let 当前属性等级: number = 单位属性 ? (单位属性[this.enum属性] ?? 0) : 0



        let 当前加数值 = MainTest.instance.scene战斗.battleUI.main.配置.find单位属性等级加数值(this.enum单位, this.enum属性, 当前属性等级) ?? 0
        const 当前加数值WithSign = 当前加数值 >= 0 ? `+${当前加数值}` : `${当前加数值}`;
        let str: string = '当前:\n' + 属性名称 + ': ' + 当前加数值WithSign + '(' + 当前属性等级 + '级)'

        let 升级后等级 = 当前属性等级 + 1
        let 升级后加数值 = MainTest.instance.scene战斗.battleUI.main.配置.find单位属性等级加数值(this.enum单位, this.enum属性, 升级后等级)
        if (升级后加数值) {
            let 升级后加数值WithSign = 升级后加数值 >= 0 ? `+${升级后加数值}` : `${升级后加数值}`;
            if (属性类型.攻击前摇_伤害耗时 == this.enum属性)
                升级后加数值WithSign += '毫秒'

            str += '\n\n升级后:\n' + 属性名称 + ': ' + 升级后加数值WithSign + '(' + 升级后等级 + '级)'
        }
        else
            str += '\n\n已满级'


        return str
    }
}


