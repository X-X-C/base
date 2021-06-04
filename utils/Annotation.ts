import App from "../App";

export function exp(params?: checkType) {
    return (t, k) => {
        if (App.exports[k]) {
            App.exports[k].params = params;
        } else {
            App.exports[k] = {
                constructor: t.constructor,
                params,
                needGlobalParam: true,
                before: []
            }
        }
    }
}


export function ignoreGlobalParam() {
    return (t, k) => {
        if (App.exports[k]) {
            App.exports[k].needGlobalParam = false;
        }
    }
}

export function before(...beforeFn: Function[]) {
    return (t, k) => {
        beforeFn = [...new Set(beforeFn)];
        beforeFn = beforeFn.filter(v => !App.exports[k].before.find(v1 => v1 === v));
        App.exports[k].before.push(...beforeFn);
    }
}
