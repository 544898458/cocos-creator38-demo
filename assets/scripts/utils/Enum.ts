export enum Layer {
    // 场景层
    SCENE,
    // ui层
    UI,
    UI_TOP,
    // 弹框层
    ALERT,
    // 提示层
    TIPS,
    // 最顶层，加载界面
    TOP
}

export enum 战局类型 {
	单人ID_非法_MIN,
	新手训练_单位介绍_人,
	新手训练_单位介绍_虫,
	新手训练_反空降战_人,
	新手训练_空降战_虫,
	新手训练_战斗_人,
	新手训练_战斗_虫,
	防守战_人,
	防守战_虫,
	攻坚战_人,
	攻坚战_虫,
    中央防守_人,
    新手训练_防空战_人,
	单人ID_非法_MAX,

	多人ID_非法_MIN = 100,
	四方对战,
    一打一,
	多人ID_非法_MAX,

	多人混战ID_非法_MIN = 200,
	多玩家混战,
    多玩家混战_圆坑,
	多人混战ID_非法_MAX
}

export enum SayChannel {
    系统,
    聊天,
    任务提示,
};
export enum LoginResult {
    OK,
    Busy,
    PwdErr,
    NameErr,
    客户端版本不匹配,
};
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
    战局结束,
    跟随,
	取消跟随,
	击杀,
    删除自己的单位,
    巡逻,
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
    防空兵,

    活动单位Max非法,

    建筑Min非法 = 300,
    基地,//指挥中心(Command Center),用来造工程车()
    兵营,//兵营(Barracks)，用来造兵
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
};


export enum 种族
{
	无,//资源
	人,
	虫,
	神,
};