import SpmDao from "../dao/SpmDao";
import BaseService from "./abstract/BaseService";
import Spm from "../entity/Spm";
import App from "../App";
// @ts-ignore
import gmSpm from "gm-spm";

export default class SpmService extends BaseService<SpmDao<Spm>, Spm> {
    constructor(app: App) {
        super(SpmDao, app);
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
        spm.nick = this.nick;
        spm.type = type;
        spm.data = {
            ...this.data,
            ...data
        }
        spm.openId = this.openId;
        spm.time = this.time().common.base;
        spm.timestamp = this.time().common.x;
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
        Object.assign(spm, ext);
        return spm;
    }

    /**
     * 新增统计
     * @param type
     * @param data
     * @param ext
     */
    async addSpm(type: string, data?, ext?): Promise<any> {
        this.context.data.spmData = {
            type,
            data: {
                ...this.context.data,
                ...data
            }
        }
        this.context.data.extraField = {
            ...ext
        }
        await gmSpm.spm.spm(this.context);
    }
}