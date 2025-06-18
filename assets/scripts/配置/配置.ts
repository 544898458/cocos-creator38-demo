import { TextAsset } from 'cc';
import { assetManager } from 'cc';
import { parse } from 'yaml'


export
	/// <summary>
	/// 网页强制要求协议:外层是二进制WS(WebSocket)，二进制用 MsgPack 序列化
	/// 微信小程序强制要求协议：外层是WSS，也就是三层，最外层TLS1.3，中间是二进制WS(WebSocket)，最里面是 MsgPack 序列化
	/// </summary>
	enum MsgId {
	/// <summary>
	/// 无效
	/// </summary>
	MsgId_Invalid_0,
	/// <summary>
	/// 登录 
	/// C=>S MsgLogin
	/// S=>C 回应MsgLoginResponce
	/// </summary>
	Login,
	/// <summary>
	/// 请求把选中的单位移动到目标位置
	/// C=>S MsgMove
	/// </summary>
	Move,
	/// <summary>
	/// 场景中加单位，通知前端
	/// S=>C MsgAddRoleRet
	/// </summary>
	AddRoleRet,
	/// <summary>
	/// 通知前端，单位位置和血量变化
	/// S=>C MsgNotifyPos
	/// </summary>
	NotifyPos,
	/// <summary>
	/// 通知前端，单位播放骨骼动画（动作）
	/// S=>C MsgChangeSkeleAnim
	/// </summary>
	ChangeSkeleAnim,
	/// <summary>
	/// 系统提示和玩家聊天
	/// S=>C C=>S MsgSay 
	/// </summary>
	Say,
	/// <summary>
	/// 玩家请求选中单位
	/// C=>S	MsgSelectRoles
	/// </summary>
	SelectRoles,
	/// <summary>
	/// 玩家请求造活动单位（训练兵、近战兵，制造工程车、坦克）
	/// C=>S MsgAddRole
	/// </summary>
	AddRole,
	/// <summary>
	/// 通知前端删除一个单位
	/// S=>C MsgDelRoleRet
	/// </summary>
	DelRoleRet,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	ChangeMoney,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	ChangeMoneyResponce,
	/// <summary>
	/// 玩家请求建造建筑单位
	/// C=>S MsgAddBuilding
	/// </summary>
	AddBuilding,
	/// <summary>
	/// 通知前端钱变化（现在钱没用，前端不会显示，所以不用做。从策划上来说，钱属于局外数据）
	/// </summary>
	NotifyeMoney,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	Gate转发,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateAddSession,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateAddSessionResponce,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateDeleteSession,
	/// <summary>
	/// 后台进程间内部通信
	/// </summary>
	GateDeleteSessionResponce,
	/// <summary>
	/// 玩家请求采集
	/// </summary>
	采集,
	/// <summary>
	/// 通知前端，燃气矿、晶体矿、活动单位数
	/// Msg资源
	/// </summary>
	资源,
	/// <summary>
	/// 玩家请求选中的单位进地堡
	/// </summary>
	进地堡,
	/// <summary>
	/// 玩家请求选中的地堡中的兵全部出来
	/// </summary>
	出地堡,
	/// <summary>
	/// 玩家请求进公共地图（多人联机地图）
	/// C=>S 成功后 S=>C
	/// 注意：进单人剧情副本成功、进多人对局成功，也是发给前端 Msg进Space
	/// </summary>
	进Space,
	/// <summary>
	/// 玩家请求进单人剧情副本（训练战、防守战）
	/// </summary>
	进单人剧情副本,
	/// <summary>
	/// 没用
	/// </summary>
	显示界面_没用到,
	/// <summary>
	/// 玩家请求离开公共地图（多人联机地图）
	/// </summary>
	离开Space,
	/// <summary>
	/// 通知前端显示单位描述（建造进度、训练活动单位进度、采集进度）
	/// </summary>
	Entity描述,
	/// <summary>
	/// 通知前端播放语音或音效
	/// </summary>
	播放声音,
	/// <summary>
	/// 让玩家摄像机对准某处
	/// </summary>
	设置视口,
	/// <summary>
	/// 玩家请求框选单位
	/// C=>S
	/// </summary>
	框选,
	/// <summary>
	/// 玩家拉取全局个人战局列表
	/// </summary>
	玩家个人战局列表,
	/// <summary>
	/// 玩家请求进别人的个人战局（训练战、防守战）
	/// </summary>
	进其他玩家个人战局,
	/// <summary>
	/// 创建多人战局（四方对战）
	/// </summary>
	创建多人战局,
	/// <summary>
	/// 拉取全局多人战局列表
	/// </summary>
	玩家多人战局列表,
	/// <summary>
	/// 进别人的多人战局
	/// </summary>
	进其他玩家多人战局,
	/// <summary>
	/// 选中空闲工程车
	/// </summary>
	切换空闲工程车,
	/// <summary>
	/// 通知前端播放光子炮攻击特效（从光子炮飞向目标）
	/// </summary>
	弹丸特效,
	/// <summary>
	/// 通知前端显示剧情对话界面
	/// S=>C
	/// </summary>
	剧情对话,
	/// <summary>
	/// 前端告诉服务器已经看完此页剧情对话
	/// C=>S
	/// </summary>
	剧情对话已看完,
	在线人数,
	GateSvr转发GameSvr消息给游戏前端,
	GateSvr转发WorldSvr消息给游戏前端,
	建筑产出活动单位的集结点,
	播放音乐,
	原地坚守,
	解锁单位,
	已解锁单位,
	单位属性等级,
	升级单位属性,
	苔蔓半径,
	太岁分裂,
	Notify属性,
	进房虫,
	出房虫,
};

export
	enum 单位类型 {
	单位类型_Invalid_0,

	特效,
	视口,
	苔蔓,	//Creep
	方墩,	//玩家造的阻挡

	资源Min非法 = 100,
	晶体矿,//Minerals
	燃气矿,//Vespene Gas


	活动单位Min非法 = 200,
	工程车,//空间工程车Space Construction Vehicle。可以采矿，采气，也可以简单攻击
	枪兵,//陆战队员Marine。只能攻击，不能采矿
	近战兵,//火蝠，喷火兵Firebat
	三色坦克,
	工虫,
	飞机,
	枪虫,//Hydralisk
	近战虫,//Zergling
	幼虫,//Larva
	绿色坦克,//虫群单位，实际上是生物体
	光刺,//由绿色坦克发射，直线前进，遇敌爆炸
	房虫,//overload
	飞虫,//Mutalisk
	医疗兵,//Medic,

	活动单位Max非法,

	建筑Min非法 = 300,
	基地,//指挥中心(Command Center),用来造工程车()
	兵厂,//兵营(Barracks)，用来造兵
	民房,//供给站(Supply Depot)
	地堡,//掩体; 地堡(Bunker),可以进兵
	炮台,//Photon Cannon
	虫巢,//hatchery
	机场,//Spaceport
	重车厂,//Factory 
	虫营,//对应兵营
	飞塔,//Spore Conlony
	拟态源,//拟态源，原创，绿色坦克前置建筑
	太岁,	//Creep Colony

	建筑Max非法,

	怪Min非法 = 400,
	枪虫怪,
	近战虫怪,
	工虫怪,
	枪兵怪,
	近战兵怪,
	怪Max非法,
};

export enum 属性类型 {
	属性类型_最小_无效,
	攻击,
	防御,
	/// <summary>
	/// HP、血量
	/// </summary>
	生命,
	移动速度,
	/// <summary>
	/// 毫秒
	/// </summary>
	攻击前摇_伤害耗时,
	/// <summary>
	/// 米
	/// </summary>
	攻击距离,
	最大生命,
	/// <summary>
	/// 医疗兵、蝎子
	/// </summary>
	能量,
	最大能量,

	属性类型_最大_无效,
}

export class 单位配置 {
	类型: 单位类型
	名字: string
	空闲动作: string
	动画节点路径: string
	描述: string
	受击高度: number
}
export class 战斗配置 {
	类型: 单位类型
	f警戒距离: number
	f攻击距离: number
	攻击: number
	防御: number
	f每帧移动距离: number
	dura开始播放攻击动作: number//毫秒，（前摇第1部分）
	str攻击动作: string	
	str弹丸特效: string
	f弹丸起始高度: number
	dura开始伤害: number//毫秒，（前摇第2部分）
	dura后摇: number//毫秒
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
	str寻路文件名: string
	strHttps音乐: string
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

		let url = 'https://www.rtsgame.online/配置/'
		// let url = 'https://www.rtsgame.online/配置2/'
		assetManager.loadRemote(url + strName + '.yaml', { ext: '.txt' },
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