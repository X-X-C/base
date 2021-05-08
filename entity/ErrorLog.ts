export default class ErrorLog {
    //错误信息
    message: any = "";
    //活动ID
    activityId: string;
    //错误API
    api: string;
    //请求参数
    params: object = {};
    //用户
    nick: string;
    //openId
    openId: string;
    //时间
    time: string;
    //详情
    desc: any;
    //级别
    level: "error" | "logic";
}



