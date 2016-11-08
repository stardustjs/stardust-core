import { Specification } from "../spec";
import { CompileError } from "../exceptions";
import { SyntaxTree, parseString } from "./parser";
import { Dictionary, attemptName } from "../utils";
import * as Intrinsics from "../intrinsics";
import * as Library from "../library/library";

export interface ScopeVariableInfo {
    name: string;
    type: string;
    translatedName: string;
}

export class ScopeVariables {
    private _owner: ScopeStack;
    private _variables: Dictionary<ScopeVariableInfo>;
    private _parentScope: ScopeVariables;
    private _argMap: Dictionary<string>;

    constructor(owner: ScopeStack, parentScope: ScopeVariables = null, argMap: Dictionary<string> = null) {
        this._owner = owner;
        this._variables = new Dictionary<ScopeVariableInfo>();
        this._parentScope = parentScope || null;
        this._argMap = argMap;
    }

    // Add a variable with name and type, shadows the ones from previous scopes.
    public addVariable(name: string, type: string) {
        if(this._variables.has(name) || (this._argMap != null && this._argMap.has(name))) {
            // If the variable is defined in the current scope, throw exception.
            throw new CompileError(`${name} is already declared.`);
        } else {
            // Create new translated name and set variable info.
            let translatedName = this._owner.newTranslatedName(name, type);
            this._variables.set(name, {
                name: name,
                type: type,
                translatedName: translatedName
            });
        }
    }

    // Create a new variable of type.
    public nextVariable(type: string): ScopeVariableInfo {
        let name = attemptName("tmp", (name) => !this._variables.has(name) && !(this._argMap != null && this._argMap.has(name)));
        this.addVariable(name, type);
        return this.getVariable(name);
    }

    public getVariable(name: string): ScopeVariableInfo {
        if(this._variables.has(name)) {
            return this._variables.get(name);
        } else if(this._argMap != null && this._argMap.has(name)) {
            return this._parentScope.getVariable(this._argMap.get(name));
        } else if(this._parentScope) {
            return this._parentScope.getVariable(name);
        } else {
            throw new CompileError(`${name} is undefined.`);
        }
    }

    public get parentScope(): ScopeVariables {
        return this._parentScope;
    }
}

export class ScopeStack {
    private _currentScope: ScopeVariables;
    private _globalScope: ScopeVariables;
    private _translatedNames: Dictionary<ScopeVariableInfo>;

    constructor() {
        this._translatedNames = new Dictionary<ScopeVariableInfo>();
        this._globalScope = new ScopeVariables(this);
        this._currentScope = this._globalScope;
    }

    // Reset scope to empty.
    public resetScope() {
        this._translatedNames = new Dictionary<ScopeVariableInfo>();
        this._globalScope = new ScopeVariables(this);
        this._currentScope = this._globalScope;
    }

    // Push a scope.
    public pushScope(argMap: Dictionary<string> = null) {
        this._currentScope = new ScopeVariables(this, this._currentScope, argMap);
    }

    // Pop a scope.
    public popScope() {
        this._currentScope = this._currentScope.parentScope;
    }

    // Create a new translated variable.
    public newTranslatedName(name: string, type: string): string {
        let candidate = attemptName(name, (c) => !this._translatedNames.has(c));
        this._translatedNames.set(candidate, {
            name: name,
            type: type,
            translatedName: candidate
        });
        return candidate;
    }

    // Iterate through translated variables.
    public forEach(callback: (name: string, type: string) => void) {
        this._translatedNames.forEach((o) => {
            callback(o.translatedName, o.type);
        })
    }

    // Create a new variable in current scope, return its translated name.
    public nextVariableTranslatedName(type: string): string {
        return this.nextVariable(type).translatedName;
    }

    // Create a new variable in current scope, return its name.
    public nextVariableName(type: string): string {
        return this.nextVariable(type).name;
    }

    // Create a new variable in current scope, return its info.
    public nextVariable(type: string): ScopeVariableInfo {
        return this._currentScope.nextVariable(type);
    }

    // Add a new variable.
    public addVariable(name: string, type: string, scope: "local" | "global") {
        if(scope == "global") {
            this._globalScope.addVariable(name, type);
        } else {
            this._currentScope.addVariable(name, type);
        }
    }

    // Translate variable from current scope to its translated name.
    public translateVariableName(name: string): string {
        return this.getVariable(name).translatedName;
    }

    // Get variable info.
    public getVariable(name: string): ScopeVariableInfo {
        return this._currentScope.getVariable(name);
    }
}


function typeConversionAttempt(src: Specification.Expression, dest: string): [ Specification.Expression, number ] {
    let info = Intrinsics.getTypeConversion(src.valueType, dest);
    if(info) {
        let rank = info.rank;
        return [{
            type: "function",
            valueType: dest,
            arguments: [ src ],
            functionName: info.internalName,
        } as Specification.ExpressionFunction, rank]
    } else {
        return [ null, null ];
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

    public resolveArguments(args: Specification.Expression[], kwargs: { [ name: string ]: Specification.Expression }): [ SyntaxTree.FileBlockFunction, Specification.Expression[] ] {
        let result: [ SyntaxTree.FileBlockFunction, Specification.Expression[] ] = null;
        let resultRank: number = null;
        for(let func of this._functions) {
            let funcRank = 0;
            let matched = true;
            let argExpressions: Specification.Expression[] = [];
            let argIndexUsed: string[] = [];
            let kwargsUsed: string[] = [];
            for(let argIndex in func.arguments) {
                let arg = func.arguments[argIndex];
                let argExpression = args[argIndex] || kwargs[arg.name];
                if(args[argIndex] != null) {
                    argIndexUsed.push(argIndex);
                } else if(kwargs[arg.name]) {
                    kwargsUsed.push(arg.name);
                }
                if(argExpression != null) {
                    if(argExpression.valueType != arg.type) {
                        let [ conversion, rank ] = typeConversionAttempt(argExpression, arg.type);
                        if(conversion) {
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
                    if(arg.default === null || arg.default === undefined) {
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
            for(let argIndex in args) {
                if(argIndexUsed.indexOf(argIndex) < 0) isAllUsed = false;
            }
            for(let argName in kwargs) {
                if(kwargsUsed.indexOf(argName) < 0) isAllUsed = false;
            }
            if(matched && isAllUsed) {
                if(!result || funcRank < resultRank) {
                    result = [ func, argExpressions ];
                    resultRank = funcRank;
                }
            }
        }
        if(result) {
            return result;
        } else {
            let argspec = args.map((x) => x.valueType).join(", ");
            throw new CompileError(`unable to resolve function '${this._name}' with arguments (${argspec})`)
        }
    }
}

export class Compiler {
    private _scope: ScopeStack;
    private _functions: Dictionary<FunctionOverloadResolver>;
    private _intrinsicFunctions: Dictionary<FunctionOverloadResolver>;
    private _constants: Dictionary<Intrinsics.ConstantInfo>;
    private _statements: Specification.Statement[];
    private _lastIndex: number;
    private _fieldTypeRegistry: { [ name: string]: string };

    constructor() {
        this._scope = new ScopeStack();
        this._functions = new Dictionary<FunctionOverloadResolver>();
        this._intrinsicFunctions = new Dictionary<FunctionOverloadResolver>();
        this._constants = new Dictionary<Intrinsics.ConstantInfo>();
        this._statements = [];
        this._lastIndex = 1;

        this.prepareIntrinsicFunctions();
        this.prepareFieldTypeRegistry();
        this.prepareConstants();
    }

    public prepareFieldTypeRegistry() {
        this._fieldTypeRegistry = {};
        let r = this._fieldTypeRegistry;
        for(let f of [ "x", "y" ]) { r[`Vector2.${f}`] = "float"; }
        for(let f of [ "x", "y", "z", "r", "g", "b" ]) { r[`Vector3.${f}`] = "float"; }
        for(let f of [ "x", "y", "z", "w", "r", "g", "b", "a" ]) { r[`Vector4.${f}`] = "float"; }
        for(let f of [ "r", "g", "b", "a" ]) { r[`Color.${f}`] = "float"; }
    }

    public prepareConstants() {
        Intrinsics.forEachConstant((info) => {
            this._constants.set(info.name, info);
        });
    }

    public addFunction(name: string, func: SyntaxTree.FileBlockFunction) {
        if(!this._functions.has(name)) {
            let resolver = new FunctionOverloadResolver(name);
            this._functions.set(name, resolver);
            resolver.addFunction(func);
        } else {
            let resolver = this._functions.get(name);
            resolver.addFunction(func);
        }
    }

    public addIntrinsicFunction(name: string, func: SyntaxTree.FileBlockFunction) {
        if(!this._intrinsicFunctions.has(name)) {
            let resolver = new FunctionOverloadResolver(name);
            this._intrinsicFunctions.set(name, resolver);
            resolver.addFunction(func);
        } else {
            let resolver = this._intrinsicFunctions.get(name);
            resolver.addFunction(func);
        }
    }

    public resolveFunction(name: string, args: Specification.Expression[], kwargs: { [ name: string ]: Specification.Expression }): [ SyntaxTree.FileBlockFunction, Specification.Expression[] ] {
        let resolver = this._functions.get(name) || this._intrinsicFunctions.get(name);
        if(resolver) {
            return resolver.resolveArguments(args, kwargs);
        } else {
            throw new CompileError(`function '${name} is undefined.`);
        }
    }

    public prepareIntrinsicFunctions() {
        Intrinsics.forEachIntrinsicFunction((info) => {
            this.addIntrinsicFunction(info.name, {
                type: "function",
                isShape: false,
                name: info.internalName,
                returnType: info.returnType,
                arguments: info.argTypes.map((x, idx) => { return { name: "a" + idx, type: x }}),
                statements: null
            });
        });
    }

    public loadFile(file: SyntaxTree.File) {
        for(let block of file.blocks) {
            if(block.type == "function") {
                let blockFunction = block as SyntaxTree.FileBlockFunction;
                this.addFunction(blockFunction.name, blockFunction);
            }
            if(block.type == "import") {
                let blockImport = block as SyntaxTree.FileBlockImport;
                if(blockImport.functionNames != null) {
                    blockImport.functionNames.forEach((name) => {
                        let f = Library.getModuleFunction(blockImport.moduleName, name);
                        this.addFunction(name, f);
                    })
                } else {
                    Library.forEachModuleFunction(blockImport.moduleName, (f, name) => {
                        this.addFunction(name, f);
                    });
                }
            }
        }
    }

    public compileFunctionToShape(globals: SyntaxTree.FileBlockGlobal[], block: SyntaxTree.FileBlockFunction): Specification.Shape {
        // Re-init state.
        this._scope.resetScope();
        this._lastIndex = 1;

        let shapeInput: { [name: string]: Specification.Input } = {};
        let shapeOutput: { [name: string]: Specification.Output } = {};
        let shapeVariables: { [name: string]: string } = {};

        // Setup input parameters.
        for(let global of globals) {
            this._scope.addVariable(global.name, global.valueType, "global");
            shapeInput[global.name] = {
                type: global.valueType,
                default: global.default
            }
        }
        for(let arg of block.arguments) {
            this._scope.addVariable(arg.name, arg.type, "local");
            shapeInput[arg.name] = {
                type: arg.type,
                default: arg.default
            }
        }

        // Flatten statements.
        this.compileStatements({
            type: "statements",
            statements: block.statements
        } as SyntaxTree.StatementStatements);

        // Figure out variables.
        this._scope.forEach((name: string, type: string) => {
            if(!shapeInput[name]) {
                shapeVariables[name] = type;
            }
        });

        // Figure out outputs.
        let processStatementsForOutputs = (statements: Specification.Statement[]) => {
            statements.forEach((x) => {
                if(x.type == "emit") {
                    let sEmit = x as Specification.StatementEmit;
                    for(let attr in sEmit.attributes) {
                        if(shapeOutput.hasOwnProperty(attr)) {
                            if(shapeOutput[attr].type != sEmit.attributes[attr].valueType) {
                                throw new CompileError(`output variable '${attr} has conflicting types.`);
                            }
                        } else {
                            shapeOutput[attr] = { type: sEmit.attributes[attr].valueType };
                        }
                    }
                }
                if(x.type == "condition") {
                    let sCondition = x as Specification.StatementCondition;
                    processStatementsForOutputs(sCondition.trueStatements);
                    processStatementsForOutputs(sCondition.falseStatements);
                }
                if(x.type == "for") {
                    let sForLoop = x as Specification.StatementForLoop;
                    processStatementsForOutputs(sForLoop.statements);
                }
            })
        }
        processStatementsForOutputs(this._statements);

        return {
            input: shapeInput,
            output: shapeOutput,
            variables: shapeVariables,
            statements: this._statements
        }
    }

    public addStatement(statement: Specification.Statement) {
        this._statements.push(statement);
    }

    public addStatements(statements: Specification.Statement[]) {
        this._statements = this._statements.concat(statements);
    }

    public captureStatements(callback: () => void): Specification.Statement[] {
        let currentStatements = this._statements;
        this._statements = [];
        callback();
        let result = this._statements;
        this._statements = currentStatements;
        return result;
    }

    public compileExpression(expression: SyntaxTree.Expression, keepResult: boolean = false): Specification.Expression {
        switch(expression.type) {
            case "value": {
                let expr = expression as SyntaxTree.ExpressionValue;
                return {
                    type: "constant",
                    value: expr.value,
                    valueType: expr.valueType
                } as Specification.ExpressionConstant;
            }
            case "variable": {
                let expr = expression as SyntaxTree.ExpressionVariable;
                if(this._constants.has(expr.name)) {
                    let cinfo = this._constants.get(expr.name);
                    return {
                        type: "constant",
                        value: cinfo.value,
                        valueType: cinfo.type
                    } as Specification.ExpressionConstant;
                } else {
                    return {
                        type: "variable",
                        variableName: this._scope.translateVariableName(expr.name),
                        valueType: this._scope.getVariable(expr.name).type
                    } as Specification.ExpressionVariable;
                }
            }
            case "field": {
                let expr = expression as SyntaxTree.ExpressionField;
                let valueExpr = this.compileExpression(expr.value, true);
                return {
                    type: "field",
                    fieldName: expr.fieldName,
                    value: valueExpr,
                    valueType: this._fieldTypeRegistry[valueExpr.valueType + "." + expr.fieldName]
                } as Specification.ExpressionField;
            }
            case "function": {
                let expr = expression as SyntaxTree.ExpressionFunction;

                let args: Specification.Expression[] = [];
                let kwargs: { [ name: string ]: Specification.Expression } = {};

                for(let arg of expr.args.args) {
                    args.push(this.compileExpression(arg, true));
                }
                for(let key in expr.args.kwargs) {
                    let e = expr.args.kwargs[key];
                    kwargs[key] = this.compileExpression(expr.args.kwargs[key], true);
                }

                let [ func, argExpressions ] = this.resolveFunction(expr.name, args, kwargs);

                let returnValueExpression: Specification.Expression = null;

                if(!func.statements) {
                    returnValueExpression = {
                        type: "function",
                        functionName: func.name,
                        arguments: argExpressions,
                        valueType: func.returnType
                    } as Specification.ExpressionFunction;
                } else {
                    let argMap = new Dictionary<string>();

                    for(let argIndex in func.arguments) {
                        let arg = func.arguments[argIndex];
                        let mapped = this._scope.nextVariableName(arg.type);
                        argMap.set(arg.name, mapped);
                        this.addStatement({
                            type: "assign",
                            variableName: this._scope.translateVariableName(mapped),
                            expression: argExpressions[argIndex]
                        } as Specification.StatementAssign)
                    }

                    this._scope.pushScope(argMap);
                    for(let statement of func.statements) {
                        if(statement.type == "return") {
                            let statement_return = statement as SyntaxTree.StatementReturn;
                            returnValueExpression = this.compileExpression(statement_return.value);
                            break;
                        } else {
                            this.compileStatement(statement);
                        }
                    }
                    this._scope.popScope();
                }
                return returnValueExpression;
            }
        }
        return null;
    }

    public compileStatements(statements: SyntaxTree.StatementStatements): void {
        this._scope.pushScope();
        for(let s of statements.statements) {
            this.compileStatement(s);
        }
        this._scope.popScope();
    }

    public compileStatement(statement: SyntaxTree.Statement): void {
        switch(statement.type) {
            case "declare": {
                let s = statement as SyntaxTree.StatementDeclare;
                if(s.initial) {
                    let ve = this.compileExpression(s.initial, true);
                    let variableType = s.variableType;
                    if(variableType == "auto") variableType = ve.valueType;
                    this._scope.addVariable(s.variableName, variableType, "local");
                    if(ve.valueType != variableType) {
                        let veType = ve.valueType;
                        ve = typeConversionAttempt(ve, this._scope.getVariable(s.variableName).type)[0];
                        if(ve === null) {
                            throw new CompileError(`cannot convert type '${veType}' to '${variableType}'.`);
                        }
                    }
                    this.addStatement({
                        type: "assign",
                        variableName: this._scope.translateVariableName(s.variableName),
                        expression: ve
                    } as Specification.StatementAssign);
                } else {
                    this._scope.addVariable(s.variableName, s.variableType, "local");
                }
            } break;
            case "expression": {
                let s = statement as SyntaxTree.StatementExpression;
                this.compileExpression(s.expression, false);
            } break;
            case "assign": {
                let s = statement as SyntaxTree.StatementAssign;
                let ve = this.compileExpression(s.expression, true);
                let targetType = this._scope.getVariable(s.variableName).type;
                if(ve.valueType != targetType) {
                    let veType = ve.valueType;
                    ve = typeConversionAttempt(ve, this._scope.getVariable(s.variableName).type)[0];
                    if(ve === null) {
                        throw new CompileError(`cannot convert type '${veType} to '${targetType}'.`);
                    }
                }
                this.addStatement({
                    type: "assign",
                    variableName: this._scope.translateVariableName(s.variableName),
                    expression: ve
                } as Specification.StatementAssign);
            } break;
            case "emit": {
                let s = statement as SyntaxTree.StatementEmit;
                s.vertices.forEach((v) => {
                    let attrs: { [name: string]: Specification.Expression } = {};
                    for(let argName in v) {
                        let expr = v[argName];
                        attrs[argName] = this.compileExpression(expr, true);
                    }
                    this.addStatement({
                        type: "emit",
                        attributes: attrs
                    } as Specification.StatementEmit);
                })

            } break;
            case "statements": {
                let s = statement as SyntaxTree.StatementStatements;
                this.compileStatements(s);
            } break;
            case "for": {
                let s = statement as SyntaxTree.StatementForLoop;
                this._scope.pushScope();
                // Declare the loop variable
                this._scope.addVariable(s.variableName, "int", "local");
                let loopVariable = this._scope.translateVariableName(s.variableName);
                // Compile for statements
                let forStatement = {
                    type: "for",
                    variableName: loopVariable,
                    rangeMin: s.start,
                    rangeMax: s.end,
                    statements: this.captureStatements(() => this.compileStatement(s.statement))
                } as Specification.StatementForLoop;
                this.addStatement(forStatement);
                this._scope.popScope();
            } break;
            case "if": {
                let s = statement as SyntaxTree.StatementIfStatement;
                // Function to compile the i-th condition in the if-elseif-else syntax.
                let compileIthCondition = (i: number) => {
                    if(i < s.conditions.length) {
                        let statements: Specification.Statement[] = [];
                        this._scope.pushScope();
                        let ve = this.compileExpression(s.conditions[i].condition, true);
                        let cond: Specification.StatementCondition = {
                            type: "condition",
                            condition: ve,
                            trueStatements: this.captureStatements(() => this.compileStatement(s.conditions[i].statement)),
                            falseStatements: this.captureStatements(() => compileIthCondition(i + 1))
                        };
                        this.addStatement(cond);
                        this._scope.popScope();
                    } else {
                        if(s.else) {
                            this.compileStatement(s.else);
                        }
                    }
                }
                compileIthCondition(0);
            } break;
        }
    }
}

export function compileTree(file: SyntaxTree.File): Specification.ShapeSpecifications {
    let spec: Specification.ShapeSpecifications = {};
    let globals = file.blocks.filter((x) => x.type == "global") as SyntaxTree.FileBlockGlobal[];
    for(let block of file.blocks) {
        if(block.type == "function") {
            let blockFunction = block as SyntaxTree.FileBlockFunction;
            if(blockFunction.returnType == "shape") {
                let scope = new Compiler();
                scope.loadFile(file);
                let shape = scope.compileFunctionToShape(globals, blockFunction);
                spec[blockFunction.name] = shape;
            }
        }
    }
    return spec;
}

export function compileString(content: string): Specification.ShapeSpecifications {
    let file = parseString(content);
    return compileTree(file);
}