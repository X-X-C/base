import Utils from "../../utils/Utils";

export default class BaseEntity {
    _: this;

    get optionsStart() {
        this.delete_;
        this._ = Utils.deepClone(this);
        return;
    }

    get optionsEnd() {
        let {deepClone, compareObj} = Utils;
        let cur = deepClone(this);
        delete cur._;
        return compareObj(this._, cur);
    }

    get delete_() {
        delete this._;
        return;
    }

    init(e) {
        Object.assign(this, e);
        return this;
    }
}
