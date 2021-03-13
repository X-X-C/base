import Utils from "../utils/Utils";
import App from "../App";
import BaseService from "./abstract/BaseService";

export default class TopService extends BaseService<any> {
    constructor(app: App) {
        super(app);
    }

    cache: any = {}

    private useCache: boolean = true;

    get cacheRun() {
        this.useCache = true;
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
     * @param api
     * @param data  参数
     * @param useCache  是否使用缓存
     * @param ext   额外参数
     */
    async invoke(api: string, data, {
        ext = {}
    } = {}) {
        //使用缓存
        if (this.cache[api] && this.useCache === true) {
            return this.cache[api];
        }
        this.useCache = false;
        this.cache[api] = await this.context.cloud.topApi.invoke({
            api,
            data,
            autoSession: true,
            ...ext
        });
        return this.cache[api]
    }

    /**
     * 查询当前用户VIP信息
     * @doc 参考：https://open.taobao.com/api.htm?docId=34436&docType=2&scopeId=13840
     */
    async vipStatus(
        {
            mixNick = this.mixNick,
        } = {},
        {
            ext = {},
            extParams = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        if (mixNick === this.nick) {
            this.cacheRun;
        }
        r.data = await this.invoke(
            "taobao.crm.member.identity.get",
            {
                extra_info: '{"source":"paiyangji","deviceId":"testId","itemId":565058963761}', //固定写法
                mix_nick: mixNick,
                ...extParams
            },
            {
                ext
            }
        );
        r.data = r.data.result.member_info;
        r.code = Number(!!r.data);
        return r;
    }

    /**
     * 查找所有订单
     * @param start
     * @param end
     * @param ext
     * @param page
     */
    async selectAllOrder(
        {
            startTime,
            endTime,
            page = 1,
            openId = this.openId
        },
        {
            extParams = <orderExt>{},
            ext = {}
        } = {}
    ) {
        let params1 = {
            startTime,
            endTime,
            page,
            openId,
        }
        let params2 = {
            extParams: {
                use_has_next: true,
                ...extParams
            },
            ext
        }
        let result = await this.selectOrder(params1, params2);
        //如果有下一页
        if (result.has_next === true) {
            params1.page += 1;
            let rs: any = await this.selectAllOrder(params1, params2);
            result.trades.trade = result.trades.trade.concat(rs.trades.trade);
            return result;
        } else {
            return result;
        }
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
     * @param extParams
     * @param useCache
     * @doc 参考：https://open.taobao.com/api.htm?docId=45011&docType=2&scopeId=16730
     */
    async selectOrder(
        {
            startTime = "1970-01-01 00:00:00",
            endTime = "1970-01-01 00:00:00",
            page = 1,
            openId = this.openId
        },
        {
            extParams = <orderExt>{},
            ext = {},
            useCache = true
        } = {}
    ) {
        if (useCache === true) {
            this.cacheRun;
        }
        return await this.invoke("taobao.open.trades.sold.get", {
            fields: "tid,type,status,payment,orders,rx_audit_status",
            page_size: 100,
            buyer_open_id: openId,
            start_created: startTime,
            end_created: endTime,
            page_no: page,
            ...extParams
        }, {
            ext
        });
    }

    /**
     * 发放奖品
     * @param ename
     * @param openId
     * @param extParams
     * @param ext
     */
    async sendBenefit(
        {
            ename,
            receiverOpenId = this.openId,
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke("alibaba.benefit.send", {
            right_ename: ename,
            receiver_id: receiverOpenId,//用户openid
            user_type: "taobao",//固定参数
            unique_id: Utils.uuid.v1(),
            app_name: "mtop",
            ...extParams
        }, {
            ext
        });
        r.code = Number(r.data.result_success === true);
        return r;
    }


    /**
     * 为当前用户标记指定商品
     * @param sku_id
     * @param item_id
     * @param openId
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.6344669azYA9UM&source=search&docId=51296&docType=2
     **/
    async opentradeSpecialUsersMark(
        {
            skuId,
            itemId,
            openId = this.openId
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.opentrade.special.users.mark",
            {
                status: "MARK",
                sku_id: String(skuId),
                item_id: String(itemId),
                open_user_ids: openId,
                hit: "true",
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(r.data.result && (r.data.code !== 50));
        return r;
    }

    /**
     * 绑定打标商品到小程序
     * @param miniapp_id
     * @param item_ids
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.7f2c669ahs9Hif&source=search&docId=51714&docType=2
     */
    async taobaoOpentradeSpecialItemsBind(
        {
            appCID,
            itemId
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.opentrade.special.items.bind",
            {
                miniapp_id: appCID,
                item_ids: itemId,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.results?.item_bind_result?.[0]?.bind_ok);
        return r;
    }

    /**
     * 查询已经绑定的打标商品
     * @param miniapp_id
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?docId=51716&docType=2&source=search
     */
    async taobaoOpentradeSpecialItemsQuery(
        {
            appCID
        }, {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.opentrade.special.items.query",
            {
                miniapp_id: appCID,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.items?.number);
        return r;
    }

    /**
     * 获取商品信息
     * @param num_iid
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?spm=a219a.7386797.0.0.1b14669agpX3MB&source=search&docId=24625&docType=2
     */
    async taobaoItemSellerGet(
        {
            numIid
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.item.seller.get",
            {
                fields: "num_iid,title,nick,price,approve_status,sku",
                num_iid: numIid,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.item);
        return r;
    }

    /**
     * 获取多个商品信息
     * @param num_iid
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?docId=24626&docType=2&source=search
     */
    async taobaoItemsSellerListGet(
        {
            numIids
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.items.seller.list.get",
            {
                fields: "num_iid,title,nick,price,approve_status,sku",
                num_iids: numIids,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.items.item);
        return r;
    }

    /**
     * 会员积分变更
     * @param num   增加数量
     * @param openId    默认为当前用户增加
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?docId=45305&docType=2&scopeId=16898
     */
    async taobaoCrmPointChange(
        {
            num,
            openId = this.openId
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.crm.point.change",
            {
                change_type: 3,
                opt_type: 0,
                quantity: num,
                open_id: openId,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.result);
        return r;
    }

    /**
     * 会员积分查询
     * @param mix_nick
     * @param openId
     * @param extParams
     * @param ext
     * @doc 参考：https://open.taobao.com/api.htm?docId=42617&docType=2&scopeId=15929
     */
    async taobaoCrmPointAvailableGet(
        {
            mixNick = this.mixNick,
        },
        {
            extParams = {},
            ext = {}
        } = {}
    ): Promise<result> {
        let r = this.getResult();
        r.data = await this.invoke(
            "taobao.crm.point.available.get",
            {
                mix_nick: mixNick,
                ...extParams
            },
            {
                ext
            }
        );
        r.code = Number(!!r.data.result);
        return r;
    }

}

