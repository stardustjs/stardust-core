import { Specification } from "../spec/spec";
import { RuntimeError } from "../exceptions";
import { Dictionary } from "../utils/utils";

import * as Intrinsics from "../intrinsics/intrinsics";

export type EmittedVertex = { [ name: string ]: Specification.Value };

export class Context {
    private _variables: Dictionary<Specification.Value>;

    constructor() {
        this._variables = new Dictionary<Specification.Value>();
    }

    public get(name: string): Specification.Value {
        if(!this._variables.has(name)) {
            throw new RuntimeError(`'${name}' is undefined.`);
        }
        return this._variables.get(name);
    }

    public set(name: string, value: Specification.Value) {
        this._variables.set(name, value);
    }

    public evaluateExpression(expression: Specification.Expression): Specification.Value {
        switch(expression.type) {
            case "function": {
                let expr = expression as Specification.ExpressionFunction;
                let args = expr.arguments.map((arg) => this.evaluateExpression(arg));
                let func = Intrinsics.getIntrinsicFunction(expr.functionName);
                if(!func) {
                    throw new RuntimeError(`function '${expr.functionName}' is undefined.`);
                }
                return func.javascriptImplementation(...args);
            }
            case "field": {
                let expr = expression as Specification.ExpressionField;
                let value = this.evaluateExpression(expr.value);
                switch(expr.fieldName) {
                    case "x": return (value as number[])[0];
                    case "y": return (value as number[])[1];
                    case "z": return (value as number[])[2];
                    case "w": return (value as number[])[3];
                    case "r": return (value as number[])[0];
                    case "g": return (value as number[])[1];
                    case "b": return (value as number[])[2];
                    case "a": return (value as number[])[3];
                }
                throw new RuntimeError("invalid field.");
            }
            case "constant": {
                let expr = expression as Specification.ExpressionConstant;
                return expr.value;
            }
            case "variable": {
                let expr = expression as Specification.ExpressionVariable;
                return this.get(expr.variableName);
            }
        }
    }

    public evaluateStatement(statement: Specification.Statement): EmittedVertex[] {
        switch(statement.type) {
            case "assign": {
                let s = statement as Specification.StatementAssign;
                this.set(s.variableName, this.evaluateExpression(s.expression));
                return [];
            }
            case "condition": {
                let s = statement as Specification.StatementCondition;
                let condition = this.evaluateExpression(s.condition) as number;
                if(condition != 0) {
                    return this.evaluateStatements(s.trueStatements);
                } else {
                    return this.evaluateStatements(s.falseStatements);
                }
            }
            case "emit": {
                let s = statement as Specification.StatementEmit;
                let emitInfo: { [ name: string ]: Specification.Value } = {};
                for(let name in s.attributes) {
                    let value = this.evaluateExpression(s.attributes[name]);
                    emitInfo[name] = value;
                }
                return [ emitInfo ];
            }
        }
    }

    public evaluateStatements(statements: Specification.Statement[]): EmittedVertex[] {
        let result: EmittedVertex[] = [];
        for(let s of statements) {
            let v = this.evaluateStatement(s);
            for(let r of v) {
                result.push(r);
            }
        }
        return result;
    }

    public evaluateMark(mark: Specification.Mark, inputs: { [name: string]: Specification.Value }): EmittedVertex[] {
        for(let name in inputs) {
            this.set(name, inputs[name]);
        }
        return this.evaluateStatements(mark.statements);
    }
}