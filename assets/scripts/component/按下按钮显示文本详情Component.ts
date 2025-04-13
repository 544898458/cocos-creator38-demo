import { RichText } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { 单位类型, 配置, 单位配置 } from '../配置/配置';
import { BattleUI } from '../mode/BattleUI';
import { Enum } from 'cc';
import { EventTouch } from 'cc';
import { Vec2 } from 'cc';
import { 按下按钮显示详情Component } from './按下按钮显示详情Component';
const { ccclass, property } = _decorator;

@ccclass('按下按钮显示文本详情')
export class 按下按钮显示文本详情Component extends 按下按钮显示详情Component {
    @property
    str详情: string

    详情(): string {
        return this.str详情
    }
}
