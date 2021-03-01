import Utils from "../../utils/Utils";
import SpmService from "../../service/SpmService";
import App from "../../App";

export default class BaseEntity {
    _: this;
    _data: {
        compareParam?: {
            arr: "allMatch" | "allReplace",
            num: "set" | "inc",
        }
    }

    get compareParam() {
        return this._data.compareParam;
    }

    set compareParam(v) {
        this._data.compareParam = v;
    }

    get optionsStart() {
        this.delete_;
        this._ = Utils.deepClone(this);
        this.compareParam = {
            arr: "allMatch",
            num: "inc"
        }
        return;
    }

    get optionsNumSet() {
        this.compareParam.num = "set";
        return;
    }

    get optionsArrReplace() {
        this.compareParam.arr = "allReplace";
        return;
    }

    get optionsEnd() {
        let {deepClone, compareObj} = Utils;
        let cur = deepClone(this);
        delete cur._;
        return compareObj(this._, cur, {
            arrayHandle: this.compareParam.arr,
            numberHandle: this.compareParam.num
        });
    }

    get delete_() {
        delete this._;
        delete this.compareParam;
        return;
    }

    get pure() {
        let user = Utils.deepClone(this);
        delete user._;
        delete user._data;
        return user;
    }

    init(e) {
        Object.assign(this, e);
        return this;
    }
}
