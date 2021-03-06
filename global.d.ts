interface activity {
    _id: string,
    title: string,
    data: {
        grantTotal: any,
        //开奖状态
        award: boolean,
    },
    startTime: string,
    endTime: string,
    //0--未删除，1--已删除
    isDel: 0 | 1,
    config: activityConfig

    [key: string]: any
}

interface activityConfig {
    lotteryPrize: {
        condition: {
            num: number,
            type: string
        },
        prizeList: configPrize[]
    },
    fixedPrizeList: configPrize[],
    assistance: configPrize,
    rankPrizeList: configPrize[],

    [key: string]: any
}


interface configPrize {
    id: string,
    type: 'coupon' | 'item' | 'code' | 'goods' | 'benefit' | 'point' | "noprize" | "multiple"
    stock: number
    condition: {
        num: number,
        type: string
        [key: string]: any
    },
    name: string
    dayStock: boolean

    [key: string]: any
}


interface result<E = any> {
    code?: number,
    message?: string,
    data?: E,

    [props: string]: any
}

interface mongodbOptions {
    $set?: any
    $push?: any,
    $inc?: any
}

type listResult<T> = {
    data: T[];
    total?: number;
    [other: string]: any;
}


type orderExt = {
    use_has_next?: boolean,
    buyer_open_id?: string,
    page_no?: number,
    [other: string]: any
}


interface other {
    [key: string]: any
}

interface checkType {
    [key: string]: "number" | "array" | "string" | "object" | "boolean" | "any"
}


type stockInfo = {
    done: number,
    restStock: boolean,
    prizeId: string,
    dayStock: boolean,
    dayDone?: number
}


interface exp {
    [k: string]: {
        constructor,
        params: checkType,
        needGlobalParam?: boolean,
        before: Function[]
        [k: string]: any
    }

}
