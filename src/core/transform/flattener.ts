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
    let vertexIndexNameFloat = attemptName("s3idx", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
    let vertexIndexName = attemptName("s3idx_i", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
    let emitIndexName = attemptName("s3emitidx", (c) => !shape.variables.hasOwnProperty(c) && !shape.input.hasOwnProperty(c));
    let newShape: Specification.Shape = {
        input: {},
        output: shape.output,
        variables: shape.variables,
        statements: [],
        repeatBegin: shape.repeatBegin,
        repeatEnd: shape.repeatEnd
    }
    for(let i in shape.input) {
        if(shape.input.hasOwnProperty(i)) {
            newShape.input[i] = shape.input[i];
        }
    }
    newShape.input[vertexIndexNameFloat] = {
        type: "float", // this must be float, because WebGL doesn't have integer attributes.
        default: 0
    };
    newShape.variables[vertexIndexName] = "int";
    newShape.variables[emitIndexName] = "int";

    newShape.statements.push({
        type: "assign",
        variableName: vertexIndexName,
        expression: SC.cast(SC.variable(vertexIndexNameFloat, "float"), "int")
    } as Specification.StatementAssign);

    newShape.statements.push({
        type: "assign",
        variableName: emitIndexName,
        expression: SC.constant(0, "int")
    } as Specification.StatementAssign);

    let generateStatements = (statements: Specification.Statement[]): [ Specification.Statement[], number ] => {
        let result: Specification.Statement[] = [];
        let maxNumberEmits = 0;
        for(let i = 0; i < statements.length; i++) {
            switch(statements[i].type) {
                case "emit": {
                    result.push({
                        type: "condition",
                        condition: SC.equals(
                            SC.variable(vertexIndexName, "int"),
                            SC.variable(emitIndexName, "int")
                        ),
                        trueStatements: [ statements[i] ],
                        falseStatements: []
                    } as Specification.StatementCondition);
                    result.push({
                        type: "assign",
                        variableName: emitIndexName,
                        expression: SC.add(SC.variable(emitIndexName, "int"), SC.constant(1, "int"))
                    } as Specification.StatementAssign);
                    maxNumberEmits += 1;
                } break;
                case "for": {
                    let forStatement = statements[i] as Specification.StatementForLoop;
                    let [ generatedStatements, maxNumber ] = generateStatements(forStatement.statements);
                    let mappingMode = true;
                    if(mappingMode) {
                        // Here we assume for loops only alter its internal variables, not anything outside, so each turn is independent.
                        let tStatements: Specification.Statement[] = [];
                        tStatements.push({
                            type: "assign",
                            variableName: forStatement.variableName,
                            expression: SC.add(
                                SC.div(SC.sub(SC.variable(vertexIndexName, "int"), SC.variable(emitIndexName, "int")), SC.constant(maxNumber, "int")),
                                SC.constant(forStatement.rangeMin, "int")
                            )
                        } as Specification.StatementAssign);
                        tStatements.push({
                            type: "assign",
                            variableName: emitIndexName,
                            expression: SC.add(
                                SC.variable(emitIndexName, "int"),
                                SC.mul(SC.constant(maxNumber, "int"), SC.sub(SC.variable(forStatement.variableName, "int"), SC.constant(forStatement.rangeMin, "int")))
                            )
                        } as Specification.StatementAssign);
                        tStatements = tStatements.concat(generatedStatements);
                        tStatements.push({
                            type: "assign",
                            variableName: emitIndexName,
                            expression: SC.add(
                                SC.variable(emitIndexName, "int"),
                                SC.mul(SC.constant(maxNumber, "int"), SC.sub(SC.constant(forStatement.rangeMax, "int"), SC.variable(forStatement.variableName, "int")))
                            )
                        } as Specification.StatementAssign);
                        result.push({
                            type: "condition",
                            condition: SC.op("&&", "bool",
                                SC.greaterThanOrEquals(
                                    SC.variable(vertexIndexName, "int"),
                                    SC.variable(emitIndexName, "int")
                                ),
                                SC.lessThan(
                                    SC.variable(vertexIndexName, "int"),
                                    SC.add(SC.variable(emitIndexName, "int"), SC.constant(maxNumber * (forStatement.rangeMax - forStatement.rangeMin + 1), "int"))
                                )
                            ),
                            trueStatements: tStatements,
                            falseStatements: [ {
                                type: "assign",
                                    variableName: emitIndexName,
                                    expression: SC.add(
                                        SC.variable(emitIndexName, "int"),
                                        SC.constant((forStatement.rangeMax - forStatement.rangeMin + 1) * maxNumber, "int")
                                    )
                                } as Specification.StatementAssign
                            ]
                        } as Specification.StatementCondition);
                    } else {
                        result.push({
                            type: "for",
                            variableName: forStatement.variableName,
                            rangeMin: forStatement.rangeMin,
                            rangeMax: forStatement.rangeMax,
                            statements: generatedStatements
                        } as Specification.StatementForLoop);
                    }
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
        indexVariable: vertexIndexNameFloat
    };
}