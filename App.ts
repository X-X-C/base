import Utils from "./utils/Utils";
import BaseResult from "./dto/BaseResult";
import XErrorLogService from "./service/XErrorLogService";
import ServiceManager from "./service/abstract/ServiceManager";
import XSpmService from "./service/XSpmService";
import XActivityService, {activityData} from "./service/XActivityService";
import Spm from "./entity/Spm";
import ActivityInfoService from "./service/ActivityInfoService";
import ActivityInfo from "./entity/ActivityInfo";

export default class App {

    constructor(public context: any, public apiName: string) {
        this.services = new ServiceManager(this);
        this.before = new XBefore(this);
        this.status = 1;
    }

    services: ServiceManager;
    before: XBefore;
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
            if (result.code !== BaseResult.STATUS_SUCCESS) return result;
            //重置运行参数
            this.runNeedParams = {};
            await this.before.run();
            //系统状态正常
            if (this.status === 1) {
                await doSomething.call(this.context.data);
                //运行结束添加本次埋点
                await this.spmService.insertMany(this.spmBeans);
            }
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
        this.status = 1;
        return this.response;
    }
}


export class XBefore {

    constructor(public app: App) {
    }

    before: Function[] = [];

    set addBefore(v) {
        if (!this.before.find(v1 => v1.toString() === v.toString())) {
            this.before.push(v);
        }
    }

    async run() {
        for (let f of this.before) {
            if (this.app.status === 1) {
                await f(this.app);
            }
        }
        this.before = [];
    }

    globalActivity() {
        this.addBefore = async (app: App) => {
            if (!app.globalActivity) {
                let activityService = app.getService(XActivityService);
                app.globalActivity = await activityService.getActivity();
                if (app.globalActivity.code === -1) {
                    app.status = 0;
                    app.response.set222("没有该活动");
                    return;
                }
                //防止不传活动ID，活动ID为空的情况
                app.context.data.activityId = app.globalActivity.data._id;
            }
        }
    }

    inspectionActivity() {
        this.globalActivity();
        this.addBefore = async (app: App) => {
            if (app.globalActivity.code !== 1) {
                app.response.set201();
                app.status = 0;
            }
        }
    }

    auth() {
        this.addBefore = (app: App) => {
            if (!app.context.userNick) {
                app.response.set223();
                app.status = 0;
            }
        }
    }

    globalActivityInfo() {
        this.globalActivity();
        this.addBefore = async (app: App) => {
            let {activityId} = app.context.data;
            let activityInfoService = app.getService(ActivityInfoService);
            let activityInfo = await activityInfoService.get({
                activityId
            })
            if (!activityInfo) {
                activityInfo = new ActivityInfo();
                activityInfo.activityId = activityId;
                activityInfo._id = await activityInfoService.insertOne(activityInfo);
            }
            app.globalActivity.activityInfo = activityInfo;
        }
    }
}

