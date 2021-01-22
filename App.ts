import Utils from "./utils/Utils";
import BaseResult from "./dto/BaseResult";
import ErrorLogService from "./service/ErrorLogService";
import ServiceManager from "./service/abstract/ServiceManager";
import SpmService from "./service/SpmService";
import BaseActivityService, {activityData} from "./service/BaseActivityService";

export default class App {

    constructor(public context: any, public apiName: string) {
        //创建一个服务管理
        this.services = new ServiceManager(this);
        //创建埋点对象
        this.spmService = this.services.getService(SpmService);
        //初始化状态
        this.status = 1;
    }

    //服务管理
    services: ServiceManager;
    //APP配置
    config = {
        //是否在请求结束后返回本次请求参数
        returnParams: true,
        //全局请求参数
        needParams: [],
        //是否开启全局活动
        globalActivity: false,
        //是否检查活动时间
        inspectionActivity: false
    }
    //返回值对象
    response: BaseResult;
    //埋点对象
    spmService: SpmService;
    //埋点数组
    spmBeans = [];
    //全局活动
    globalActivity: activityData;
    //程序状态 0--中断，1--运行
    status: 0 | 1;

    /**
     * 运行方法 可以捕获异常并处理
     * @param doSomething
     * @param needParams 所需参数 { name: "" }
     */
    async run(doSomething: Function, needParams: string[] = []): Promise<BaseResult> {
        //初始化返回对象
        this.response = BaseResult.success();
        //保存原始请求参数
        let params = Utils.deepClone(this.context.data);
        //是否返回请求参数
        if (this.config.returnParams === true) {
            this.response.params = params;
        }
        //记录值
        let result = null;
        try {
            needParams = needParams.concat(this.config.needParams);
            //判断参数是否符合条件
            result = Utils.checkParams(needParams, params);
            //如果不符合条件直接返回
            if (result.success === false) return result;
            //运行前系统检查
            await this.before();
            //自定义运行
            await this.customBefore();
            //系统状态正常
            if (this.status === 1) {
                await doSomething.call(this.context.data);
            }
        } catch (e) {
            //发现异常 初始化返回参数
            this.response = BaseResult.fail(e.message, e);
            this.response.api = this.apiName;
            this.response.params = params;
            try {
                let errorLogService = this.services.getService(ErrorLogService)
                await errorLogService.add(this.response);
            } catch (e) {
                //...
            }
        }
        //运行结束添加本次埋点
        await this.spmService.insertMany(this.spmBeans);
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
                    //中断运行
                    this.status = 0;
                }
            }
        }
    }

    async customBefore(){

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
