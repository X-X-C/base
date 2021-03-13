import BaseService from "./abstract/BaseService";
import Spm from "../entity/Spm";
import App from "../App";

export default class SpmService extends BaseService<Spm> {
    constructor(app: App) {
        super(app, "spm");
    }

    /**
     * 获取spm bean
     * @param type
     * @param data
     * @param ext 新增或修改源spm数据
     */
    async simpleBean(type: string, data?, ext?): Promise<Spm> {
        return await this.bean(type, data, ext, true);
    }

    /**
     * 获取spm bean
     * @param type
     * @param data
     * @param ext 新增或修改源spm数据
     * @param simple
     */
    async bean(type: string, data?, ext?, simple: boolean = false): Promise<Spm> {
        let spm = new Spm();
        spm.activityId = this.activityId;
        spm.date = this.time().format("YYYY-MM-DD");
        spm.nick = this.context.userNick || "";
        spm.type = type;
        spm.mixNick = this.mixNick;
        spm.data = {
            ...this.data,
            ...data
        }
        spm.openId = this.openId;
        spm.time = this.time().common.base;
        spm.timestamp = this.time().common.x;
        Object.assign(spm, ext);
        if (!simple) {
            //天index
            spm.dayIndex = (await this.count({
                openId: spm.openId,
                type,
                activityId: this.activityId,
                date: spm.date,
            })) + 1;
            //总index
            spm.totalIndex = (await this.count({
                openId: spm.openId,
                type,
                activityId: this.activityId
            })) + 1;
        }
        return spm;
    }
}
