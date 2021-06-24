export default class Spm {
    //活动ID
    activityId: string;
    //统计类型
    type: string;
    //时间戳
    timestamp: number;
    //时间字符串
    time: string;
    //日期字符串
    date: string;
    //附带数据
    data: any;
    //用户名
    nick: string;
    //用户OpenId
    openId: string;
    //混淆昵称
    mixNick: string;
    //天index
    dayIndex: number;
    //总index
    totalIndex: number;

    cover(coverData: any) {
        Object.assign(this, coverData);
        return this;
    }

    extData(extData: any) {
        Object.assign(this.data, extData);
        return this;
    }
}


export {Spm as XSpm}
