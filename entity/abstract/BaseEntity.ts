import Utils from "../../utils/Utils";

export default class BaseEntity {
    constructor(clazz?) {
        if (clazz) {
            this._data_.clazz = clazz;
        }
    }

    _id: string;
    _: this;
    _tempThis: this;
    _data: {
        compareParam?: {
            arr: "allMatch" | "allReplace",
            num: "set" | "inc",
        },
        clazz?
    }

    get tempThis() {
        return this._tempThis;
    }

    get tempThisCommit() {
        this._tempThis = this.pure;
        if (this._data_.clazz) {
            this._tempThis = new this._data_.clazz().init(this._tempThis, false);
        }
        return;
    }

    get _data_() {
        if (!this._data) {
            this._data = {};
        }
        return this._data;
    }

    get compareParam() {
        return this._data_.compareParam;
    }

    set compareParam(v) {
        this._data_.compareParam = v;
    }

    get optionsStart() {
        this.delete_;
        this.compareParam = {
            arr: "allMatch",
            num: "inc"
        }
        this._ = this.pure;
        if (this._data_.clazz) {
            this._ = new this._data_.clazz().init(this._, false);
        }
        this.tempThisCommit;
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
        let {compareObj} = Utils;
        let cur = this.pure;
        return compareObj(this._, cur, {
            arrayHandle: this.compareParam.arr,
            numberHandle: this.compareParam.num
        });
    }

    get optionsBack() {
        let {deepClone, compareObj} = Utils;
        let cur = this.pure;
        let _ = deepClone(this._);
        return compareObj(cur, _, {
            arrayHandle: this.compareParam.arr,
            numberHandle: this.compareParam.num
        });
    }

    get delete_() {
        delete this._;
        delete this._data?.compareParam;
        return;
    }

    get pure() {
        let e = Utils.deepClone(this);
        for (const k in e) {
            if (k[0] === "_" && k !== "_id") {
                delete e[k];
            }
        }
        return e;
    }

    init(e: this | other, optionsStart: boolean = true) {
        Object.assign(this, e);
        if (optionsStart === true) {
            this.optionsStart;
        }
        return this;
    }

    getValueFromKey(k: string) {
        let s = k.split(".");
        let v = undefined;
        while (s.length > 0) {
            if (v === undefined) {
                v = this[s.shift()];
            } else {
                v = v[s.shift()];
            }
            if (v === undefined) {
                return v;
            }
        }
        return v;
    }
}
