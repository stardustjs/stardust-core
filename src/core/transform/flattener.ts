// Flattener: Resolve emit statements into individual render calls.

import { Specification } from "../spec";
import * as SC from "../specConstruct";
import { attemptName } from "../utils";

export interface FlattenedEmits {
    specification: Specification.Shape;
    count: number;
    indexVariable: string;
}

// Old recursive if statements - not as fast as the individual if statement version.
// // For now, assume there is no conditional emits.
// export function  FlattenEmits(shape: Specification.Shape): FlattenedEmits {
//     let vertexIndexName = attemptName("s3idx", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
//     let newShape: Specification.Shape = {
//         input: {},
//         output: shape.output,
//         variables: shape.variables,
//         statements: []
//     }
//     for(let i in shape.input) {
//         if(shape.input.hasOwnProperty(i)) {
//             newShape.input[i] = shape.input[i];
//         }
//     }
//     newShape.input[vertexIndexName] = {
//         type: "float",
//         default: 0
//     };

//     let emitStatementIndices: number[] = [];
//     for(let i = 0; i < shape.statements.length; i++) {
//         if(shape.statements[i].type == "emit") {
//             emitStatementIndices.push(i);
//         }
//     }

//     let compileEmitStatements = (indexStart: number, indexEnd: number): Specification.Statement[] => {
//         if(indexStart == indexEnd) {
//             let result: Specification.Statement[] = [];
//             let i = emitStatementIndices[indexStart];
//             for(let j = 0; j <= i; j++) {
//                 let s = shape.statements[j];
//                 if(s.type != "emit" || j == i) {
//                     result.push(s);
//                 }
//             }
//             return result;
//         } else {
//             let middle = Math.floor((indexStart + indexEnd) / 2);

//             let condition: Specification.StatementCondition = {
//                 type: "condition",
//                 condition: {
//                     type: "function",
//                     valueType: "bool",
//                     functionName: "@@<:float,float:bool",
//                     arguments: [
//                         { type: "variable", variableName: vertexIndexName, valueType: "float" } as Specification.ExpressionVariable,
//                         { type: "constant", value: middle + 0.5, valueType: "float" } as Specification.ExpressionConstant
//                     ]
//                 } as Specification.ExpressionFunction,
//                 trueStatements: compileEmitStatements(indexStart, middle),
//                 falseStatements: compileEmitStatements(middle + 1, indexEnd)
//             }
//             return [ condition ];
//         }
//     };

//     newShape.statements = compileEmitStatements(0, emitStatementIndices.length - 1);

//     return {
//         specification: newShape,
//         count: emitStatementIndices.length,
//         indexVariable: vertexIndexName
//     };
// }

// For now, assume there is no conditional emits.
export function FlattenEmits(shape: Specification.Shape): FlattenedEmits {
    let vertexIndexName = attemptName("s3idx", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
    let emitIndexName = attemptName("s3emitidx", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
    let newShape: Specification.Shape = {
        input: {},
        output: shape.output,
        variables: shape.variables,
        statements: []
    }
    for(let i in shape.input) {
        if(shape.input.hasOwnProperty(i)) {
            newShape.input[i] = shape.input[i];
        }
    }
    newShape.input[vertexIndexName] = {
        type: "float",
        default: 0
    };
    newShape.variables[emitIndexName] = "float";

    newShape.statements.push({
        type: "assign",
        variableName: emitIndexName,
        expression: SC.constant(-0.5, "float")
    } as Specification.StatementAssign);

    let generateStatements = (statements: Specification.Statement[]): [ Specification.Statement[], number ] => {
        let result: Specification.Statement[] = [];
        let maxNumberEmits = 0;
        for(let i = 0; i < statements.length; i++) {
            switch(statements[i].type) {
                case "emit": {
                    result.push({
                        type: "condition",
                        condition: SC.greaterThan(
                            SC.variable(vertexIndexName, "float"),
                            SC.variable(emitIndexName, "float"),
                        ),
                        trueStatements: [ statements[i] ],
                        falseStatements: []
                    } as Specification.StatementCondition);
                    result.push({
                        type: "assign",
                        variableName: emitIndexName,
                        expression: SC.add(SC.variable(emitIndexName, "float"), SC.constant(1, "float"))
                    } as Specification.StatementAssign);
                    maxNumberEmits += 1;
                } break;
                case "for": {
                    let forStatement = statements[i] as Specification.StatementForLoop;
                    let [ generatedStatements, maxNumber ] = generateStatements(forStatement.statements);
                    result.push({
                        type: "for",
                        variableName: forStatement.variableName,
                        rangeMin: forStatement.rangeMin,
                        rangeMax: forStatement.rangeMax,
                        statements: generatedStatements
                    } as Specification.StatementForLoop);
                    maxNumberEmits += (forStatement.rangeMax - forStatement.rangeMin + 1) * maxNumber;
                } break;
                case "condition": {
                    let condStatement = statements[i] as Specification.StatementCondition;
                    let [ gTrueStatements, gTrueStatementsMax ] = generateStatements(condStatement.trueStatements);
                    let [ gFalseStatements, gFalseStatementsMax ] = generateStatements(condStatement.falseStatements);
                    result.push({
                        type: "condition",
                        condition: condStatement.condition,
                        trueStatements: gTrueStatements,
                        falseStatements: gFalseStatements
                    } as Specification.StatementCondition);
                    maxNumberEmits = Math.max(gTrueStatementsMax, gFalseStatementsMax);
                } break;
                default: {
                    result.push(statements[i]);
                } break;
            }
        }
        return [ result, maxNumberEmits ];
    };

    let [ generatedStatements, maxNumberEmits ] = generateStatements(shape.statements);
    newShape.statements = newShape.statements.concat(generatedStatements);

    return {
        specification: newShape,
        count: maxNumberEmits,
        indexVariable: vertexIndexName
    };
}