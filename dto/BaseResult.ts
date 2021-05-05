//基础返回数据对象类
export default class BaseResult {
    /**
     * 构造器
     * @param message 信息
     * @param data  数据
     * @param success  是否成功
     * @param code  状态码
     */
    constructor(public message: string, public data: any, public success: boolean, public code: number) {
    }

    //请求参数
    params;
    //所属api
    api;
    //错误码
    public static readonly STATUS_FAIL = 500; //服务器错误码
    public static readonly NOT_AS_EXPECT = 501; //不符合预期
    //成功码
    public static readonly STATUS_SUCCESS = 200; //成功码
    public static readonly NOT_IN_ACTIVE_TIME = 201; //不在活动时间内
    public static readonly LOGIC_FAIL = 222; //逻辑失败
    private static readonly NO_AUTH = 223; //用户没有授权
    private static readonly PARAMS_ERROR = 224; //用户没有授权


    //基础成功返回对象
    public static success(
        {
            message = "成功",
            data = {},
            success = true
        } = {}
    ): BaseResult {
        return new BaseResult(message, data, success, this.STATUS_SUCCESS);
    }

    //基础失败返回对象
    public static fail(
        {
            message = "网络繁忙",
            data = {},
            code = this.STATUS_FAIL
        } = {}
    ): BaseResult {
        return new BaseResult(message, data, false, code);
    }

    public set201() {
        this.message = '不在活动时间内';
        this.code = BaseResult.NOT_IN_ACTIVE_TIME;
    }

    public set501() {
        this.message = '网络繁忙';
        this.code = BaseResult.NOT_AS_EXPECT;
    }

    public set223() {
        this.message = '用户没有授权';
        this.code = BaseResult.NO_AUTH;
    }

    public set224(message = "缺少必要参数") {
        this.message = message;
        this.code = BaseResult.PARAMS_ERROR;
    }

    public set222(message?: string) {
        this.message = message || "网络繁忙";
        this.code = BaseResult.LOGIC_FAIL;
    }
}
