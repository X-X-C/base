import Time from "../../utils/Time";
import Utils from "../../utils/Utils";
import ServiceManager from "./ServiceManager";
import App from "../../App";
import BaseResult from "../../dto/BaseResult";
import BaseDao from "../../dao/BaseDao";

export default abstract class BaseService<E extends object> {
    protected constructor(app: App, tb?: string) {
        this.dao = new BaseDao(app.context);
        this.app = app;
        this.editStrict = true;
        if (tb) {
            this.dao.initTb(tb);
        }
    }

    protected app: App;
    protected dao: BaseDao<E>;
    protected editStrict: boolean;

    protected time(date: any = new Date(), parse?): Time {
        return new Time(date, parse);
    };

    get response(): BaseResult {
        return this.app.response || BaseResult.success();
    }

    get context(): any {
        return this.app.context;
    }

    get cloud(): any {
        return this.context.cloud;
    }

    get data(): any {
        return this.context.data;
    }

    get nick(): string {
        return this.context.userNick || this.context.mixNick.substr(0, 1) + "**";
    }

    get openId(): string {
        return this.context.openId;
    }

    get mixNick(): string {
        return this.context.mixNick;
    }

    get activityId(): string {
        return this.data.activityId;
    }

    get loosen(): this {
        this.editStrict = false;
        return this;
    }

    get globalActivity() {
        return this.app.globalActivity;
    }


    getService<C extends { [prop: string]: any }>(target: (new (...args) => C)): C {
        if (this.app.services instanceof ServiceManager) {
            return this.app.services.getService(target);
        } else {
            return new target(this.app);
        }
    }

    /**
     * 新增一条数据
     * @param entity
     */
    async insertOne(entity: E): Promise<string> {
        return await this.dao.insertOne(entity);
    }

    /**
     * 新增多条数据
     * @param entity
     */
    async insertMany(entity: E[]): Promise<string[]> {
        if (entity.length > 0) {
            return await this.dao.insertMany(entity);
        }
        return [];
    }

    /**
     * 编辑
     * @param filter
     * @param options
     * @param ignore
     */
    async edit(filter: E | other, options: any): Promise<number> {
        let line = 0;
        if (Utils.cleanObj(options, false)) {
            line = await this.dao.update(filter, options);
        }
        if (line === 0 && this.editStrict === true) {
            let r = BaseResult.fail();
            r.set501();
            r.data = JSON.parse(JSON.stringify({
                filter, options
            }).replace(/[$.]/g, ">>"))
            throw r;
        }
        this.editStrict = true;
        return line;
    }

    /**
     * 删除
     * @param filter
     */
    async delete(filter: E | other): Promise<number> {
        return await this.dao.delete(filter);
    }

    /**
     * 统计查询
     * @param filter
     */
    async count(filter: E | other): Promise<number> {
        return await this.dao.count(filter);
    }

    async aggregate(pipe: Array<any>): Promise<any[]> {
        return await this.dao.aggregate(pipe);
    }

    /**
     * 分页查询带限制条件
     * 返回分页数据
     * @param filter
     * @param options
     */
    async pageList(
        filter: E | other = {},
        options: {
            page?: number,
            size?: number,
            project?: any,
            sort?: any,
            [otherKey: string]: any
        }
    ) {
        let rs: listResult<E | other> = {
            data: []
        };
        let {page, size} = options;
        page = page || 1;
        size = size || 100;
        rs.total = await this.dao.count(filter)
        options.skip = (page - 1) * size;
        options.limit = size;
        rs.data = await this.getAll(filter, options);
        return rs;
    }

    /**
     * 获取单条数据
     * @param filter
     * @param options
     */
    async get(filter: E | other = {}, options: any = {}): Promise<E> {
        return (await this.getAll(filter, {
            limit: 1,
            ...options
        }))[0];
    }

    /**
     * 获取所有数据
     * @param filter
     * @param options
     */
    async getAll(filter: E | other = {}, options: {
        sort?: any,
        skip?: number,
        limit?: number,
        project?: any
    } = {}): Promise<E[]> {
        let pipe = [];
        if (!Utils.isBlank(filter)) pipe.push({$match: filter});
        if (!Utils.isBlank(options.sort)) pipe.push({$sort: options.sort});
        if (!Utils.isBlank(options.skip)) pipe.push({$skip: options.skip});
        if (!Utils.isBlank(options.limit)) pipe.push({$limit: options.limit});
        if (!Utils.isBlank(options.project)) pipe.push({$project: options.project});
        return await this.aggregate(pipe);
    }


    stockInfo(prize: configPrize) {
        let grant = this.globalActivity.data.data.grantTotal;
        let rs = {
            done: 0,
            restStock: false
        }
        if (prize.dayStock === true) {
            let time = this.time().common.YYYYMMDD;
            rs.done = grant?.dayStock?.[prize.id]?.[time] || 0;
        } else {
            rs.done = grant?.[prize.id] || 0;
        }
        rs.restStock = rs.done < prize.stock
        return rs;
    }

    /**
     * 从云端下载文件
     * @param fileId
     */
    async downloadFile(fileId: string): Promise<any> {
        return await this.dao.downloadFile(fileId);
    }

    /**
     * 上传文件到云端并返回可访问连接
     * @param buffer
     * @param fileName
     */
    async uploadFile(buffer: any, fileName: string): Promise<string> {
        return await this.dao.uploadFile(buffer, fileName);
    }

    async spm(type, data?, ext?) {
        await this.app.addSpm(type, data, ext);
    }

    async simpleSpm(type, data?, ext?) {
        await this.app.addSimpleSpm(type, data, ext);
    }
}
