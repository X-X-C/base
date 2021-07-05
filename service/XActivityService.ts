import BaseService from "./abstract/BaseService";
import App from "../App";
import ActivityInfo from "../entity/ActivityInfo";


export type activityData = {
    code: number,
    data: activity,
    activityInfo?: ActivityInfo
}

export default class XActivityService<A extends App = App> extends BaseService<activity, A> {
    constructor(app: A) {
        super(app, "activities");
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
            },
            filter = <activity | other>{
                _id: this.activityId,
                isDel: 0
            }
        } = {}
    ): Promise<activityData> {
        //如果目标活动已经被实例化
        if (
            this.activity &&
            this.activity.code !== -1 &&
            this.activity.data._id === this.activityId
        ) {
            //直接返回活动
            return this.activity;
        } else {
            //查询活动
            let activity = await super.get(filter, {
                projection
            });
            this.activity = {
                code: this.status(activity),
                data: activity
            }
            return this.activity;
        }
    }

    status(activity: any): number {
        //没有活动
        if (!activity || activity.isDel !== 0) {
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
