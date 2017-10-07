/** Value is a number of a vector of 2, 3, 4 numbers */
export type Value = number | number[];

/** Value type: float, int, bool, Vector2, Vector3, Quaternion */
export type ValueType = string;

/** Input attribute declaration */
export interface Input {
    /** The type of the input attribute */
    type: ValueType;
    /** The default value of the input attribute */
    default?: number | number[];
}

/** Output attribute declaration */
export interface Output {
    /** The type of the output attribute */
    type: ValueType;
}

/** Type of a expression: constant, variable, function, field */
export type ExpressionType =
    "constant" |        // A constant value.
    "variable" |        // The value of a variable.
    "function" |        // A predefined function.
    "field"             // Get a field of an object.
;

/** Base expression interface */
export interface Expression {
    /** The type of the expression */
    type: ExpressionType;
    /** The type of the value of the expression */
    valueType: ValueType;
}

/** Cosntant expression   */
export interface ExpressionConstant extends Expression {
    type: "constant";
    /** The constant value */
    value: Value;
}

/** Variable expression */
export interface ExpressionVariable extends Expression {
    type: "variable";
    /** The name of the variable */
    variableName: string;
}

/** Field expression */
export interface ExpressionField extends Expression {
    type: "field";
    /** The name of the field: x, y, z, w, r, g, b, a or any combination of these */
    fieldName: string;
    /** The value from which to take the field */
    value: Expression;
}

/** Function call expression */
export interface ExpressionFunction extends Expression {
    type: "function";
    /** The name of the function */
    functionName: string;
    /** The arguments of the function */
    arguments: Expression[];
}

/** Type of a statement: assign, condition, for, emit */
export type StatementType =
    "assign" |      // Assign the result of an expression to a variable.
    "condition" |   // Conditional statement.
    "for" |         // For loop.
    "emit"          // Emit vertex.
;

/** Base statement interface */
export interface Statement {
    /** The type of the statement */
    type: StatementType;
}

/** Assign statement */
export interface StatementAssign extends Statement {
    type: "assign";
    /** The variable to assign to */
    variableName: string;
    /** The value to assign */
    expression: Expression;
}

/** Emit statement */
export interface StatementEmit extends Statement {
    type: "emit";
    /** The vertex attributes to emit */
    attributes: {
        [name: string]: Expression;
    }
}

/** For loop statement */
export interface StatementForLoop extends Statement {
    type: "for";
    /** The loop variable's name */
    variableName: string;
    /** The range's start, must be integer */
    rangeMin: number;
    /** The range's end, must be integer */
    rangeMax: number;
    /** The statements in the for loop */
    statements: Statement[];
}

/** Condition statement */
export interface StatementCondition extends Statement {
    type: "condition";
    /** The conditional expression (should return bool value) */
    condition: Expression;
    /** Statements to execute if the condition is true */
    trueStatements: Statement[];
    /** Statements to execute if the condition is false */
    falseStatements: Statement[];
}

/** Mark specification */
export interface Mark {
    /** Input attributes */
    input: { [name: string]: Input };
    /** Output vertex attributes */
    output: { [name: string]: Output };
    /** Variable list */
    variables: { [name: string]: ValueType };
    /** Mark statements */
    statements: Statement[];

    repeatBegin?: number;
    repeatEnd?: number;
}

/** Shader specification */
export interface Shader {
    /** Input attributes */
    input: { [name: string]: Input };
    /** Output attributes */
    output: { [name: string]: Output };
    /** Variable list */
    variables: { [name: string]: ValueType };
    /** Shader statements */
    statements: Statement[];
}

/** A named map of Marks */
export interface Marks {
    [name: string]: Mark;
}