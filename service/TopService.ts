import Utils from "../utils/Utils";
import App from "../App";
import BaseService from "./abstract/BaseService";


export default class TopService extends BaseService<any> {
    constructor(app: App) {
        super(app);
    }

    cache: any = {}
    curApi: any;
    useCache: boolean = true;

    cacheData() {
        this.useCache = true;
        return this;
    }

    api(api: string, data?: any) {
        this.curApi = {
            api,
            data,
            autoSession: true
        }
        return this;
    }

    cover(coverData: any) {
        Object.assign(this.curApi, coverData);
        return this;
    }

    params(params: any) {
        Object.assign(this.curApi.data, params);
        return this;
    }

    getResult(): result {
        return {
            code: 0,
            data: {}
        }
    }

    /**
     * 调用top接口
     */
    async invoke() {
        let data;
        //使用缓存
        if (this.cache[this.curApi.api] && this.useCache === true) {
            this.useCache = false;
            data = this.cache[this.curApi.api];
        }
        if (!data) {
            data = await this.context.cloud.topApi.invoke(this.curApi);
        }
        this.cache[this.curApi.api] = data;
        this.curApi = null;
        return data;
    }

    /**
     * 查询当前用户VIP信息
     * @doc 参考：https://open.taobao.com/api.htm?docId=34436&docType=2&scopeId=13840
     */
    vipStatus(mixNick = this.mixNick) {
        this.api("taobao.crm.member.identity.get", {
            extra_info: '{"source":"paiyangji","deviceId":"testId","itemId":565058963761}', //固定写法
            mix_nick: mixNick,
        });
        if (mixNick === this.mixNick) {
            this.cacheData();
        }
        return this;
    }

    async vipStatusInvoke(): Promise<result<{
        grade_name: string
        grade: number
        gmt_create: string
        bind_status: number
    }>> {
        let r = this.getResult();
        r.data = await this.invoke();
        r.data = r.data.result.member_info;
        r.code = Number(!!r.data);
        return r;
    }

    /**
     * 查找所有订单
     */
    async selectAllOrder(
        {
            startTime,
            endTime,
            page = 1,
            openId = this.openId
        }
    ) {
        let params = {startTime, endTime, page, openId}
        let result = await this.selectOrder(params).params({
            use_has_next: true
        }).invoke();
        //如果有下一页
        if (result.has_next === true) {
            params.page += 1;
            let rs: any = await this.selectAllOrder(params);
            result.trades.trade = result.trades.trade.concat(rs.trades.trade);
        }
        return result;
    }

    /**
     * 查询一页订单信息
     * @param startTime
     * @param endTime
     * @param ext  {
     *     use_has_next: false  --使用has_next判断是否有下一页
     *     buyer_open_id:   --匹配openId用户的订单
     *     page_no:     --页码
     * }
     * @param page
     * @param openId
     * @doc 参考：https://open.taobao.com/api.htm?docId=45011&docType=2&scopeId=16730
     */
    selectOrder(
        {
            startTime = "1970-01-01 00:00:00",
            endTime = "1970-01-01 00:00:00",
            page = 1,
            openId = this.openId
        }
    ) {
        this.api("taobao.open.trades.sold.get", {
            fields: "tid,type,status,payment,orders,rx_audit_status,pay_time,created",
            page_size: 100,
            buyer_open_id: openId,
            start_created: startTime,
            end_created: endTime,
            page_no: page,
            type: "guarantee_trade,auto_delivery,ec,cod,step,tmall_i18n",
        })
        return this;
    }


    /**
     * 发放奖品
     */
    sendBenefit(
        {
            ename,
            receiverOpenId = this.openId,
        }
    ) {
        this.api("alibaba.benefit.send", {
            right_ename: ename,
            receiver_id: receiverOpenId,//用户openid
            user_type: "taobao",//固定参数
            unique_id: Utils.uuid.v1(),
            app_name: "mtop"
        })
        return this;
    }

    async sendBenefitInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(r.data.result_success === true);
        return r;
    }


    /**
     * 为当前用户标记指定商品
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.6344669azYA9UM&source=search&docId=51296&docType=2
     **/
    opentradeSpecialUsersMark(
        {
            skuId,
            itemId,
            openId = this.openId
        }
    ) {
        this.api("taobao.opentrade.special.users.mark", {
            status: "MARK",
            sku_id: String(skuId),
            item_id: String(itemId),
            open_user_ids: openId,
            hit: "true",
        });
        return this;
    }

    async opentradeSpecialUsersMarkInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(r.data.result && (r.data.code !== 50));
        return r;
    }

    /**
     * 绑定打标商品到小程序
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.7f2c669ahs9Hif&source=search&docId=51714&docType=2
     */
    taobaoOpentradeSpecialItemsBind(
        {
            appCID,
            itemId
        }
    ) {
        this.api("taobao.opentrade.special.items.bind", {
            miniapp_id: appCID,
            item_ids: itemId
        });
        return this;
    }

    async taobaoOpentradeSpecialItemsBindInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.results?.item_bind_result?.[0]?.bind_ok);
        return r;
    }

    /**
     * 查询已经绑定的打标商品
     * @doc 参考：https://open.taobao.com/api.htm?docId=51716&docType=2&source=search
     */
    taobaoOpentradeSpecialItemsQuery(appCID) {
        this.api("taobao.opentrade.special.items.query", {
            miniapp_id: appCID,
        });
        return this;
    }

    async taobaoOpentradeSpecialItemsQueryInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.items?.number);
        return r;
    }

    /**
     * 获取商品信息
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.1b14669agpX3MB&source=search&docId=24625&docType=2
     */
    taobaoItemSellerGet(numIid) {
        this.api("taobao.item.seller.get", {
            fields: "num_iid,title,nick,price,approve_status,sku",
            num_iid: numIid,
        });
        return this;
    }

    async taobaoItemSellerGetInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.item);
        return r;
    }

    /**
     * 获取多个商品信息
     * @doc 参考：https://open.taobao.com/api.htm?docId=24626&docType=2&source=search
     */
    taobaoItemsSellerListGet(numIids) {
        this.api("taobao.items.seller.list.get", {
            fields: "num_iid,title,nick,price,approve_status,sku",
            num_iids: numIids
        });
        return this;
    }

    async taobaoItemsSellerListGetInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.items.item);
        return r;
    }

    /**
     * 会员积分变更
     * @param num   增加数量
     * @param openId    默认为当前用户增加
     * @doc 参考：https://open.taobao.com/api.htm?docId=45305&docType=2&scopeId=16898
     */
    taobaoCrmPointChange(num, openId = this.openId) {
        this.api("taobao.crm.point.change", {
            change_type: 3,
            opt_type: "0",
            quantity: num,
            open_id: openId
        })
        return this;
    }

    async taobaoCrmPointChangeInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.result);
        return r;
    }

    /**
     * 会员积分查询
     * @doc 参考：https://open.taobao.com/api.htm?docId=42617&docType=2&scopeId=15929
     */
    taobaoCrmPointAvailableGet(mixNick = this.mixNick,) {
        this.api("taobao.crm.point.available.get", {
            mix_nick: mixNick
        })
        return this;
    }

    async taobaoCrmPointAvailableGetInvoke() {
        let r = this.getResult();
        r.data = await this.invoke();
        r.code = Number(!!r.data.result);
        return r;
    }

}

