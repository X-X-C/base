import App from "../App";

export function exp(params?: checkType) {
    return (t, k) => {
        App.exports[k] = {
            constructor: t.constructor,
            params,
            needGlobalParam: true
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
