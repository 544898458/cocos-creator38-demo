
import { _decorator, Component, Node } from 'cc';
import { 单位类型, 配置, 单位配置 } from '../配置/配置';
import { 按下按钮显示详情Component } from './按下按钮显示详情Component';
import { CCString } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('按下按钮显示文本详情')
export class 按下按钮显示文本详情Component extends 按下按钮显示详情Component {
    @property({ type: CCString })
    str详情: String

    详情(): String {

        return this.str详情
    }
}
