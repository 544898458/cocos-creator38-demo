import { RichText } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { 单位类型, 配置, 单位配置 } from '../配置/配置';
import { BattleUI } from '../mode/BattleUI';
import { Enum } from 'cc';
import { EventTouch } from 'cc';
import { Vec2 } from 'cc';
import { string } from 'yaml/dist/schema/common/string';
import { 按下按钮显示详情Component } from './按下按钮显示详情Component';
const { ccclass, property } = _decorator;

@ccclass('按下按钮显示单位详情')
export class 按下按钮显示单位详情Component extends 按下按钮显示详情Component {
    @property({ type: Enum(单位类型), displayName: "单位" })
    enum类型: 单位类型 = 单位类型.单位类型_Invalid_0

    详情(): string {
        this.battleUI.node按钮详情.active = true
        return this.battleUI.单位详情(null, this.enum类型)
    }
}