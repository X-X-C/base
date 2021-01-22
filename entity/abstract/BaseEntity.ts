import Utils from "../../utils/Utils";

export default class BaseEntity {
    constructor(any?) {
        Object.assign(this, any);
    }

    _: this;

    get _init() {
        //保证只被初始化一次
        if (this._ === undefined) {
            this._ = Utils.deepClone(this);
        }
        return;
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
