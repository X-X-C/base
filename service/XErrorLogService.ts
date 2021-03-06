import ErrorLog from "../entity/ErrorLog";
import BaseService from "./abstract/BaseService";
import App from "../App";
import BaseResult from "../dto/BaseResult";
import Utils from "../utils/Utils";

export default class XErrorLogService<A extends App = App> extends BaseService<ErrorLog, A> {
    constructor(app: A) {
        super(app, "errorLogs");
    }

    async add(e: BaseResult | any) {
        let errorLog = new ErrorLog();
        errorLog.nick = this.nick;
        errorLog.api = this.app.apiName;
        errorLog.message = e.message;
        errorLog.openId = this.openId;
        errorLog.time = this.time().common.base;
        errorLog.params = this.response.params;
        errorLog.desc = Utils.insertClean(e);
        errorLog.activityId = this.activityId;
        switch (e.code) {
            case 501:
                errorLog.level = "logic";
                break;
            case 500:
            default:
                errorLog.level = "error";
                break;
        }
        await this.insertOne(errorLog);
    }
}
