import { Specification, types, Type } from "../spec/spec";
import { MathType } from "../math/math";
import { TextureBinding } from "./array";

// Primitives are immediate values, including number, number array, Vector, Quaternion and Color.
export type BindingPrimitive = Specification.Value | MathType;
// Binding functions map data items to binding primitives.
export type BindingFunction = (data?: any, index?: number) => BindingPrimitive;
// Binding value is either a primitive, a function or a scale binding.
export type BindingValue = BindingPrimitive | BindingFunction | TextureBinding;

export enum BindingType {
    VALUE     = 0,
    FUNCTION  = 1,
    TEXTURE   = 2
}

export class ShiftBinding {
    constructor(
        public name: string,
        public offset: number
    ) { }
}

// Resolve binding primitives to Value (Value = number or number[]).
export function getBindingValue(value: BindingPrimitive): Specification.Value {
    if(value instanceof MathType) {
        return value.toArray();
    } else {
        return value;
    }
}