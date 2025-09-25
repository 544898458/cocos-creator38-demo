import { TextAsset } from 'cc';
import { assetManager } from 'cc';
import { parse } from 'yaml'
import { 单位类型, 属性类型, 战局类型 } from '../utils/Enum';

export class 动作 {
	名字或索引: string
	播放速度: number
	起始时刻秒: number
	结束时刻秒: number
}
export class 单位配置 {
	类型: 单位类型
	名字: string
	空闲动作: 动作
	动画节点路径: string
	描述: string
	受击高度: number
	是骨骼动画: boolean
}
export class 战斗配置 {
	类型: 单位类型
	f警戒距离: number
	f攻击距离: number
	攻击: number
	防御: number
	f每帧移动距离: number
	dura开始播放攻击动作: number//毫秒，（前摇第1部分）
	攻击动作: 动作
	str弹丸特效: string
	f弹丸起始高度: number
	dura开始伤害: number//毫秒，（前摇第2部分）
	dura后摇: number//毫秒
	b可打空中: boolean
	b可打地面: boolean
}
export class 制造配置 {
	类型: 单位类型
	消耗晶体矿: number
	消耗燃气矿: number
	初始HP: number
}
export class 活动单位配置 {
	类型: 单位类型
}
export class 单位属性等级配置 {
	类型: 单位类型
	属性: 属性类型
	等级: number
	数值: number
}
export class 建筑单位配置 {
	类型: 单位类型
	f半边长: number
}
export class 战局配置 {
	类型: 战局类型
	strSceneName: string
	寻路文件名: string
	Https音乐: string
	MeshRenderer路径: string
	Https高清贴图: string
}

export class 配置 {
	arr单位: Array<单位配置>
	arr战斗: Array<战斗配置>
	arr制造: Array<制造配置>
	arr活动单位: Array<活动单位配置>
	arr建筑单位: Array<建筑单位配置>
	arr单位属性等级: Array<单位属性等级配置>
	arr战局: Array<战局配置>
	读取配置文件() {
		this.读取1个配置文件<单位配置>('单位', (arr) => this.arr单位 = arr)
		this.读取1个配置文件<战斗配置>('战斗', (arr) => this.arr战斗 = arr)
		this.读取1个配置文件<制造配置>('制造', (arr) => this.arr制造 = arr)
		this.读取1个配置文件<活动单位配置>('活动单位', (arr) => this.arr活动单位 = arr)
		this.读取1个配置文件<建筑单位配置>('建筑单位', (arr) => this.arr建筑单位 = arr)
		this.读取1个配置文件<单位属性等级配置>('单位属性等级', (arr) => this.arr单位属性等级 = arr)
		this.读取1个配置文件<战局配置>('战局', (arr) => this.arr战局 = arr)
	}
	读取1个配置文件<T>(strName: string, fun: (arr: Array<T>) => void) {

		let url = 'https://www.rtsgame.online/配置/'	//改兵营模型	版本35
		// let url = 'https://www.rtsgame.online/配置2/'	//改机场模型
		assetManager.loadRemote(encodeURI(url + strName + '.yaml'), { ext: '.txt' },
			(err, textAsset: TextAsset) => {
				console.log(err, textAsset)
				let arr = parse(textAsset.text) as Array<T>;
				arr.forEach((配置: T) => { console.log(配置) })
				fun(arr)
			})
	}
	find战斗(类型: 单位类型): 战斗配置 {
		return this.arr战斗.find((v) => v.类型 == 类型)
	}
	find单位(类型: 单位类型): 单位配置 {
		return this.arr单位.find((v) => v.类型 == 类型)
	}
	find制造(类型: 单位类型): 制造配置 {
		return this.arr制造.find((v) => v.类型 == 类型)
	}
	find活动单位(类型: 单位类型): 活动单位配置 {
		return this.arr活动单位.find((v) => v.类型 == 类型)
	}
	find建筑单位(类型: 单位类型): 建筑单位配置 {
		return this.arr建筑单位.find((v) => v.类型 == 类型)
	}
	find单位属性等级加数值(单位: 单位类型, 属性: 属性类型, 等级: number) {
		return this.arr单位属性等级.find((v) => v.类型 == 单位 && v.属性 == 属性 && v.等级 == 等级)?.数值
	}
	find战局(类型: 战局类型): 战局配置 {
		return this.arr战局.find((v) => v.类型 == 类型)
	}
}