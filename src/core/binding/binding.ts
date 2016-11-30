// binding.js:
// Take care of data binding.

import { Specification, types, Type } from "../spec/spec";
import { MathType } from "../math/math";

// Primitives are immediate values, including number, number array, Vector, Quaternion and Color.
export type BindingPrimitive = Specification.Value | MathType;
// Binding functions map data items to binding primitives.
export type BindingFunction = (data?: any, index?: number) => BindingPrimitive;
// Binding value is either a primitive, a function or a scale binding.
export type BindingValue = BindingPrimitive | BindingFunction;

// Resolve binding primitives to Value (Value = number or number[]).
export function getBindingValue(value: BindingPrimitive): Specification.Value {
    if(value instanceof MathType) {
        return value.toArray();
    } else {
        return value;
    }
}

export class ShiftBinding {
    constructor(
        public name: string,
        public offset: number
    ) { }
}

// The main binding class.
export class Binding {
    private _type: Type;
    private _value: BindingValue;

    constructor(typeName: string, value: BindingValue) {
        this._type = types[typeName];
        this._value = value;
    }

    public get typeName(): string {
        return this._type.name;
    }

    public get type(): Type {
        return this._type;
    }

    public get size(): number {
        return this._type.size;
    }

    public get value(): BindingValue {
        return this._value;
    }

    public get isFunction(): boolean {
        return typeof(this._value) == "function";
    }

    public get specValue(): Specification.Value {
        return getBindingValue(this._value as BindingPrimitive);
    }

    public forEach(data: any[], callback: (value: Specification.Value, i: number) => any) {
        if(this.isFunction) {
            let f = this._value as BindingFunction;
            for(var i = 0; i < data.length; i++) {
                callback(getBindingValue(f(data[i], i)), i);
            }
        } else {
            let value = getBindingValue(this._value as BindingPrimitive);
            for(var i = 0; i < data.length; i++) {
                callback(value, i);
            }
        }
    }

    public map(data: any[]): Specification.Value[] {
        if(this.isFunction) {
            let f = this._value as BindingFunction;
            return data.map((d, i) => getBindingValue(f(d, i)));
        } else {
            let value = getBindingValue(this._value as BindingPrimitive);
            return data.map(() => value);
        }
    }

    public fillBinary(data: any[], rep: number, array: Float32Array | Int32Array) {
        let n = data.length;
        let p = this._type.primitiveCount;
        let ptr = 0;
        if(this.isFunction) {
            let f = this._value as BindingFunction;
            if(p == 1) {
                for(let i = 0; i < n; i++) {
                    let result = getBindingValue(f(data[i], i)) as number;
                    for(let k = 0; k < rep; k++) {
                        array[ptr++] = result;
                    }
                }
            } else {
                for(let i = 0; i < n; i++) {
                    let result = getBindingValue(f(data[i], i)) as number[];
                    for(let k = 0; k < rep; k++) {
                        for(let j = 0; j < p; j++) {
                            array[ptr++] = result[j];
                        }
                    }
                }
            }
        } else {
            let value = getBindingValue(this._value as BindingPrimitive);
            if(p == 1) {
                let v = value as number;
                for(let i = 0; i < n; i++) {
                    for(let k = 0; k < rep; k++) {
                        array[ptr++] = v;
                    }
                }
            } else {
                let v = value as number[];
                for(let i = 0; i < n; i++) {
                    for(let k = 0; k < rep; k++) {
                        for(let j = 0; j < p; j++) {
                            array[ptr++] = v[j];
                        }
                    }
                }
            }
        }
    }
}