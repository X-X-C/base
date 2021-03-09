import Utils from "./utils/Utils";
import BaseResult from "./dto/BaseResult";
import ErrorLogService from "./service/ErrorLogService";
import ServiceManager from "./service/abstract/ServiceManager";
import SpmService from "./service/SpmService";
import BaseActivityService from "./service/BaseActivityService";
import Spm from "./entity/Spm";

export default class App {

    constructor(public context: any, public apiName: string) {
        this.services = new ServiceManager(this);
        this.spmService = this.services.getService(SpmService);
        this.status = 1;
    }

    services: ServiceManager;
    config = {
        //全局请求参数
        needParams: <checkType>{},
        //每次请求所需参数
        runNeedParams: <checkType>{},
        //是否开启全局活动
        globalActivity: false,
        //是否检查活动时间
        inspectionActivity: false
    }
    spmService: SpmService;
    // 全局返回值
    response: BaseResult;
    //埋点数组
    spmBeans: Spm[] = [];
    //全局活动
    globalActivity: activityData;
    //程序状态 0--中断，1--运行
    status: 0 | 1;

    set globalNeedParams(v: checkType) {
        this.config.needParams = v;
    }

    set runNeedParams(v: checkType) {
        this.config.runNeedParams = v;
    }

    get setGlobalActivity() {
        this.config.globalActivity = true;
        return;
    }

    get inspectionActivity() {
        this.config.inspectionActivity = true;
        return;
    }

    /**
     * 运行方法 可以捕获异常并处理
     * @param doSomething
     */
    async run(doSomething: Function): Promise<BaseResult> {
        this.response = BaseResult.success();
        //保存原始请求参数
        let params = Utils.deepClone(this.context.data);
        this.response.params = params;
        let result = null;
        try {
            let needParams = {
                ...this.config.needParams,
                ...this.config.runNeedParams
            }
            result = Utils.checkNeed(params, needParams);
            if (result.success === false) return result;
            //重置运行参数
            this.runNeedParams = {};
            //运行前系统检查
            await this.before();
            //系统状态正常
            if (this.status === 1) {
                await doSomething.call(this.context.data);
            }
            //运行结束添加本次埋点
            await this.spmService.insertMany(this.spmBeans);
        } catch (e) {
            let errorLogService = this.services.getService(ErrorLogService)
            await errorLogService.add(e);
            if (e instanceof BaseResult) {
                this.response = e;
            } else {
                this.response = BaseResult.fail({
                    message: e.message,
                    data: e
                });
            }
        }
        //清空埋点
        this.spmBeans = [];
        return this.response;
    }

    async before() {
        let setGlobalActivity = async () => {
            if (!this.globalActivity) {
                let activityService = this.getService(BaseActivityService);
                this.globalActivity = await activityService.getActivity();
            }
        }
        let inspectionActivity = async () => {
            await setGlobalActivity();
            if (this.globalActivity.code !== 1) {
                this.response.set201();
                this.status = 0;
            }
        }
        let inspection = async (f: Function) => {
            if (this.status === 1) {
                await f();
            }
        }
        if (this.config.globalActivity === true) {
            await setGlobalActivity();
        }
        if (this.config.inspectionActivity === true) {
            await inspection(inspectionActivity);
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
