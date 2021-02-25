import BaseService from "./abstract/BaseService";
import App from "../App";

export default class BaseActivityService extends BaseService<any> {
    constructor(app: App) {
        super("activities", app);
    }

    activity: activityData;

    /**
     * 获取活动
     */
    async getActivity(
        {
            //获取活动字段
            projection = <any>{
                startTime: 1,
                endTime: 1,
                config: 1,
                data: 1
            }
        } = {}
    ): Promise<activityData> {
        //如果目标活动已经被实例化
        if (this.activity &&
            this.activity.code !== -1 &&
            this.activity.data._id === this.activityId) {
            return this.activity;
        } else {
            //过滤参数
            let filter: any = {
                isDel: 0,
                _id: this.activityId,
            };
            //查询活动
            let activity = await super.get(filter, {
                projection
            });
            //返回值
            let result: any = {};
            result.code = this.status(activity);
            result.data = activity;
            this.activity = result;
            return this.activity;
        }
    }

    protected status(activity: any): number {
        //没有活动
        if (!activity) {
            return -1;
        }
        //活动未开始
        if (this.time().common.base < activity.startTime) {
            return 0;
        }
        //活动已结束
        else if (this.time().common.base > activity.endTime) {
            return 2
        }
        //活动正常
        else {
            return 1;
        }
    }
}
