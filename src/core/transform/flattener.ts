// Flattener: Resolve emit statements into individual render calls.

import { Specification } from "../spec/spec";
import * as SC from "../spec/construct";
import { attemptName } from "../utils/utils";

export interface FlattenedEmits {
    specification: Specification.Mark;
    count: number;
    indexVariable: string;
}

// For now, assume there is no conditional emits.
export function flattenEmits(mark: Specification.Mark): FlattenedEmits {
    let vertexIndexNameFloat = attemptName("s3idx", (c) => !mark.variables.hasOwnProperty(c) && !mark.input.hasOwnProperty(c));
    let vertexIndexName = attemptName("s3idx_i", (c) => !mark.variables.hasOwnProperty(c) && !mark.input.hasOwnProperty(c));
    let emitIndexName = attemptName("s3emitidx", (c) => !mark.variables.hasOwnProperty(c) && !mark.input.hasOwnProperty(c));
    let newMark: Specification.Mark = {
        input: {},
        output: mark.output,
        variables: mark.variables,
        statements: [],
        repeatBegin: mark.repeatBegin,
        repeatEnd: mark.repeatEnd
    }
    for(let i in mark.input) {
        if(mark.input.hasOwnProperty(i)) {
            newMark.input[i] = mark.input[i];
        }
    }
    newMark.input[vertexIndexNameFloat] = {
        type: "float", // this must be float, because WebGL doesn't have integer attributes.
        default: 0
    };
    newMark.variables[vertexIndexName] = "int";
    newMark.variables[emitIndexName] = "int";

    newMark.statements.push({
        type: "assign",
        variableName: vertexIndexName,
        expression: SC.cast(SC.variable(vertexIndexNameFloat, "float"), "int")
    } as Specification.StatementAssign);

    newMark.statements.push({
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

    let [ generatedStatements, maxNumberEmits ] = generateStatements(mark.statements);
    newMark.statements = newMark.statements.concat(generatedStatements);

    return {
        specification: newMark,
        count: maxNumberEmits,
        indexVariable: vertexIndexNameFloat
    };
}