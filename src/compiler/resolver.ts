import { CompileError } from "../common";
import { Dictionary, attemptName } from "../common";

import * as Specification from "../specification";
import * as Intrinsics from "../intrinsics";
import * as Library from "../library";

import { SyntaxTree, parseFile } from "./parser";

export class ModuleResolver {
    private _functions: Dictionary<FunctionOverloadResolver>;
    private _functionModule: Dictionary<Dictionary<SyntaxTree.FileBlockFunction>>;
    private _currentMoudles: Dictionary<SyntaxTree.FileBlockFunction>[];

    constructor() {
        this._functions = new Dictionary<FunctionOverloadResolver>();
        this._functionModule = new Dictionary<Dictionary<SyntaxTree.FileBlockFunction>>();
        this._currentMoudles = [];

        Intrinsics.forEachIntrinsicFunction((info) => {
            this.addIntrinsicFunction(info.name, {
                type: "function",
                isMark: false,
                isShader: false,
                name: info.internalName,
                returnType: info.returnType,
                arguments: info.argTypes.map((x, idx) => { return { name: "a" + idx, type: x } }),
                statements: null
            });
        });
    }

    public addIntrinsicFunction(name: string, func: SyntaxTree.FileBlockFunction) {
        if (!this._functions.has(name)) {
            let resolver = new FunctionOverloadResolver(name);
            this._functions.set(name, resolver);
            resolver.addFunction(func);
        } else {
            let resolver = this._functions.get(name);
            resolver.addFunction(func);
        }
    }

    public addFunction(name: string, func: SyntaxTree.FileBlockFunction) {
        if (!this._functions.has(name)) {
            let resolver = new FunctionOverloadResolver(name);
            this._functions.set(name, resolver);
            resolver.addFunction(func);
        } else {
            let resolver = this._functions.get(name);
            resolver.addFunction(func);
        }
    }


    public importFunction(module: Dictionary<SyntaxTree.FileBlockFunction>, name: string) {
        this.addFunction(name, module.get(name));
        this._functionModule.set(name, module);
    }

    public getFunction(name: string): FunctionOverloadResolver {
        for (let i = this._currentMoudles.length - 1; i >= 0; i--) {
            let cm = this._currentMoudles[i];
            if (cm && cm.has(name)) {
                let resolver = new FunctionOverloadResolver(name);
                resolver.addFunction(cm.get(name));
                return resolver;
            }
        }
        if (this._functions.has(name)) {
            return this._functions.get(name);
        } else {
            return null;
        }
    }

    public enterFunctionImplementation(name: string) {
        this._currentMoudles.push(this._functionModule.get(name));
    }

    public leaveFunctionImplementation(name: string) {
        this._currentMoudles.pop();
    }
}

export class FunctionOverloadResolver {
    private _name: string;
    private _functions: SyntaxTree.FileBlockFunction[];

    constructor(name: string) {
        this._name = name;
        this._functions = [];
    }

    public addFunction(func: SyntaxTree.FileBlockFunction) {
        this._functions.push(func);
    }

    public resolveArguments(args: Specification.Expression[], kwargs: { [name: string]: Specification.Expression }): [SyntaxTree.FileBlockFunction, Specification.Expression[]] {
        let result: [SyntaxTree.FileBlockFunction, Specification.Expression[]] = null;
        let resultRank: number = null;
        for (let func of this._functions) {
            let funcRank = 0;
            let matched = true;
            let argExpressions: Specification.Expression[] = [];
            let argIndexUsed: string[] = [];
            let kwargsUsed: string[] = [];
            for (let argIndex in func.arguments) {
                let arg = func.arguments[argIndex];
                let argExpression = args[argIndex] || kwargs[arg.name];
                if (args[argIndex] != null) {
                    argIndexUsed.push(argIndex);
                } else if (kwargs[arg.name]) {
                    kwargsUsed.push(arg.name);
                }
                if (argExpression != null) {
                    if (argExpression.valueType != arg.type) {
                        let [conversion, rank] = typeConversionAttempt(argExpression, arg.type);
                        if (conversion) {
                            argExpressions.push(conversion);
                            funcRank += rank;
                        } else {
                            matched = false;
                            break;
                        }
                    } else {
                        argExpressions.push(argExpression);
                    }
                } else {
                    if (arg.default === null || arg.default === undefined) {
                        matched = false;
                        break;
                    } else {
                        argExpressions.push({
                            type: "constant",
                            value: arg.default,
                            valueType: arg.type
                        } as Specification.ExpressionConstant)
                    }
                }
            }
            let isAllUsed = true;
            for (let argIndex in args) {
                if (argIndexUsed.indexOf(argIndex) < 0) isAllUsed = false;
            }
            for (let argName in kwargs) {
                if (kwargsUsed.indexOf(argName) < 0) isAllUsed = false;
            }
            if (matched && isAllUsed) {
                if (!result || funcRank < resultRank) {
                    result = [func, argExpressions];
                    resultRank = funcRank;
                }
            }
        }
        if (result) {
            return result;
        } else {
            let argspec = args.map((x) => x.valueType).join(", ");
            throw new CompileError(`unable to resolve function '${this._name}' with arguments (${argspec})`)
        }
    }
}

export function typeConversionAttempt(src: Specification.Expression, dest: string): [Specification.Expression, number] {
    let info = Intrinsics.getTypeConversion(src.valueType, dest);
    if (info) {
        let rank = info.rank;
        return [{
            type: "function",
            valueType: dest,
            arguments: [src],
            functionName: info.internalName,
        } as Specification.ExpressionFunction, rank]
    } else {
        return [null, null];
    }
}