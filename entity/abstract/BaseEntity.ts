import Utils from "../../utils/Utils";

export default class BaseEntity {
    constructor(any?) {
        Object.assign(this, any);
    }

    _: this;

    _init() {
        this._ = Utils.deepClone(this);
    }

    get _options() {
        let {deepClone, compareObj} = Utils;
        let cur = deepClone(this);
        delete cur._;
        let op = compareObj(this._, cur);
        this._ = cur;
        return op;
    }
}
