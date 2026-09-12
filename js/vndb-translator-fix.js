// ==UserScript==
// @name         VNDBTranslatorLib
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  VNDB优先原文和中文化的库
// @author       aotmd
// @license MIT
// ==/UserScript==
/*todo 效率文本:添加粗翻标记°:查找:(".*?")(: )"(.*?)"(,.*?)$ 替换:$1$2"$3°"$4*/
/*todo 效率文本:将键值对转换为只有值:查找:(".*?")(: )"(.*?)(",?.*?)$ 替换:$3*/
/*todo 翻译最后加°号表示粗翻,加'号表示无法找到准确翻译*/
/**-------------------------------数据部分[6430行]-------------------------------------*/
/**
 * 通用文本翻译主Map,作用在全局。
 * 用以替换普通固定文本。
 * 出于性能考虑,mainMap会一直为Object类型
 * @type {{Object}}
 * */
let mainMap = {
    /**左侧栏[常驻]*/
    /*菜单*/
    "Support VNDB": "赞助 VNDB",
    "Patreon": "Patreon",
    "SubscribeStar": "SubscribeStar",
    "Menu": "菜单",
    "Home": "首页",
    "Visual novels": "视觉小说",
    "Tags": "标签",
    "Releases": "版本",
    "Producers": "制作人",
    "Staff": "工作人员",
    "Characters": "人物",
    "Traits": "特征",
    "Users": "用户",
    "Recent changes": "最近更改",
    "Discussion board": "讨论区",
    "FAQ": "常见问题",
    "Random visual novel": "随机视觉小说",
    "Dumps": "转储",
    "API": "API",
    "Query": "查询",
    "Search": "搜索",
    "search": "搜索",
    /*我的*/
    "My Profile": "我的个人资料",
    "My Visual Novel List": "我的视觉小说列表",
    "My Votes": "我的评分",
    "My Wishlist": "我的愿望单",
    "My Notifications": "我的通知",
    "My Recent Changes": "我的最近更改",
