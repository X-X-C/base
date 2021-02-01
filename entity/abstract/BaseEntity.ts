import Utils from "../../utils/Utils";

export default class BaseEntity {
    _: this;

    get optionsStart() {
        //保证只被初始化一次
        if (this._ === undefined) {
            this._ = Utils.deepClone(this);
        }
        return;
    }

    get optionsEnd() {
        let {deepClone, compareObj} = Utils;
        let cur = deepClone(this);
        delete cur._;
        let op = compareObj(this._, cur);
        //销毁本次备份
        delete this._;
        return op;
    }

    init(e) {
        Object.assign(this, e);
        return this;
    }
}
