import Utils from "../../utils/Utils";

export default class BaseEntity {
    _: this;
    compareParam: {
        arr: "allMatch" | "allReplace",
        num: "set" | "inc",
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

    init(e) {
        Object.assign(this, e);
        return this;
    }
}
