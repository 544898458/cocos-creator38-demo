
import { _decorator, Component, Node } from 'cc';
import { 配置, 单位配置 } from '../配置/配置';
import { 按下按钮显示详情Component } from './按下按钮显示详情Component';
import { CCString } from 'cc';
import { 翻译Key } from '../配置/翻译Key';
const { ccclass, property } = _decorator;

@ccclass('按下按钮显示文本详情')
export class 按下按钮显示文本详情Component extends 按下按钮显示详情Component {
    @property({ type: CCString })
    str详情Key: string

    详情(): string {
        return 翻译Key.翻译(this.str详情Key)
    }
}
