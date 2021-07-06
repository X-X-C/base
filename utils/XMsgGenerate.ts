import Time from "../../base/utils/Time";
import Utils from "../../base/utils/Utils";

let {toJson, isBlank} = Utils;

export default {
    /**
     * 生成信息
     * @param who 谁
     * @param what 干什么
     * @param desc 描述
     * @param target 对谁
     * @param time 时间
     */
    baseInfo(who, what, target, desc, time = new Time()) {
        let msg = [];
        msg.push(joinMsg([
            `【${who}】在【${time.common.base}】${what}`,
            trulyMsg(target, `【${target}】`),
        ]));
        !desc || msg.push(toJson(desc));
        return msg.join("，") + "。";
    }
}

export function joinMsg(arr: string[]) {
    return arr.filter(v => !isBlank(v)).join("，");
}

export function trulyMsg(value, msg) {
    return value ? msg : "";
}
