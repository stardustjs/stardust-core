export module Specification {
    export type Value = number | number[];

    export type ValueType = string;
    //     "float" |
    //     "int" |
    //     "Vector2" |
    //     "Vector3" |
    //     "Quaternion"
    // ;

    export interface Input {
        type: ValueType;
        default?: number | number[];
    }

    export interface Output {
        type: ValueType;
    }

    export type ExpressionType =
        "constant" |        // A constant value.
        "variable" |        // The value of a variable.
        "function" |        // A predefined function.
        "field"             // Get a field of an object.
    ;

    export interface Expression {
        type: ExpressionType;
        valueType: ValueType;
    }

    export interface ExpressionConstant extends Expression {
        type: "constant";
        value: Value;
    }

    export interface ExpressionVariable extends Expression {
        type: "variable";
        variableName: string;
    }

    export interface ExpressionField extends Expression {
        type: "field";
        fieldName: string;
        value: Expression;
    }

    export interface ExpressionFunction extends Expression {
        type: "function";
        functionName: string;
        arguments: Expression[];
    }

    export type StatementType =
        "assign" |      // Assign the result of an expression to a variable.
        "condition" |   // Conditional statement.
        "for" |         // For loop.
        "emit"          // Emit vertex.
    ;

    export interface Statement {
        type: StatementType;
    }

    export interface StatementAssign extends Statement {
        type: "assign";
        variableName: string;
        expression: Expression;
    }

    export interface StatementEmit extends Statement {
        type: "emit",
        attributes: {
            [name: string]: Expression;
        }
    }

    export interface StatementForLoop extends Statement {
        type: "for";
        variableName: string;
        rangeMin: number;
        rangeMax: number;
        statements: Statement[];
    }

    export interface StatementCondition extends Statement {
        type: "condition";
        condition: Expression;
        trueStatements: Statement[];    // statements to execute when condition is true.
        falseStatements: Statement[];   // statements to execute when condition is false.
    }

    export interface Mark {
        input: { [name: string]: Input };
        output: { [name: string]: Output };
        variables: { [name: string]: ValueType };
        statements: Statement[];
        repeatBegin?: number;
        repeatEnd?: number;
    }

    export interface Shader {
        input: { [name: string]: Input };
        output: { [name: string]: Output };
        variables: { [name: string]: ValueType };
        statements: Statement[];
    }

    export interface Marks {
        [name: string]: Mark;
    }
}

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