// @ts-ignore
import * as moment from "moment-timezone";
//设置时区
moment.tz.setDefault("Asia/Shanghai");
export default class Time {
    constructor(date: any = new Date()) {
        this.bean = moment(...arguments);
        this.common = {
            base: this.bean.format("YYYY-MM-DD HH:mm:ss"),
            YYYYMMDD: Number(this.bean.format("YYYYMMDD")),
            x: Number(this.bean.format("x"))
        }
        this.to = (number = 0, string = "d"): Time => {
            this.bean.add(number, string);
            return this;
        }
        this.format = (str) => this.bean.format(str);
    }

    bean: any;
    common: {
        base: string,
        YYYYMMDD: number,
        x: number
    };
    to: Function;
    format: Function;
}
