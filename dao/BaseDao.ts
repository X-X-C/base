export default class BaseDao<T> {

    constructor(public context: any) {
    }

    db;

    initTb(table) {
        try {
            this.db = this.context.cloud.db.collection(table);
        } catch (e) {
            throw "获取数据库连接失败";
        }
    }

    async delete(filter: any): Promise<number> {
        return await this.db.deleteMany(filter);
    }

    async insertOne(bean: any): Promise<string> {
        return await this.db.insertOne(bean);
    }

    async insertMany(beans: Array<T>): Promise<string[]> {
        return await this.db.insertMany(beans);
    }

    async update(filter: any, options: any): Promise<number> {
        return await this.db.updateMany(filter, options);
    }

    async count(filter: any): Promise<number> {
        return await this.db.count(filter);
    };

    async aggregate(pipe: any[]): Promise<any[]> {
        return await this.db.aggregate(pipe);
    };

    /**
     * 从云端下载文件
     * @param fileId
     */
    async downloadFile(fileId): Promise<any> {
        return await this.context.cloud.file.downloadFile({fileId});
    }

    /**
     * 上传文件到云端并返回可访问连接
     * @param buffer
     * @param fileName
     */
    async uploadFile(buffer: any, fileName: string): Promise<string> {
        //上传文件
        let result = await this.context.cloud.file.uploadFile({
            fileContent: buffer,
            fileName: fileName
        });
        //获取访问链接
        return await this.getTempFileUrl(result.fileId);
    }

    /**
     * 获取访问链接
     * @param fileId
     */
    async getMultipleTempFileUrl(fileId): Promise<string[]> {
        //获取链接
        let url = await this.context.cloud.file.getTempFileURL({
            fileId: fileId
        })
        //返回链接
        return url.map(v=>v.url.replace(/-internal/g, ""));
    }


    async getTempFileUrl(fileId): Promise<string> {
        return (await this.getMultipleTempFileUrl(fileId))[0];
    }

}
