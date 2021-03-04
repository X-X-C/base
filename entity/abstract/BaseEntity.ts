import Utils from "../../utils/Utils";

export default class BaseEntity {
    _: this;
    _data: {
        compareParam?: {
            arr: "allMatch" | "allReplace",
            num: "set" | "inc",
        }
    } = {}

    get compareParam() {
        return this._data.compareParam;
    }

    set compareParam(v) {
        this._data.compareParam = v;
    }

    get optionsStart() {
        this.delete_;
        this.compareParam = {
            arr: "allMatch",
            num: "inc"
        }
        this._ = Utils.deepClone(this);
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

    get optionsNumInc() {
        this.compareParam.num = "inc";
        return;
    }

    get optionsArrAllMatch() {
        this.compareParam.arr = "allMatch";
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
        delete this._data.compareParam;
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
