import * as Specification from "../specification";
import { MathType } from "../common";
import { TextureBinding } from "./array";

// Primitives are immediate values, including number, number array, Vector, Quaternion and Color.
export type BindingPrimitive = Specification.Value | MathType;
// Binding functions map data items to binding primitives.
export type BindingFunction = (data?: any, index?: number) => BindingPrimitive;
// Binding value is either a primitive, a function or a scale binding.
export type BindingValue = BindingPrimitive | BindingFunction | TextureBinding;

export enum BindingType {
    VALUE = 0,
    FUNCTION = 1,
    TEXTURE = 2
}

export class ShiftBinding {
    constructor(
        public name: string,
        public offset: number
    ) { }
}

// Resolve binding primitives to Value (Value = number or number[]).
export function getBindingValue(value: BindingPrimitive): Specification.Value {
    if (value instanceof MathType) {
        return value.toArray();
    } else {
        return value;
    }
}

/** Type */
export interface Type {
    name: string;
    size: number;
    primitive: string;
    primitiveCount: number;
}

export let types: { [name: string]: Type; } = {
    "float": { name: "float", size: 4, primitive: "float", primitiveCount: 1 },
    "int": { name: "int", size: 4, primitive: "int", primitiveCount: 1 },
    "Vector2": { name: "Vector2", size: 8, primitive: "float", primitiveCount: 2 },
    "Vector3": { name: "Vector3", size: 12, primitive: "float", primitiveCount: 3 },
    "Quaternion": { name: "Quaternion", size: 16, primitive: "float", primitiveCount: 4 },
    "Color": { name: "Color", size: 16, primitive: "float", primitiveCount: 4 }
}