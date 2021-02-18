import ErrorLogDao from "../dao/ErrorLogDao";
import ErrorLog from "../entity/ErrorLog";
import BaseService from "./abstract/BaseService";
import App from "../App";
import BaseResult from "../dto/BaseResult";

export default class ErrorLogService extends BaseService<ErrorLogDao<ErrorLog>, ErrorLog> {
    constructor(app: App) {
        super(ErrorLogDao, app);
    }

    async add(e: BaseResult | any) {
        let errorLog = new ErrorLog();
        errorLog.nick = this.nick;
        errorLog.api = this.app.apiName;
        errorLog.message = e.message;
        errorLog.openId = this.openId;
        errorLog.time = this.time().common.base;
        errorLog.params = this.response.params;
        errorLog.desc = e;
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
