// Construct part of specification.
import { getInternalName } from "./intrinsics";
import { Specification } from "./spec";

export function func(name: string, returnType: string, ...args: Specification.Expression[]): Specification.Expression {
    return {
        type: "function",
        functionName: getInternalName({
            name: name,
            argTypes: args.map((arg) => arg.valueType),
            returnType: returnType
        }),
        arguments: args,
        valueType: returnType
    } as Specification.ExpressionFunction;
}

export function op(name: string, returnType: string, ...args: Specification.Expression[]): Specification.Expression {
    return {
        type: "function",
        functionName: getInternalName({
            name: `@${name}`,
            argTypes: args.map((arg) => arg.valueType),
            returnType: returnType
        }),
        valueType: returnType,
        arguments: args,
    } as Specification.ExpressionFunction;
}

export function variable(varName: string, varType: string): Specification.Expression {
    return {
        type: "variable",
        variableName: varName,
        valueType: varType
    } as Specification.ExpressionVariable;
}

export function constant(value: number | number[], valueType: string): Specification.Expression {
    return {
        type: "constant",
        value: value,
        valueType: valueType
    } as Specification.ExpressionConstant;
}

export function mix(a1: Specification.Expression, a2: Specification.Expression, t: Specification.Expression) {
    return func("mix", a1.valueType, a1, a2, t);
}

export function exp(x: Specification.Expression) {
    return func("exp", "float", x);
}

export function log(x: Specification.Expression) {
    return func("log", "float", x);
}

export function add(a1: Specification.Expression, a2: Specification.Expression) {
    return op("+", a1.valueType, a1, a2);
}
export function sub(a1: Specification.Expression, a2: Specification.Expression) {
    return op("-", a1.valueType, a1, a2);
}
export function mul(a1: Specification.Expression, a2: Specification.Expression) {
    return op("*", a1.valueType, a1, a2);
}
export function div(a1: Specification.Expression, a2: Specification.Expression) {
    return op("/", a1.valueType, a1, a2);
}

export function greaterThan(a1: Specification.Expression, a2: Specification.Expression) {
    return op(">", "bool", a1, a2);
}

export function lessThan(a1: Specification.Expression, a2: Specification.Expression) {
    return op("<", "bool", a1, a2);
}