import Utils from "./utils/Utils";
import BaseResult from "./dto/BaseResult";
import XErrorLogService from "./service/XErrorLogService";
import ServiceManager from "./service/abstract/ServiceManager";
import XSpmService from "./service/XSpmService";
import XActivityService from "./service/XActivityService";
import Spm from "./entity/Spm";

export default class App {

    constructor(public context: any, public apiName: string) {
        this.services = new ServiceManager(this);
        this.status = 1;
    }

    services: ServiceManager;
    config = {
        //全局请求参数
        needParams: <checkType>{
            // activityId: "string"
        },
        //每次请求所需参数
        runNeedParams: <checkType>{},
    }
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

    get spmService(): XSpmService {
        return this.getService(XSpmService);
    }

    get set() {
        return new Proxy(this.beforeConfig, {
            get(target, p): any {
                if (target[p].switch !== true) {
                    target[p].switch = true;
                }
            }
        })
    }

    async before() {
        let inspection = async (f: Function) => {
            if (this.status === 1) {
                await f();
            }
        }
        let runs = Object.values(this.beforeConfig);
        for (const run of runs) {
            if (run.switch === true) {
                await inspection(run.run);
                run.switch = false;
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

    db(tb: string) {
        return this.context.cloud.db.collection(tb);
    }

    getService<T>(clazz: new(...args: any) => T): T {
        return this.services.getService(clazz);
    }

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

            await this.before();
            //系统状态正常
            if (this.status === 1) {
                await doSomething.call(this.context.data);
            }
            //运行结束添加本次埋点
            await this.spmService.insertMany(this.spmBeans);
        } catch (e) {
            let errorLogService = this.services.getService(XErrorLogService)
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

    beforeConfig = {
        globalActivity: {
            switch: false,
            run: async () => {
                if (!this.globalActivity) {
                    let activityService = this.getService(XActivityService);
                    this.globalActivity = await activityService.getActivity();
                    if (this.globalActivity.code === -1) {
                        this.status = 0;
                        this.response.set222("没有该活动");
                    }
                    //防止不传活动ID，活动ID为空的情况
                    this.context.data.activityId = this.globalActivity.data._id;
                }
            }
        },
        inspectionActivity: {
            switch: false,
            run: async () => {
                await this.beforeConfig.globalActivity.run();
                if (this.globalActivity.code !== 1) {
                    this.response.set201();
                    this.status = 0;
                }
            }
        }
    }
}
