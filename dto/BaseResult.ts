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

    //成功码
    public static readonly STATUS_SUCCESS = 200; //成功码
    public static readonly STATUS_FAIL = 500; //服务器错误码


    //基础成功返回对象
    public static success(message: string = "成功", data: any = {}, success: boolean = true): BaseResult {
        return new BaseResult(message, data, success, this.STATUS_SUCCESS);
    }

    //基础失败返回对象
    public static fail(message: string = "错误", data: any = {}, code: number = this.STATUS_FAIL): BaseResult {
        return new BaseResult(message, data, false, code);
    }
}