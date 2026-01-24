import { l10n } from "db://localization-editor/l10n"
import { 属性类型 } from "../utils/Enum"

/*
对于静态Label组件，用官方 L10nLabel 组件
其它比如RichText这种官方不支持的，全部在 “面板=>本地化编辑器”里，中英文，先到处excel编辑后再导入，代码用 this.richText公告.string = l10n.t(加载中) 强行赋值
*/
export class 翻译Key {
    static Is英语(): boolean {
        console.log('翻译Key.Is英语,l10n.currentLanguage:', l10n.currentLanguage)
        return l10n.currentLanguage === 'en-US'
    }
    static 翻译(key: string): string {
        if(key === undefined || key === null || key === '')
            return ''

        return l10n.t(key)
    }
    /**
     * 格式化翻译字符串，支持 {0}, {1}, {2} 等占位符
     * @param key 翻译key
     * @param args 要替换的参数
     * @returns 格式化后的字符串
     */
    static 翻译格式化(key: string, ...args: any[]): string {
        let str = l10n.t(key)
        return str.replace(/{(\d+)}/g, (match, index) => {
            const idx = parseInt(index)
            return typeof args[idx] !== 'undefined' ? String(args[idx]) : match
        })
    }
    /**
     * 获取属性名称并去除'等级'后缀
     * @param 属性 属性类型枚举值
     * @returns 处理后的属性名称
     */
        static 属性名称翻译(属性: 属性类型): string {
            return 翻译Key.翻译('AttrName_' + 属性)
        }
    static 加载中 = 'Loading'
    static 连接成功 = 'ConnectSuccess' //+ "连接成功，请等待登录结果……"
    static 正在连接 = 'Connecting' //'正在连接'
    static 连接错误 = 'ConnectError' //'连接错误，您可以再试一次'
    static 连接已断开 = 'ConnectClosed' //'连接已断开，已回到登录场景'
    static 请输入昵称 = 'PleaseInputNickname' //'请输入昵称（随便什么都可以）'
    static url公告 = 'urlNotice'
    static url公告左 = 'urlNoticeLeft'
    static url游戏攻略 = 'urlGameStrategy'
    static 健康游戏忠告 = 'JianKangYouXiZhongDao'
    static 多玩家混战 = 'DuoWanJiaHunZhan'
    static 多玩家混战_沙漠 = 'DuoWanJiaHunZhan_ShaMo'
    static 四方对战 = 'SiFangDuiZhan'
    static 一打一 = 'YiDaYi'
    static 中央防守_玩家合作 = 'ZhongYangFangShou_WanJiaHeZuo'
    static 加入其他玩家的多人战局 = 'JiaRuDuoRenZhanJu'

    static 单位 = 'Unit'//'共' + scene战斗.entities.size + '单位'
    static 生命 = 'Hp'//'生命:${当前生命}/${最大生命}'
    static 经验 = 'Exp'//'经验:${经验}/${升级配置.本级满经验}'
    static 等级 = 'Level'//'等级:${entity.等级()}'
    static 满级 = 'MaxLevel'//'等级:${entity.等级()}满级'
    static 人在线 = 'RenZaiXian'//'${count}人在线:'
    static 等级格式 = 'LevelFormat'//'Level {0}' 格式字符串，{0}会被替换为等级数字
    static 聊天历史记录 = 'ChatHistory'//'聊天历史记录'
    static 游戏攻略 = 'GameStrategy'//'游戏攻略'
    static 每次发射 = 'ProjectileFireCount'//'每次发射{0}个' 格式字符串
    static 每间隔发射 = 'ProjectileFireInterval'//'每间隔{0}毫秒发射一个' 格式字符串
    static 可穿透 = 'ProjectilePenetrate'//'可穿透{0}个敌人' 格式字符串
    static 后摇 = 'ProjectileAfterDelay'//'后摇: {0}毫秒' 格式字符串
    static 射程 = 'ProjectileRange'//'射程: {0}{1}米' 格式字符串，{0}是基础射程，{1}是增程（可能为空或+XX）
    static 火焰Buff伤害 = 'FlameBuffDamage'//'每{0}毫秒降低{1}生命，持续{2}毫秒' 格式字符串
    static 锥体范围 = 'FlameConeRange'//'锥体范围: {0}{1}米' 格式字符串，{0}是基础射程，{1}是增程（可能为空或+XX）
    static 锥体角度 = 'FlameConeAngle'//'锥体角度: {0}°' 格式字符串
    static 射程增程 = 'RangeBonus'//'投射物射程: +{0}米' 格式字符串，中英文格式可能不同
    static 场景加载完成 = 'SceneLoaded' //'场景加载完成！'
    static 升级 = 'Upgrade' //'升级'
    static 个配置文件正在下载中 = 'CountConfigFileDownloading' //'个配置文件正在下载中，请稍后再试' 格式字符串
    static 贡献者名单 = 'ContributorsList' //'贡献者名单'
    static 单玩家战局 = 'SinglePlayerBattle'
    static 多玩家战局 = 'MultiPlayerBattle'
    static 音乐鉴赏 = 'MusicGallery'
    static 返回上一级 = 'BackToPreMenu'
    static 曲名 = 'MusicName'
    static 作者 = 'MusicAuthor'
    static 版权 = 'MusicCopyright'
    static 赢 = 'Win'
    static 输 = 'Loss'
    static 的战局 = 'DeZhanJv'
    static 晶体矿 = 'JingTiKuang'
    static 燃气矿 = 'RanQiKuang'
    static 活动单位 = 'HuoDongDanWei'
    static 建筑单位 = 'JianZhuDanWei'
    static 已开始框选请拖动后放开 = 'YiKaiShiKuangXuanQingTuoDongHouFangKai'
    static 已退出框选状态 = 'YiTuiChuKuangXuanZhuangTai'
    static 攻击 = 'GongJi'
    static 防御 = 'FangYu'
    static 移动速度 = 'YiDongSuDu'
    static 警戒距离 = 'JingJieJvLi'
    static 攻击距离 = 'GongJiJvLi'
    static 攻击前摇 = 'GongJiQianYao'
    static 攻击后摇 = 'GongJiHouYao'
    static 毫秒 = 'HaoMiao'
    static 米 = 'Mi'
    static 秒 = 'Miao'
    static 初始HP = 'ChuShiHP'
    static 米_秒 = 'Mi_Miao'//'米/秒'
    static 请点击地面放置建筑 = 'QingDianJiDiMianZhiZhiJianZhu'//'请点击地面放置建筑'
    static 请点击要跟随的目标单位 = 'QingDianJiYaoGenSuiDeMuBiaoDanWei'//'请点击要跟随的目标单位'
    static 请点击地面设置巡逻点 = 'QingDianJiDiMianZhiZhiXunLvDian'//'请点击地面设置巡逻点'
    static 请点击地面确定强行走目的地 = 'QingDianJiDiMianZhiZhiQiangZouXingDiMuDi'//'强行走过程不会攻击敌人，请点击地面确定目的地'
    static 请点击地面设置此建筑产出活动单位的集结点 = 'QingDianJiDiMianZhiZhiSheZhiCiJianZhuChanChuHuoDongDanWeiDeJiJiDian'//'请点击地面设置此建筑产出活动单位的集结点'
    static 请在屏幕上拖动以框选单位 = 'QingZaiPingMuShangTuoDongYiKuangXuanDanWei'//'请在屏幕上拖动以框选单位'
    static 请在选中太岁的苔蔓wàn上放置分裂的太岁 = 'QingZaiXuanZhongTaiShuiDeTaiManWanShangFangZhiFenLieDeTaiShui'//'请在选中太岁的苔蔓(wàn)上放置分裂的太岁'
    static 菱形框选 = 'LingXingKuangXuan'
    static 正矩形框选 = 'ZhengJuXingKuangXuan'
    static 模式 = 'MoShi'
    static 已切换到 = 'YiQieHuanDao'
    static 已添加为巡逻点 = 'YiTianJiaWeiXunLvDian'//已添加为巡逻点，请继续点击地面添加巡逻点，或点击“确定”提交巡逻点列表
    static 没有可移动的战斗单位 = 'MeiYouKeYiDongDeZhanDouDanWei'//没有可移动的战斗单位
    static 请先选中建筑单位 = 'QingXianXuanZhongJianZhuDanWei'//请先选中建筑单位
    static 请先选中太岁 = 'QingXianXuanZhongTaiShui'//请先选中太岁
    static 战报 = 'ZhanBao'//战报
    static 战报不存在 = 'ZhanBaoBuCunZai'//
    static 的 = 'De'//  的 
    static 击败了 = 'JiBaiLe'//击败了
    static 损失单位排行 = 'SunShiDanWeiPaiHang'//损失单位排行
    static 共损失 = 'GongSunShi'//共损失
    static 击败单位排行 = 'JiBaiDanWeiPaiHang'//击败单位排行
    static 共击败 = 'GongJiBai'//共击败
}