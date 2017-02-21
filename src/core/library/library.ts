import { SyntaxTree, parseFile } from "../compiler/parser";
import { Dictionary } from "../utils/utils";

let modules = new Dictionary<Dictionary<SyntaxTree.FileBlockFunction>>();

function importPrimitiveCode(name: string, code: string) {
    let thisModule: Dictionary<SyntaxTree.FileBlockFunction> = null;
    if(modules.has(name)) {
        thisModule = modules.get(name);
    } else {
        thisModule = new Dictionary<SyntaxTree.FileBlockFunction>();
        modules.set(name, thisModule);
    }
    let tree = parseFile(code);
    for(let f of tree.blocks) {
        if(f.type == "function") {
            let fn = f as SyntaxTree.FileBlockFunction;
            thisModule.set(fn.name, fn);
        }
    }
}

import * as P2D from "./primitives2d";
importPrimitiveCode("P2D", P2D.primitives);

import * as P3D from "./primitives3d";
importPrimitiveCode("P3D", P3D.primitives);

export function getModule(name: string): Dictionary<SyntaxTree.FileBlockFunction> {
    return modules.get(name);
}

export function getModuleFunction(name: string, functionName: string): SyntaxTree.FileBlockFunction {
    return modules.get(name).get(functionName);
}

export function forEachModuleFunction(name: string, callback: (fn: SyntaxTree.FileBlockFunction, name: string) => any) {
    return modules.get(name).forEach(callback);
}