export default class ActivityInfo {
    _id: string;
    //活动ID
    activityId: string;
    //库存
    stock: {
        [key: string]: number
    } = {}
    //天库存
    dayStock: any = {}
    //是否开奖
    award: boolean = false
}
