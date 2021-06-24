import BaseService from "./abstract/BaseService";
import Spm from "../entity/Spm";
import App from "../App";

export default class XSpmService<A extends App = App, S extends Spm = Spm> extends BaseService<S> {
    constructor(app: A) {
        super(app, "spm");
    }

    spmBean: new() => S;

    async spmPv() {
        this.dao.initTb("spm_pv");
        let spm = await this.bean("PV");
        await this.insertOne(spm);
        this.dao.initTb("spm")
        return spm;
    }

    simpleBean(type: string) {
        let spm = new this.spmBean();
        spm.activityId = this.activityId;
        spm.date = this.time().format("YYYY-MM-DD");
        spm.nick = this.context.userNick || "";
        spm.type = type;
        spm.mixNick = this.mixNick;
        spm.data = {
            ...this.data,
        }
        spm.openId = this.openId;
        spm.time = this.time().common.base;
        spm.timestamp = this.time().common.x;
        return spm;
    }

    async bean(type: string, coverData?: any) {
        let spm = this.simpleBean(type);
        spm.cover(coverData);
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
        return spm;
    }
}
