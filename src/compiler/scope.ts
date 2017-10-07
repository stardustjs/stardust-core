import { Dictionary, attemptName, CompileError } from "../common";

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
        if (this._variables.has(name) || (this._argMap != null && this._argMap.has(name))) {
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
        if (this._variables.has(name)) {
            return this._variables.get(name);
        } else if (this._argMap != null && this._argMap.has(name)) {
            return this._parentScope.getVariable(this._argMap.get(name));
        } else if (this._parentScope) {
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
        if (scope == "global") {
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
