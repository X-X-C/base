// @ts-ignore
import * as xlsx from "xlsx";
// @ts-ignore
import * as randombyweights from "randombyweights";
// @ts-ignore
import * as uuid from "uuid";
// @ts-ignore
import * as qr from "qr-image";
import BaseResult from "../dto/BaseResult";
import Time from "./Time";

export default class Utils {

    static checkNeed(real: object, need: object): BaseResult {
        let rs = BaseResult.success();
        let needEntries = Object.entries(need);
        for (let n of needEntries) {
            if (typeof real[n[0]] === "undefined") {
                rs.success = false;
                rs.message = "缺少参数" + n[0];
                break;
            }
            if (n[1] !== "any") {
                if (n[1] !== "array") {
                    rs.success = typeof real[n[0]] === n[1];
                } else {
                    rs.success = Array.isArray(real[n[0]]);
                }
                if (rs.success === false) {
                    rs.message = `${n[0]}类型应为${n[1]}`
                    break;
                }
            }
        }
        return rs;
    }

    /**
     * 判断是否为空
     * @param any
     */
    static isBlank(any: any): boolean {
        return any === null ||
            any === undefined ||
            any === "" ||
            JSON.stringify(any) === "[]" ||
            JSON.stringify(any) === "{}"
    }


    /**
     * 将excel里的时间转换为标准时间格式
     * @param number
     */
    static parseExcelDate(number: number): any {
        //不是数字
        if (typeof number !== "number") {
            return number;
        }
        let date = xlsx.SSF.parse_date_code(number);
        //返回
        return date.y + "-" + parseNum(date.m) + "-" + parseNum(date.d) + " " + parseNum(date.H) + ":" + parseNum(date.M) + ":" + parseNum(date.S)

        function parseNum(num) {
            if (num < 10) {
                return "0" + num;
            }
            return num;
        }
    }

    /**
     * 将excelBuffer转换为json
     * @param buffer
     * @param defineHeader
     * @param who  读取第几张表
     * @param ext
     */
    static parseExcel(buffer, {
        defineHeader = {},
        who = 0
    }): any[] {
        let workbook = xlsx.read(buffer, {
            type: "buffer",
            sheetRows: 2,
            cellDates: true
        });
        let sheet = workbook.Sheets[workbook.SheetNames[who]];
        let firstLine: any = xlsx.utils.sheet_to_json(sheet)[0];
        //定义了表头，检查字段
        if (!Utils.isBlank(defineHeader)) {
            //表头数组
            let header = Object.keys(firstLine);
            //是否缺少字段
            Object.values(defineHeader).every((v: any) => {
                if (header.indexOf(v) !== -1) {
                    return true;
                }
                throw Error(`缺少字段[${v}]`);
            });
        }
        //获取需要转换字段
        let convertFields = {
            num: [],
            date: []
        }
        firstLine = Object.entries(firstLine);
        for (const e of firstLine) {
            if (typeof e[1] === "number") {
                convertFields.num.push(e[0]);
            }
            if (e[1] instanceof Date) {
                convertFields.date.push(e[0]);
            }
        }
        //读取文件
        workbook = xlsx.read(buffer, {
            type: "buffer"
        });
        sheet = workbook.Sheets[workbook.SheetNames[who]];
        let rs = xlsx.utils.sheet_to_json(sheet);
        if (!Utils.isBlank(defineHeader)) {
            //映射对应的键
            rs = rs.map(v => {
                let o = {};
                for (let key in defineHeader) {
                    let targetKey = defineHeader[key];
                    let targetV = v[targetKey];
                    //数字字段，转换为字符串
                    if (convertFields.num.indexOf(targetKey) !== -1) {
                        targetV = String(targetV);
                    }
                    //日期字段
                    else if (convertFields.date.indexOf(targetKey) !== -1) {
                        targetV = Utils.parseExcelDate(targetV)
                    }
                    o[key] = targetV;
                }
                return o;
            });
        }
        return rs;
    }

    /**
     * 将json转化为excel buffer
     * @param excelJson
     * @param ext {
     *     header: []
     * }
     */
    static jsonToExcelBuffer(excelJson, ext: { header?: Array<any> } = {}): any {
        //将json转换为xlsx的sheet格式
        let sheet = xlsx.utils.json_to_sheet(excelJson, ext);
        //更改每个单元格的宽度
        sheet["!cols"] = (new Array(Object.keys(excelJson[0] || {}).length)).fill({width: 17});
        //新建一个xlsx工作薄
        let workbook = xlsx.utils.book_new();
        //将json的sheet添加到新的工作簿中
        // @ts-ignore
        xlsx.utils.book_append_sheet(workbook, sheet, "sheet");
        //返回写出的工作簿buffer
        return xlsx.write(workbook, {type: "buffer"});
    }

    /**
     * 抽奖
     * @param probabilityArr 概率数组
     */
    static random(probabilityArr: Array<number>): number {
        return randombyweights(probabilityArr);
    }

    /**
     *  获取随机字符串
     * @param repeat 重复次数
     * @param type 格式字符串,有效字符串 A a 0
     */
    static randomStr(
        {
            repeat = 1,
            type = ""
        } = {}
    ): string {
        let AZ = [65, 90],
            az = [97, 122],
            number = [48, 57],
            str = "";
        for (let i = 0; i < repeat; i++) {
            if (!type) {
                let target = [number, AZ, az][Math.floor(Math.random() * 3)];
                let char = Math.floor(Math.random() * (target[1] - target[0] + 1) + target[0]);
                str += String.fromCharCode(char)
            } else {
                for (const t of type) {
                    let target;
                    switch (t) {
                        case "A":
                            target = AZ;
                            break
                        case "a":
                            target = az;
                            break
                        case "0":
                            target = number;
                    }
                    if (target) {
                        str += String.fromCharCode(Math.floor(Math.random() * (target[1] - target[0] + 1) + target[0]));
                    } else {
                        str += t;
                    }
                }
            }
        }
        return str;
    }

    static uuid = {
        v1: uuid.v1,
        v4: uuid.v4
    }

    static type = {
        number: Utils.getType(1),
        object: Utils.getType({}),
        array: Utils.getType([]),
        string: Utils.getType(""),
        boolean: Utils.getType(true),
    }

    /**
     * 获取精确类型
     * @param any
     */
    static getType(any): string {
        return Object.prototype.toString.call(any);
    }

    /**
     * 扩展对象，只扩展源对象里有意义且目标对象有的值
     * @param target
     * @param source
     */
    static assign(target: object, source: object): void {
        for (let key in source) {
            let v = source[key];
            if (!Utils.isBlank(v) && typeof target[key] !== "undefined") {
                target[key] = v;
            }
        }
    }

    /**
     * 清除对象里的空白值
     * @param obj
     * @param deep
     */
    static cleanObj(obj, deep = true): boolean {
        if ([Utils.getType({}), Utils.getType([])].indexOf(Utils.getType(obj)) !== -1) {
            for (let key in obj) {
                if (Utils.isBlank(obj[key])) {
                    delete obj[key];
                }
                //深清除
                else if (Utils.getType(obj[key]) === Utils.getType({}) && deep === true) {
                    Utils.cleanObj(obj[key]);
                    Utils.cleanObj(obj, false);
                }
            }
        }
        return !Utils.isBlank(obj);
    }

    /**
     * 清空对象数组里的所有空值
     * @param arr
     */
    static cleanObjArr(arr: object[]): number {
        let delArr = [];
        if (arr.length > 0) {
            arr.forEach((v, k) => {
                Utils.cleanObj(arr[k]);
                if (Utils.isBlank(arr[k])) {
                    delArr.push(k);
                }
            })
        }
        if (delArr.length > 0) {
            for (let k of delArr) {
                arr.splice(k, 1);
            }
        }
        return arr.length;
    }

    /**
     * 解析url为base64二维码
     * @param url
     */
    static qrImage(url): string {
        // @ts-ignore
        return 'data:image/png;base64,' + Buffer.from(qr.imageSync(url), 'utf8').toString('base64');
    }

    static deepClone<T>(obj: T): T {
        if (obj) {
            return JSON.parse(JSON.stringify(obj));
        }
        return obj;
    }

    static toJson(any): string {
        return JSON.stringify(any).replace(/"/g, "");
    }

    static insertClean(obj) {
        return JSON.parse(
            JSON.stringify(obj).replace(/[$]/g, ">>>")
                .replace(/[.]/g, ">>")
        )
    }

    /**
     * 比较两个对象，返回两个比较后的直接条件
     */
    static compareObj(
        origin,
        target,
        {
            extKey = "",
            arrayHandle = <"allMatch" | "allReplace">"allMatch",
            numberHandle = <"set" | "inc">"set",
            compareRs = {
                $inc: {},
                $push: {},
                $set: {}
            },
        } = {},
    ) {
        let {type, getType, compareObj} = Utils;
        for (let targetKey in target) {
            let targetV = target[targetKey];
            let originV = origin[targetKey];
            let originType = getType(originV);
            let targetType = getType(targetV);
            let key = targetKey;
            if (extKey !== "") {
                key = extKey + "." + key;
            }
            //如果两个对象不相同
            if (JSON.stringify(targetV) !== JSON.stringify(originV)) {
                if (
                    originType !== targetType ||
                    [type.object, type.number, type.array].indexOf(originType) === -1
                ) {
                    //如果类型不同直接设置
                    compareRs.$set[key] = targetV;
                }
                //如果类型相同，且在可控范围内
                else {
                    //如果是对象
                    if (originType === type.object) {
                        //继续往下匹配
                        compareObj(
                            originV,
                            targetV,
                            {
                                extKey: key,
                                compareRs,
                                arrayHandle,
                                numberHandle
                            }
                        )
                    } else if (originType === type.number) {
                        //相加的方式
                        if (numberHandle === "inc") {
                            compareRs.$inc[key] = targetV - originV;
                        }
                        //直接设置的方式
                        else if (numberHandle === "set") {
                            compareRs.$set[key] = targetV;
                        }
                    } else if (originType === type.array) {
                        //尽可能的匹配
                        if (arrayHandle === "allMatch") {
                            compareRs.$push[key] = {
                                $each: []
                            }
                            targetV.forEach((targetVElement, index) => {
                                let originArrayV = originV[index];
                                //如果两个值是不相等的
                                if (JSON.stringify(originArrayV) !== JSON.stringify(targetVElement)) {
                                    let targetVElementType = getType(targetVElement);
                                    let originArrayVType = getType(originArrayV);
                                    //如果目标不存在
                                    if (originArrayVType === getType(undefined)) {
                                        compareRs.$push[key].$each.push(targetVElement);
                                    }
                                    //如果类型为对象
                                    else if (
                                        targetVElementType === originArrayVType &&
                                        originArrayVType === type.object
                                    ) {
                                        //继续往下匹配
                                        compareObj(
                                            originArrayV,
                                            targetVElement,
                                            {
                                                extKey: key + "." + index,
                                                compareRs,
                                                arrayHandle,
                                                numberHandle
                                            }
                                        )
                                    }
                                    //如果类型不为对象
                                    else {
                                        compareRs.$set[key + "." + index] = targetVElement;
                                    }
                                }
                            })
                            if (compareRs.$push[key].$each.length <= 0) {
                                delete compareRs.$push[key];
                            }
                        }
                        //全部替换
                        else if (arrayHandle === "allReplace") {
                            compareRs.$set[key] = targetV;
                        }
                    }
                }
            }
        }
        return compareRs;
    }


    static secretStr(str: string, {
        delimiter = "*",
        hideStart = 1,
        hideEnd = str.length - 1,
        hideLength = hideEnd - hideStart
    } = {}) {
        let finalStr = str.split("");
        finalStr.splice(hideStart, hideEnd - hideStart, ...new Array(hideLength || 1).fill(delimiter));
        return finalStr.join("");
    }

    static getMaxDays(days: string[], format: string = "YYYY-MM-DD") {
        days = Utils.deepClone(days);
        days.sort((a, b) => {
            return -Number(a < b);
        });
        let max = [];
        let cur = [];
        while (days.length > 0) {
            let day = days.shift();
            if (cur.length === 0) {
                cur.push(day);
            } else {
                let last = new Time(cur[cur.length - 1], format);
                if (last.to(1).format(format) === day) {
                    cur.push(day);
                } else {
                    cur = [day];
                }
                if (cur.length > max.length) {
                    max = cur;
                }
            }
        }
        return max;
    }

    static getTodayBackMaxDays(days, format = "YYYY-MM-DD") {
        let time = new Time().to(1);
        let max = [];
        while (true) {
            if (days.indexOf(time.to(-1).format(format)) !== -1) {
                max.push(time.format(format))
            } else {
                break;
            }
        }
        return max;
    }
}
