// @ts-ignore
import * as xlsx from "xlsx";
// @ts-ignore
import * as randombyweights from "randombyweights";
// @ts-ignore
import * as qr from "qr-image";
import {mongodbOptions} from "./Type";

export default class Utils {
    /**
     * 判断参数是否正确
     */
    static checkParams(need: any[], real: object): {
        success: boolean,
        message: string
    } {
        let rs = {
            success: false,
            message: ""
        }
        let keys = Object.keys(real);
        rs.success = need.every(v => {
            if (keys.indexOf(v) !== -1) {
                return true;
            }
            rs.message += "缺少参数" + v;
        });
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
    static parseExcelDate(number: number): false | string {
        //不是数字
        if (isNaN(Number(number)) === true) {
            return false;
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
    static parseExcel(buffer, defineHeader: any = {}, who: number = 0, ext: any = {}): any {
        let workbook;
        //定义了header,检查header
        if (!Utils.isBlank(defineHeader)) {
            //获取表头
            workbook = xlsx.read(buffer, {
                type: "buffer",
                sheetRows: 1
            });
            //检查表头是否包含所需字段
            let header = workbook.Sheets[workbook.SheetNames[who]];
            //表头数组
            header = xlsx.utils.sheet_to_json(header, {
                header: 1
            });
            //是否缺少字段
            Object.values(defineHeader).every(v => {
                if (header.indexOf(v) !== -1) {
                    return true;
                }
                throw Error(`缺少字段[${v}]`);
            });
        }
        //开始正式操作
        workbook = xlsx.read(buffer, {
            type: "buffer"
        });
        //读取表的数据
        let rs = workbook.Sheets[workbook.SheetNames[who]];
        rs = xlsx.utils.sheet_to_json(rs, ext);
        if (!Utils.isBlank(defineHeader)) {
            //映射对应的键
            rs = rs.map(v => {
                let o = {};
                for (let key in defineHeader) {
                    let targetKey = defineHeader[key];
                    //如果对应字段存在
                    if (v[targetKey] !== undefined) {
                        if (typeof v[targetKey] === "number") {
                            v[targetKey] = String(v[targetKey]);
                        }
                        o[key] = v[targetKey];
                    }
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
        sheet["!cols"] = (new Array(excelJson.length)).fill({width: 17});
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
     * 获取的随机字符串长度
     * @param length
     */
    static getUniqueStr(length: number): string {
        let unique = '';
        let source = [];
        //得到 0-9  A-Z  a-z
        for (let i = 0; i < 123; i++) {
            if (i >= 0 && i < 10) {
                source.push(i);
            } else if ((i >= 65 && i < 91) || (i >= 97 && i < 123)) {
                source.push(String.fromCharCode(i));
            }
        }
        //开始生成随机码
        for (let i = 0; i < length; i++) {
            unique += source[Math.floor(Math.random() * source.length)];
        }
        return unique;
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
        return JSON.parse(JSON.stringify(obj));
    }

    static toJson(any): string {
        let r: string = JSON.stringify(any);
        if (typeof any === "string") {
            r = r.substring(1, r.length - 1);
        }
        return r;
    }

    /**
     * 比较两个对象，返回两个比较后的直接条件
     * !!!!!!慎用!!!!!!
     * @param origin
     * @param target
     * @param extKey
     * @param compareRs
     */
    static compareObj(
        origin,
        target,
        extKey: string = "",
        compareRs: mongodbOptions = {
            $inc: {},
            $push: {},
            $set: {}
        }
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
            if (
                JSON.stringify(targetV) !== JSON.stringify(originV)
            ) {
                if (
                    originType === targetType &&
                    [type.object, type.number, type.array].indexOf(originType) !== -1
                ) {
                    //如果是对象
                    if (originType === type.object) {
                        //继续往下匹配
                        compareObj(
                            originV,
                            targetV,
                            key,
                            compareRs
                        )
                    } else if (originType === type.number) {
                        //数值相加
                        compareRs.$inc[key] = targetV - originV;
                    } else if (originType === type.array) {
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
                                        key + "." + index,
                                        compareRs
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
                } else {
                    //如果类型不同直接设置
                    compareRs.$set[key] = targetV;
                }
            }
        }
        return compareRs;
    }
}
