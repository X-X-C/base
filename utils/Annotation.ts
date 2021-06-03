import App from "../App";

export function exp(params?: checkType) {
    return (t, k) => {
        App.exports[k] = {
            constructor: t.constructor,
            params
        }
    }
}
