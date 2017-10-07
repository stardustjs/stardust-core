/** A dictionary class that maps string to ValueType */
export class Dictionary<ValueType> {
    private _dict: { [name: string]: ValueType };
    constructor() {
        this._dict = {};
    }
    /** Set an entry */
    public set(key: string, value: ValueType) {
        this._dict[key] = value;
    }
    /** Determine if the dictionary has an entry */
    public has(key: string) {
        return this._dict.hasOwnProperty(key);
    }
    /** Delete an entry from the dictionary */
    public delete(key: string) {
        delete this._dict[key];
    }
    /** Get a entry, if not found, return undefined */
    public get(key: string): ValueType {
        if (this._dict.hasOwnProperty(key)) {
            return this._dict[key];
        } else {
            return undefined;
        }
    }
    /** Iterate over the dictionary */
    public forEach(cb: (value: ValueType, key: string) => any) {
        for (let key in this._dict) {
            if (this._dict.hasOwnProperty(key)) {
                cb(this._dict[key], key);
            }
        }
    }
    /** Create a copy of the dictionary */
    public clone() {
        let result = new Dictionary<ValueType>();
        this.forEach((value, key) => {
            result.set(key, value);
        });
        return result;
    }
}

/** Shallow clone an object */
export function shallowClone<T extends Object>(object: T): T {
    let result = {} as any;
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            result[key] = (object as any)[key];
        }
    }
    return result;
}

/** Attempt different names starting with prefix until check returns true */
export function attemptName(prefix: string, check: (candidate: string) => boolean): string {
    if (check(prefix)) return prefix;
    for (let i = 1; ; i++) {
        let c = prefix + i.toString();
        if (check(c)) return c;
    }
}