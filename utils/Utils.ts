// @ts-ignore
import * as xlsx from "xlsx";
// @ts-ignore
import * as randombyweights from "randombyweights";
// @ts-ignore
import * as uuid from "uuid";
// @ts-ignore
import * as qr from "qr-image";
// @ts-ignore
import * as fs from "fs";
// @ts-ignore
import * as path from "path";
import BaseResult from "../dto/BaseResult";
import Time from "./Time";

export default class Utils {

    static checkNeed(real: object, need: object): BaseResult {
        let rs = BaseResult.success();
        let needEntries = Object.entries(need);
        for (let n of needEntries) {
            if (typeof real[n[0]] === "undefined") {
                rs.set224("缺少参数" + n[0]);
                break;
            }
            if (n[1] !== "any") {
                let pass = true;
                if (n[1] !== "array") {
                    pass = typeof real[n[0]] === n[1];
                } else {
                    pass = Array.isArray(real[n[0]]);
                }
                if (pass === false) {
                    rs.set224(`${n[0]}类型应为${n[1]}`);
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

    static formatDateToBase(date: Date) {
        function formatNum(number) {
            return number > 9 ? number : "0" + number;
        }

        let year = date.getFullYear();
        let month = formatNum(date.getMonth() + 1);
        let day = formatNum(date.getDate());
        let hours = formatNum(date.getHours());
        let minutes = formatNum(date.getMinutes());
        let seconds = formatNum(date.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    static parseExcel(parseData, {
        defineHeader = null as any,
        who = 0,
        type = "buffer" as 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string'
    } = {}): any[] {
        let workbook = xlsx.read(parseData, {
            type,
            cellDates: true
        });
        let sheet = workbook.Sheets[workbook.SheetNames[who]];
        let rs = xlsx.utils.sheet_to_json(sheet, {
            header: 1
        });
        let firstLine: any = rs.splice(0, 1)[0] || [];
        let indexMap = {};
        if (defineHeader) {
            Object.entries(defineHeader).forEach(v => {
                let index = firstLine.indexOf(v[1]);
                if (index === -1) {
                    throw "缺少字段" + v[1];
                }
                indexMap[v[0]] = index;
            })
        } else {
            firstLine.forEach((v, i) => {
                indexMap[v] = i;
            })
        }
        return rs.map(v => {
            let o = {};
            Object.entries(indexMap).forEach((i: any) => {
                let value = v[i[1]];
                //处理特殊值
                if (typeof value === "number") {
                    value = value + ""
                } else if (value instanceof Date) {
                    value = Utils.formatDateToBase(value);
                }
                o[i[0]] = value;
            })
            return o;
        })
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
        sheet["!cols"] = (new Array(Object.keys(excelJson[0] || {}).length)).fill({width: 25});
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
        if (arr.length > 0) {
            arr.forEach((v, k) => {
                Utils.cleanObj(arr[k]);
                if (Utils.isBlank(arr[k])) {
                    arr[k] = undefined;
                }
            })
        }
        let tmp = arr.filter(v => v !== undefined);
        arr.length = 0;
        arr.push(...tmp);
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

    static isNumber(any: any) {
        return !isNaN(any) && typeof any === "number";
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

    static formatNum(number) {
        return number >= 0 ? "+" + number : number
    }

    static findFiles(startPath, {
        pattern = [] as RegExp[],
        exclude = [] as RegExp[],
        excludeDir = [] as RegExp[]
    } = {}) {
        let stats = fs.statSync(startPath);
        let files = [];
        if (stats.isDirectory()) {
            let strings = fs.readdirSync(startPath);
            for (let string of strings) {
                let newPath = path.join(startPath, string);
                let stats = fs.statSync(newPath);
                if (stats.isDirectory() && excludeDir.every(v => !v.test(string))) {
                    files = files.concat(Utils.findFiles(newPath, {
                        pattern,
                        exclude,
                        excludeDir
                    }));
                } else {
                    if (pattern.every(v => v.test(string)) && exclude.every(v => !v.test(string))) {
                        files.push(newPath);
                    }
                }
            }
        }
        return files;
    }

    static safeSetValue(obj: any, key: string, value: any) {
        if (obj) {
            let ks = key.split(".");
            let v = obj;
            while (ks.length > 0) {
                let k = ks.shift();
                if (ks.length === 0) {
                    v[k] = value;
                } else {
                    if (v[k] === undefined) {
                        v[k] = {}
                    }
                    if (typeof v[k] !== "object") {
                        break;
                    }
                    v = v[k];
                }
            }
        }
    }
}
