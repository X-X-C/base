import Utils from "./utils/Utils";
import BaseResult from "./dto/BaseResult";
import ErrorLogService from "./service/ErrorLogService";
import ServiceManager from "./service/abstract/ServiceManager";
import SpmService from "./service/SpmService";
import BaseActivityService from "./service/BaseActivityService";

export default class App {

    constructor(public context: any, public apiName: string) {
        this.services = new ServiceManager(this);
        this.spmService = this.services.getService(SpmService);
        this.status = 1;
    }

    services: ServiceManager;
    config = {
        //全局请求参数
        needParams: [],
        //是否开启全局活动
        globalActivity: false,
        //是否检查活动时间
        inspectionActivity: false
    }
    response: BaseResult;
    spmService: SpmService;
    //埋点数组
    spmBeans = [];
    globalActivity: activityData;
    //程序状态 0--中断，1--运行
    status: 0 | 1;

    /**
     * 运行方法 可以捕获异常并处理
     * @param doSomething
     * @param needParams 所需参数 { name: "" }
     */
    async run(doSomething: Function, needParams: string[] = []): Promise<BaseResult> {
        this.response = BaseResult.success();
        //保存原始请求参数
        let params = Utils.deepClone(this.context.data);
        this.response.params = params;
        let result = null;
        try {
            needParams = needParams.concat(this.config.needParams);
            //判断参数是否符合条件
            result = Utils.checkParams(needParams, params);
            if (result.success === false) return result;
            //运行前系统检查
            await this.before();
            //系统状态正常
            if (this.status === 1) {
                await doSomething.call(this.context.data);
            }
            //运行结束添加本次埋点
            await this.spmService.insertMany(this.spmBeans);
        } catch (e) {
            if (e instanceof BaseResult) {
                this.response = e;
            } else {
                this.response = BaseResult.fail(e.message, e);
            }
            this.response.api = this.apiName;
            this.response.params = params;

            let errorLogService = this.services.getService(ErrorLogService)
            await errorLogService.add(this.response);
        }
        //清空埋点
        this.spmBeans = [];
        return this.response;
    }

    async before() {
        //如果配置了全局活动，且没有获取过
        if (this.config.globalActivity === true && !this.globalActivity) {
            let activityService = this.getService(BaseActivityService);
            //设置全局活动
            this.globalActivity = await activityService.getActivity(activityService.pureFiled);
            //检查活动状态
            if (this.config.inspectionActivity === true) {
                //不在活动范围内
                if (this.globalActivity.code !== 1) {
                    this.response.set201();
                    this.status = 0;
                    return;
                }
            }
        }
    }

    async addSpm(type, data?, ext?) {
        this.spmBeans.push(
            await this.spmService.bean(type, data, ext)
        );
    }

    async addSimpleSpm(type, data?, ext?) {
        this.spmBeans.push(
            await this.spmService.simpleBean(type, data, ext)
        );
    }

    /**
     * 清空指定的表
     * @param tbs
     */
    async cleanTables(tbs: any[] = []): Promise<string> {
        let result = null, data = "";
        for (const tb of tbs) {
            result = await this.db(tb).deleteMany({_id: {$ne: 0}});
            data += `成功删除${tb}下的${result}条数据`;
            result = null;
        }
        return data;
    }

    /**
     * 获取数据库连接
     * @param tb 表名
     */
    db(tb: string) {
        return this.context.cloud.db.collection(tb);
    }

    getService<T>(clazz: new(...args: any) => T): T {
        return this.services.getService(clazz);
    }
}
