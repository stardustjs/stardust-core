export class Dictionary<ValueType> {
    private _dict: { [name: string]: ValueType };
    constructor() {
        this._dict = {};
    }
    public set(key: string, value: ValueType) {
        this._dict[key] = value;
    }
    public has(key: string) {
        return this._dict.hasOwnProperty(key);
    }
    public delete(key: string) {
        delete this._dict[key];
    }
    public get(key: string): ValueType {
        if(this._dict.hasOwnProperty(key)) {
            return this._dict[key];
        } else {
            return undefined;
        }
    }
    public forEach(cb: (value: ValueType, key: string) => any) {
        for(let key in this._dict) {
            if(this._dict.hasOwnProperty(key)) {
                cb(this._dict[key], key);
            }
        }
    }
    public clone() {
        let result = new Dictionary<ValueType>();
        this.forEach((value, key) => {
            result.set(key, value);
        });
        return result;
    }
}

export function shallowClone<T extends Object>(object: T): T {
    let result = {} as any;
    for(let key in object) {
        if(object.hasOwnProperty(key)) {
            result[key] = (object as any)[key];
        }
    }
    return result;
}

export function attemptName(prefix: string, check: (candidate: string) => boolean): string {
    if(check(prefix)) return prefix;
    for(let i = 1;; i++) {
        let c = prefix + i.toString();
        if(check(c)) return c;
    }
}

export function timeTask(name: string, cb: () => any) {
    let t0 = new Date().getTime();
    cb();
    let t1 = new Date().getTime();
    console.log(`${name}: ${((t1 - t0) / 1000).toFixed(3)}s`);
}