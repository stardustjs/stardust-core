import {Specification} from "../spec/spec";
import {Dictionary} from "../utils/utils";
import {Quaternion, Vector2, Vector3} from "../math/math";

export type IntrinsicFunction = (...args: Specification.Value[]) => Specification.Value;

export interface IntrinsicFunctionInfo {
    internalName?: string;
    name: string;
    argTypes: string[];
    returnType: string;
    javascriptImplementation: (...args: Specification.Value[]) => Specification.Value;
}

export interface TypeConversionInfo {
    internalName: string;
    rank: number;
}

export interface ConstantInfo {
    name: string;
    type: string;
    value: Specification.Value;
}

// Global intrinsic functions.
let intrinsicFunctions = new Dictionary<IntrinsicFunctionInfo>();
let intrinsicFunctionList: IntrinsicFunctionInfo[] = [];
let typeConversions = new Dictionary<TypeConversionInfo>();
let constants = new Dictionary<ConstantInfo>();

export function getInternalName(func: { name: string, argTypes: string[], returnType: string }) {
    return `@${func.name}:${func.argTypes.join(",")}:${func.returnType}`;
}

export function getIntrinsicFunction(internalName: string): IntrinsicFunctionInfo {
    if(!intrinsicFunctions.has(internalName)) {
        console.log(internalName);
    }
    return intrinsicFunctions.get(internalName);
}

export function forEachIntrinsicFunction(callback: (info: IntrinsicFunctionInfo) => any) {
    intrinsicFunctionList.forEach(callback);
}

export function addIntrinsicFunction(func: IntrinsicFunctionInfo) {
    func.internalName = getInternalName(func);
    intrinsicFunctions.set(func.internalName, func);
    intrinsicFunctionList.push(func);
}

export function addConstant(name: string, type: string, value: Specification.Value) {
    let constant: ConstantInfo = {
        name: name,
        type: type,
        value: value
    };
    constants.set(name, constant);
}

export function forEachConstant(callback: (info: ConstantInfo) => any) {
    constants.forEach(callback);
}

export function forEachTypeConversion(callback: (info: TypeConversionInfo) => any) {
    typeConversions.forEach(callback);
}

export function getTypeConversion(srcType: string, destType: string): TypeConversionInfo {
    return typeConversions.get(`${srcType}:${destType}`);
}

function RegisterTypeConversion(srcType: string, destType: string, rank: number, func: IntrinsicFunction) {
    let name = `cast:${srcType}:${destType}`;
    let info: IntrinsicFunctionInfo = {
        name: name, argTypes: [srcType], returnType: destType, javascriptImplementation: func
    };
    addIntrinsicFunction(info);
    typeConversions.set(`${srcType}:${destType}`, { internalName: info.internalName, rank: rank });
}

function RegisterFunction(name: string, argTypes: string[], returnType: string, func: IntrinsicFunction) {
    addIntrinsicFunction({
        name: name, argTypes: argTypes, returnType: returnType, javascriptImplementation: func
    });
}

function RegisterOperator(name: string, argTypes: string[], returnType: string, func: IntrinsicFunction) {
    addIntrinsicFunction({
        name: `@${name}`, argTypes: argTypes, returnType: returnType, javascriptImplementation: func
    });
}

function not_implemented(): Specification.Value {
    throw new Error("not implemented");
}

let RegisterConstructor = (type: string, srcTypes: string[], func: IntrinsicFunction) => RegisterFunction(type, srcTypes, type, func);

// Basic arithmetics: +, -, *, /.
RegisterOperator("+", [ "float", "float" ], "float", (a: number, b: number) => a + b);
RegisterOperator("-", [ "float", "float" ], "float", (a: number, b: number) => a - b);
RegisterOperator("*", [ "float", "float" ], "float", (a: number, b: number) => a * b);
RegisterOperator("/", [ "float", "float" ], "float", (a: number, b: number) => a / b);

RegisterOperator("+", [ "float" ], "float", (a: number) => +a);
RegisterOperator("-", [ "float" ], "float", (a: number) => -a);

RegisterOperator("%", [ "int", "int" ], "int", (a: number, b: number) => a % b);
RegisterOperator("%", [ "float", "float" ], "float", (a: number, b: number) => a % b);

RegisterOperator("+", [ "int", "int" ], "int", (a: number, b: number) => a + b);
RegisterOperator("-", [ "int", "int" ], "int", (a: number, b: number) => a - b);
RegisterOperator("*", [ "int", "int" ], "int", (a: number, b: number) => a * b);
RegisterOperator("/", [ "int", "int" ], "int", (a: number, b: number) => a / b);

RegisterOperator("+", [ "int" ], "int", (a: number) => +a);
RegisterOperator("-", [ "int" ], "int", (a: number) => -a);

RegisterOperator("+", [ "Vector2", "Vector2" ], "Vector2", (a: number[], b: number[]) => [ a[0] + b[0], a[1] + b[1] ]);
RegisterOperator("-", [ "Vector2", "Vector2" ], "Vector2", (a: number[], b: number[]) => [ a[0] - b[0], a[1] - b[1] ]);
RegisterOperator("*", [ "Vector2", "Vector2" ], "Vector2", (a: number[], b: number[]) => [ a[0] * b[0], a[1] * b[1] ]);
RegisterOperator("/", [ "Vector2", "Vector2" ], "Vector2", (a: number[], b: number[]) => [ a[0] / b[0], a[1] / b[1] ]);
RegisterOperator("+", [ "Vector2" ], "Vector2", (a: number[]) => a);
RegisterOperator("-", [ "Vector2" ], "Vector2", (a: number[]) => [ -a[0], -a[1] ]);

RegisterOperator("+", [ "Vector3", "Vector3" ], "Vector3", (a: number[], b: number[]) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ]);
RegisterOperator("-", [ "Vector3", "Vector3" ], "Vector3", (a: number[], b: number[]) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ]);
RegisterOperator("*", [ "Vector3", "Vector3" ], "Vector3", (a: number[], b: number[]) => [ a[0] * b[0], a[1] * b[1], a[2] * b[2] ]);
RegisterOperator("/", [ "Vector3", "Vector3" ], "Vector3", (a: number[], b: number[]) => [ a[0] / b[0], a[1] / b[1], a[2] / b[2] ]);
RegisterOperator("+", [ "Vector3" ], "Vector3", (a: number[]) => a);
RegisterOperator("-", [ "Vector3" ], "Vector3", (a: number[]) => [ -a[0], -a[1], -a[2] ]);

RegisterOperator("+", [ "Vector4", "Vector4" ], "Vector4", (a: number[], b: number[]) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3] ]);
RegisterOperator("-", [ "Vector4", "Vector4" ], "Vector4", (a: number[], b: number[]) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3] ]);
RegisterOperator("*", [ "Vector4", "Vector4" ], "Vector4", (a: number[], b: number[]) => [ a[0] * b[0], a[1] * b[1], a[2] * b[2], a[3] * b[3] ]);
RegisterOperator("/", [ "Vector4", "Vector4" ], "Vector4", (a: number[], b: number[]) => [ a[0] / b[0], a[1] / b[1], a[2] / b[2], a[3] / b[3] ]);
RegisterOperator("+", [ "Vector4" ], "Vector4", (a: number[]) => a);
RegisterOperator("-", [ "Vector4" ], "Vector4", (a: number[]) => [ -a[0], -a[1], -a[2], -a[3] ]);

RegisterOperator("*", [ "float", "Vector2" ], "Vector2", (a: number, b: number[]) => [ a * b[0], a * b[1] ]);
RegisterOperator("*", [ "Vector2", "float" ], "Vector2", (a: number[], b: number) => [ a[0] * b, a[1] * b ]);
RegisterOperator("*", [ "Vector2", "float" ], "Vector2", (a: number[], b: number) => [ a[0] / b, a[1] / b ]);
RegisterOperator("*", [ "float", "Vector3" ], "Vector3", (a: number, b: number[]) => [ a * b[0], a * b[1], a * b[2] ]);
RegisterOperator("*", [ "Vector3", "float" ], "Vector3", (a: number[], b: number) => [ a[0] * b, a[1] * b, a[2] * b ]);
RegisterOperator("*", [ "Vector3", "float" ], "Vector3", (a: number[], b: number) => [ a[0] / b, a[1] / b, a[2] / b ]);
RegisterOperator("*", [ "float", "Vector4" ], "Vector4", (a: number, b: number[]) => [ a * b[0], a * b[1], a * b[2], a * b[3] ]);
RegisterOperator("*", [ "Vector4", "float" ], "Vector4", (a: number[], b: number) => [ a[0] * b, a[1] * b, a[2] * b, a[3] * b ]);
RegisterOperator("*", [ "Vector4", "float" ], "Vector4", (a: number[], b: number) => [ a[0] / b, a[1] / b, a[2] / b, a[3] / b ]);

// Comparison operators.
RegisterOperator("==", [ "float", "float" ], "bool", (a: number, b: number) => a == b ? 1 : 0);
RegisterOperator(">", [ "float", "float" ], "bool", (a: number, b: number) => a > b ? 1 : 0);
RegisterOperator("<", [ "float", "float" ], "bool", (a: number, b: number) => a < b ? 1 : 0);
RegisterOperator(">=", [ "float", "float" ], "bool", (a: number, b: number) => a >= b ? 1 : 0);
RegisterOperator("<=", [ "float", "float" ], "bool", (a: number, b: number) => a <= b ? 1 : 0);

RegisterOperator("==", [ "int", "int" ], "bool", (a: number, b: number) => a == b ? 1 : 0);
RegisterOperator(">", [ "int", "int" ], "bool", (a: number, b: number) => a > b ? 1 : 0);
RegisterOperator("<", [ "int", "int" ], "bool", (a: number, b: number) => a < b ? 1 : 0);
RegisterOperator(">=", [ "int", "int" ], "bool", (a: number, b: number) => a >= b ? 1 : 0);
RegisterOperator("<=", [ "int", "int" ], "bool", (a: number, b: number) => a <= b ? 1 : 0);

RegisterOperator("==", [ "bool", "bool" ], "bool", (a: number, b: number) => a == b ? 1 : 0);

// Boolean operators.
RegisterOperator("!", [ "bool" ], "bool", (a: number) => !a ? 1 : 0);
RegisterOperator("&&", [ "bool", "bool" ], "bool", (a: number, b: number) => a && b ? 1 : 0);
RegisterOperator("||", [ "bool", "bool" ], "bool", (a: number, b: number) => a || b ? 1 : 0);

// Vector/quaternion constructors.
RegisterConstructor("Vector2", [ "float", "float" ], (a: number, b: number) => [a, b]);
RegisterConstructor("Vector3", [ "float", "float", "float" ],  (a: number, b: number, c: number) => [a, b, c]);
RegisterConstructor("Vector4", [ "float", "float", "float", "float" ],  (a: number, b: number, c: number, d: number) => [a, b, c, d]);
RegisterConstructor("Color", [ "float", "float", "float", "float" ],  (a: number, b: number, c: number, d: number) => [a, b, c, d]);
RegisterConstructor("Quaternion", [ "float", "float", "float", "float" ],  (a: number, b: number, c: number, d: number) => [a, b, c, d]);

// Math functions.
RegisterFunction("abs", [ "float" ], "float", (a: number) => Math.abs(a));
RegisterFunction("sqrt", [ "float" ], "float", (a: number) => Math.sqrt(a));
RegisterFunction("exp", [ "float" ], "float", (a: number) => Math.exp(a));
RegisterFunction("log", [ "float" ], "float", (a: number) => Math.log(a));
RegisterFunction("sin", [ "float" ], "float", (a: number) => Math.sin(a));
RegisterFunction("cos", [ "float" ], "float", (a: number) => Math.cos(a));
RegisterFunction("tan", [ "float" ], "float", (a: number) => Math.tan(a));
RegisterFunction("asin", [ "float" ], "float", (a: number) => Math.asin(a));
RegisterFunction("acos", [ "float" ], "float", (a: number) => Math.acos(a));
RegisterFunction("atan", [ "float" ], "float", (a: number) => Math.atan(a));
RegisterFunction("atan2", [ "float", "float" ], "float", (a: number, b: number) => Math.atan2(a, b));

RegisterFunction("abs", [ "int" ], "int", (a: number) => Math.abs(a));
RegisterFunction("min", [ "int", "int" ], "int", (a: number, b: number) => Math.min(a, b));
RegisterFunction("max", [ "int", "int" ], "int", (a: number, b: number) => Math.max(a, b));
RegisterFunction("min", [ "float", "float" ], "float", (a: number, b: number) => Math.min(a, b));
RegisterFunction("max", [ "float", "float" ], "float", (a: number, b: number) => Math.max(a, b));
RegisterFunction("ceil", [ "float" ], "float", (a: number, b: number) => Math.ceil(a));
RegisterFunction("floor", [ "float" ], "float", (a: number, b: number) => Math.floor(a));

RegisterFunction("mix", [ "float", "float", "float" ], "float", (a: number, b: number, t: number) => a + (b - a) * t);
RegisterFunction("mix", [ "Vector2", "Vector2", "float" ], "Vector2", null); // TODO
RegisterFunction("mix", [ "Vector3", "Vector3", "float" ], "Vector3", null);
RegisterFunction("mix", [ "Vector4", "Vector4", "float" ], "Vector4", null);
RegisterFunction("mix", [ "Color", "Color", "float" ], "Color", null);

RegisterFunction("clamp", [ "float" ], "float", (a: number) => Math.max(0, Math.min(1, a)));

// Vector functions.
RegisterFunction("dot", [ "Vector2", "Vector2" ], "float", (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1]);
RegisterFunction("dot", [ "Vector3", "Vector3" ], "float", (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
RegisterFunction("dot", [ "Vector4", "Vector4" ], "float", (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);

RegisterFunction("length", [ "Vector2" ], "float", (a: number[]) => Vector2.FromArray(a).normalize().toArray());
RegisterFunction("length", [ "Vector3" ], "float", (a: number[]) => Vector3.FromArray(a).normalize().toArray());
RegisterFunction("length", [ "Vector4" ], "float", (a: number[]) => Quaternion.FromArray(a).normalize().toArray());
RegisterFunction("length", [ "Quaternion" ], "float", (a: number[]) => Quaternion.FromArray(a).normalize().toArray());

RegisterFunction("normalize", [ "Vector2" ], "Vector2", (a: number[]) => Vector2.FromArray(a).length());
RegisterFunction("normalize", [ "Vector3" ], "Vector3", (a: number[]) => Vector3.FromArray(a).length());
RegisterFunction("normalize", [ "Vector4" ], "Vector4", (a: number[]) => Quaternion.FromArray(a).length());
RegisterFunction("normalize", [ "Quaternion" ], "Quaternion", (a: number[]) => Quaternion.FromArray(a).length());

RegisterFunction("cross", [ "Vector3", "Vector3" ], "Vector3", (a: number[], b: number[]) => {
    return Vector3.FromArray(a).cross(Vector3.FromArray(b)).toArray();
});

// Quaternion functions.
RegisterFunction("quat_mul", [ "Quaternion", "Quaternion" ], "Quaternion", (a: number[], b: number[]) => {
    return Quaternion.FromArray(a).mul(Quaternion.FromArray(b)).toArray();
});
RegisterFunction("quat_conj", [ "Quaternion" ], "Quaternion", (a: number[]) => {
    return Quaternion.FromArray(a).conj().toArray();
});
RegisterFunction("quat_slerp", [ "Quaternion", "Quaternion", "float" ], "Quaternion", (a: number[], b: number[], t: number) => {
    return Quaternion.Slerp(Quaternion.FromArray(a), Quaternion.FromArray(b), t).toArray();
});
RegisterFunction("quat_rotate", [ "Quaternion", "Vector3" ], "Vector3", (q: number[], v: number[]) => {
    return Quaternion.FromArray(q).rotate(Vector3.FromArray(v)).toArray();
});
RegisterFunction("quat_rotation", [ "Vector3", "float" ], "Quaternion", (axis: number[], angle: number) => {
    return Quaternion.Rotation(Vector3.FromArray(axis), angle).toArray();
});

// Color functions.
RegisterConstructor("Color", [ "float", "float", "float", "float" ],  (r: number, g: number, b: number, a: number) => [r, g, b, a]);
RegisterConstructor("Color", [ "float", "float", "float" ],  (r: number, g: number, b: number) => [r, g, b, 1]);
RegisterConstructor("Color", [ "float", "float" ],  (v: number, a: number) => [v, v, v, a]);
RegisterConstructor("Color", [ "float" ],  (v: number) => [v, v, v, 1]);

RegisterFunction("lab2rgb", [ "Color" ], "Color", (color: number[]) => color);
RegisterFunction("hcl2rgb", [ "Color" ], "Color", (color: number[]) => color);

// Type conversions.
// We only allow low-precision to high-precision conversions to be automated.
RegisterTypeConversion("bool", "int", 1, (a: number) => a);
RegisterTypeConversion("int", "float", 1, (a: number) => a);

// Explicit conversions.
RegisterFunction("int", [ "float" ], "int", (a: number) => Math.floor(a));
RegisterFunction("float", [ "int" ], "float", (a: number) => a);

RegisterTypeConversion("Quaternion", "Vector4", 0, (a: number) => a);
RegisterTypeConversion("Vector4", "Quaternion", 0, (a: number) => a);
RegisterTypeConversion("Color", "Vector4", 0, (a: number) => a);
RegisterTypeConversion("Vector4", "Color", 0, (a: number) => a);
RegisterTypeConversion("Vector4Array", "ColorArray", 0, (a: number) => a);
RegisterTypeConversion("ColorArray", "Vector4Array", 0, (a: number) => a);
RegisterTypeConversion("Vector4Array2D", "Image", 0, (a: number) => a);
RegisterTypeConversion("Image", "Vector4Image", 0, (a: number) => a);

// Constants
addConstant("PI", "float", Math.PI);
addConstant("SQRT2", "float", Math.SQRT2);
addConstant("SQRT1_2", "float", Math.SQRT1_2);
addConstant("RED", "Color", [ 1, 0, 0, 1 ]);

// Array and image
RegisterFunction("array", [ "FloatArray", "float" ], "float", not_implemented);
RegisterFunction("array", [ "Vector2Array", "float" ], "Vector2", not_implemented);
RegisterFunction("array", [ "Vector3Array", "float" ], "Vector3", not_implemented);
RegisterFunction("array", [ "Vector4Array", "float" ], "Vector4", not_implemented);
RegisterFunction("array", [ "ColorArray", "float" ], "Color", not_implemented);

RegisterFunction("image", [ "Image", "Vector2" ], "Color", not_implemented);
RegisterFunction("image", [ "Vector4Image", "Vector2" ], "Vector4", not_implemented);
RegisterFunction("image", [ "Vector3Image", "Vector2" ], "Vector3", not_implemented);
RegisterFunction("image", [ "Vector2Image", "Vector2" ], "Vector2", not_implemented);
RegisterFunction("image", [ "FloatImage", "Vector2" ], "float", not_implemented);