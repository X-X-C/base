import Time from "../../base/utils/Time";
import Utils from "../../base/utils/Utils";

let {toJson} = Utils;

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
        msg.push(`【${who}】`);
        msg.push(`在`);
        msg.push(`【${time.common.base}】`);
        msg.push(target ? `【${target}】` : "");
        msg.push(desc ? toJson(desc) : "");
        return msg.join("，");
    }
}
