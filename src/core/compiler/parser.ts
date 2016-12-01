import { Specification } from "../spec/spec";
import { ParseError } from "../exceptions";

// Typescript definition of the parsed AST.
export module SyntaxTree {

    export type Value = number | number[];

    export interface FunctionArgument {
        type: string;
        name: string;
        default?: Value;
    }

    export type ExpressionType =
        "value" |
        "variable" |
        "field" |
        "function" |
        "operator"
    ;

    export interface Expression {
        type: ExpressionType;
    }

    export interface ExpressionFunctionArguments {
        args: Expression[];
        kwargs: { [key: string]: Expression };
    }

    export interface ExpressionFunction extends Expression {
        type: "function";
        name: string;
        args: ExpressionFunctionArguments;
    }

    export interface ExpressionVariable extends Expression {
        type: "variable";
        name: string;
    }

    export interface ExpressionValue extends Expression {
        type: "value";
        value: Value;
        valueType: string;
    }

    export interface ExpressionField extends Expression {
        type: "field";
        value: Expression;
        fieldName: string;
    }

    export type StatementType =
        "expression" |
        "assign" |
        "declare" |
        "return" |
        "emit" |
        "for" |
        "if" |
        "statements"
    ;

    export interface Statement {
        type: StatementType;
    }

    // function statement.
    export interface StatementExpression extends Statement {
        type: "expression";
        expression: Expression;
    }
    // emit statement.
    export interface StatementEmit extends Statement {
        type: "emit";
        vertices: { [name: string]: Expression }[];
    }
    // return statement.
    export interface StatementReturn extends Statement {
        type: "return";
        value: Expression;
    }
    // declare statement.
    export interface StatementDeclare extends Statement {
        type: "declare";
        variableType: string;
        variableName: string;
        initial?: Expression;
    }
    // assign statement.
    export interface StatementAssign extends Statement {
        type: "assign";
        variableName: string;
        expression: Expression;
    }
    // block statements.
    export interface StatementStatements extends Statement {
        type: "statements";
        statements: Statement[];
    }

    export interface StatementForLoop extends Statement {
        type: "for";
        variableName: string;
        start: number;
        end: number;
        statement: Statement;
    }

    export interface StatementIfStatement extends Statement {
        type: "if";
        conditions: [ { condition: Expression, statement: Statement } ];
        else: Statement;
    }

    export type FileBlockType = "function" | "global" | "import";

    export interface FileBlock {
        type: FileBlockType;
    }

    export interface FileBlockFunction extends FileBlock {
        type: "function";
        isMark: boolean;
        name: string;
        returnType: string;
        arguments: FunctionArgument[];
        statements: Statement[];
    }

    export interface FileBlockGlobal extends FileBlock {
        type: "global";
        name: string;
        valueType: string;
        default?: Value;
    }

    export interface FileBlockImport extends FileBlock {
        type: "import";
        moduleName: string;
        functionNames: string[];
    }

    export interface File {
        blocks: FileBlock[];
    }
}

// Import the pegjs generated parser.
declare function require(name: string): any;
interface PEGJSCompiled {
    parse(content: string, options: { [ name: string ]: string }): SyntaxTree.File | SyntaxTree.Expression;
}
let parser_pegjs: PEGJSCompiled = require("./parser_pegjs");

function stripComments(content: string): string {
    content = content.replace(
        /\/\/[^\n]*\n/g, "\n"
    );
    content = content.replace(
        /\/\/[^\n]*$/g, ""
    );
    return content;
}

export function parseFile(content: string): SyntaxTree.File {
    content = stripComments(content);
    let result: SyntaxTree.File = null;
    try {
        result = parser_pegjs.parse(content, { startRule: "FileEntry" }) as SyntaxTree.File;
    } catch(e) {
        if(e.location) {
            throw new ParseError(e.message, e.location.start, e.location.end);
        } else {
            throw new ParseError(e.message);
        }
    }
    return result;
}

export function parseExpression(content: string): SyntaxTree.Expression {
    let result: SyntaxTree.Expression = null;
    try {
        result = parser_pegjs.parse(content, { startRule: "ExpressionEntry" }) as SyntaxTree.Expression;
    } catch(e) {
        if(e.location) {
            throw new ParseError(e.message, e.location.start, e.location.end);
        } else {
            throw new ParseError(e.message);
        }
    }
    return result;
}