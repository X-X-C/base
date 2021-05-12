import BaseService from "./abstract/BaseService";
import ActivityInfo from "../entity/ActivityInfo";
import App from "../App";

export default class ActivityInfoService extends BaseService<ActivityInfo> {
    constructor(app: App) {
        super(app, "activityInfo");
    }

    //更新库存
    async updateStock(stockInfo: stockInfo, changeCount: number) {
        let field;
        if (stockInfo.dayStock === true) {
            let time = this.time().common.YYYYMMDD;
            field = `dayStock.${stockInfo.prizeId}.${time}`;
        } else {
            field = `stock.${stockInfo.prizeId}`;
        }
        let filter = {
            activityId: this.activityId,
            $or: [
                {
                    [field]: {
                        $exists: false
                    },
                },
                {
                    [field]: stockInfo.done
                }
            ]
        }
        let options = {
            $set: {
                [field]: stockInfo.done + changeCount
            }
        }
        return await this.edit(filter, options);
    }

    //开奖
    async award() {
        return await this.edit({
            activityId: this.activityId,
            award: false
        }, {
            $set: {
                award: true
            }
        })
    }
}
