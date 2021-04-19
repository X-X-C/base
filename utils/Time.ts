// @ts-ignore
import * as moment from "moment-timezone";
//设置时区
moment.tz.setDefault("Asia/Shanghai");
export default class Time {
    constructor(date: any = new Date(), parse?) {
        this.bean = moment(date, parse);
    }

    bean;
    moment = moment;

    get common() {
        return {
            base: this.bean.format("YYYY-MM-DD HH:mm:ss"),
            YYYYMMDD: Number(this.bean.format("YYYYMMDD")),
            x: Number(this.bean.format("x"))
        }
    }

    to(number = 0, toType = "d") {
        this.bean.add(number, toType);
        return this;
    };

    format(formatStr) {
        return this.bean.format(formatStr);
    };
}
