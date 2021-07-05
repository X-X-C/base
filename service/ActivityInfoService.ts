import BaseService from "./abstract/BaseService";
import ActivityInfo from "../entity/ActivityInfo";
import App from "../App";

export default class ActivityInfoService<A extends App = App> extends BaseService<ActivityInfo, A> {
    constructor(app: A) {
        super(app, "activityInfo");
    }

    //更新库存
    async updateStock(stockInfo: stockInfo, changeCount: number) {
        let time = this.time().common.YYYYMMDD;
        let allField = `stock.${stockInfo.prizeId}`;
        let dayField = `dayStock.${stockInfo.prizeId}.${time}`;
        let filter = {
            activityId: this.activityId,
            $or: [
                {
                    [allField]: {
                        $exists: false
                    },
                },
                {
                    [allField]: stockInfo.done
                }
            ]
        }
        let options = {
            $set: {
                [allField]: stockInfo.done + changeCount
            }
        }
        if (stockInfo.dayStock === true) {
            options.$set[dayField] = stockInfo.dayDone + changeCount
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
