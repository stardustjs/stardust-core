{
    function flatten(vars) {
        if(vars instanceof Array) {
            var r = "";
            for(var i = 0; i < vars.length; i++)
                r += flatten(vars[i]);
            return r;
        } else return vars || "";
    }

    function resolveList(first, others, k) {
        if(others) {
            return [ first ].concat(others.map(function(d) { return d[k]; }));
        } else {
            return [ first ];
        }
    }

    function resolveExpressionBinaryOp(first, others) {
        var expr = first;
        others.forEach(function(d) {
          var op = d[1];
          var rhs = d[3];
          expr = makeOperatorFunction({ type: "operator", operator: op, args: [ expr, rhs ] });
        });
        return expr;
    }

    function resolveArgumentList(list) {
        var result = { args: [], kwargs: {} };
        list.forEach(function(d) {
            if(d.name !== undefined) {
                result.kwargs[d.name] = d.value;
            } else {
                result.args.push(d.value);
            }
        });
        return result;
    }

    function makeOperatorFunction(op) {
        return { type: "function", name: "@" + op.operator, args: { args: op.args, kwargs: {} } };
    }
}

//
// Mark Definition File
//
FileEntry
  = _ blocks:( FileBlock _ )*
    { return { blocks: blocks.map(function(d) { return d[0]; }) }; }

ExpressionEntry
  = _ expr:Expression _
    { return expr; }

FileBlock
  = Function / GlobalVariable / ImportStatement

Function
  = type:("function" / "mark" / "shader") __  name:Name _ "(" args:FunctionArgumentList ")" ret:(_ ":" _ Name)? _ "{" _ statements:Statements _ "}"
    {
      return {
        type: "function",
        isMark: flatten(type) == "mark",
        isShader: flatten(type) == "shader",
        name: name,
        returnType: ret ? ret[3] : "void",
        arguments: args,
        statements: statements
      };
    }

GlobalVariable
  = "let" __ name:Name type:(_ ":" _ Name)? value:(_ "=" _ Value)? _ ";"
    {
      return {
        type: "global",
        name: name,
        valueType: type ? type[3] : "auto",
        default: value ? value[3] : undefined
      };
    }

ImportStatement
  = "import" __ "*" __ "from" __ moduleName:Name _ ";"
    { return { type: "import", moduleName: moduleName, functionNames: null }; }
  / "import" _ "{" _ name:Name others:(_ "," _ Name)* _ "}" _ "from" __ moduleName:Name _ ";"
    { return { type: "import", moduleName: moduleName, functionNames: resolveList(name, others, 3) }; }

FunctionArgumentList
  = _ first:FunctionArgument others:( _ "," _ FunctionArgument )* _
    { return resolveList(first, others, 3); }
  / _
    { return []; }

FunctionArgument
  = name:Name _ ":" _ type:Name _ "=" _ value:Value
    { return { type: type, name: name, default: value } }
  / name:Name _ ":" _ type:Name
    { return { type: type, name: name } }

Statements
  = first:Statement others:( _ Statement )*
    { return resolveList(first, others, 1); }
  / _
    { return []; }

Statement
  = s:(ReturnStatement /
       EmitStatement /
       VariableDeclaration /
       VariableAssignment /
       ExpressionStatement
      ) _ ";" { return s; }
  / ForLoop
  / IfStatement
  / "{" _ statements:Statements _ "}"
    { return { type: "statements", statements: statements }; }

ReturnStatement
  = "return" __ expr:Expression
    { return { type: "return", value: expr }; }

EmitStatement
  = "emit" _ "[" vertices:EmitVertexList "]"
    { return { type: "emit", vertices: vertices }; }
  / "emit" _ "{" args:EmitArgumentList "}"
    { return { type: "emit", vertices: [ args ] }; }

EmitArgument
  = name:Name _ ":" _ expr:Expression
    { return { name: name, value: expr }; }

EmitArgumentList
  = _ first:EmitArgument others:( _ "," _ EmitArgument)* _
    { return resolveArgumentList(resolveList(first, others, 3)).kwargs; }
  / _
    { return {}; }

EmitVertexList
  = _ "{" first:EmitArgumentList "}" others: ( _ "," _ "{" EmitArgumentList "}")* _
    { return resolveList(first, others, 4); }
  / _
    { return []; }

ExpressionStatement
  = expr:Expression
    { return { type: "expression", expression: expr }; }

VariableDeclaration
  = "let" __  name:Name type:(_ ":" _ Name)? initial:(_ "=" _ Expression)?
    {
      return {
        type: "declare",
        variableType: type ? type[3] : "auto",
        variableName: name,
        initial: initial ? initial[3] : undefined
      };
    }

VariableAssignment
  = variable:Name _ "=" _ value:Expression
    { return { type: "assign", variableName: variable, expression: value }; }

ForLoop
  = "for" _ "(" _ variable:Name _ "in" _ start:Integer _ ".." _ end:Integer _ ")" _ statement:Statement
    { return { type: "for", variableName: variable, statement: statement, start: start, end: end }; }

IfStatement
  = "if" _ "(" _ condition:Expression _ ")" _ statement:Statement elseifs:(_ "else" __ "if" _ "(" _ Expression _ ")" _ Statement)* lastelse:(_ "else" _ Statement)?
    {
      var conditions = [ { condition: condition, statement: statement } ].concat(elseifs.map(function(x) {
        return { condition: x[7], statement: x[11] };
      }));
      return {type: "if", conditions: conditions, else: lastelse ? lastelse[3] : null };
    }

//
// Expression
//
Expression
  = ExpressionLevel1

ExpressionOp1 = "&&" / "||"
ExpressionOp2 = ">=" / ">" / "<=" / "<" / "==" / "!="
ExpressionOp3 = "+" / "-"
ExpressionOp4 = "*" / "/" / "%"

// Level 1: Logic operators.
ExpressionLevel1
  = "not" _ expr:ExpressionLevel1
    { return makeOperatorFunction({ type: "operator", operator: "!", args: [ item ] }); }
  / first:ExpressionLevel2 others:( _ ExpressionOp1 _ ExpressionLevel2 )*
    { return resolveExpressionBinaryOp(first, others); }

ExpressionLevel2
  = first:ExpressionLevel3 others:( _ ExpressionOp2 _ ExpressionLevel3 )*
    { return resolveExpressionBinaryOp(first, others); }
  / ExpressionLevel3

ExpressionLevel3
  = first:ExpressionLevel4 others:( _ ExpressionOp3 _ ExpressionLevel4 )*
    { return resolveExpressionBinaryOp(first, others); }
  / ExpressionLevel4

ExpressionLevel4
  = first:ExpressionLevel5 others:( _ ExpressionOp4 _ ExpressionLevel5 )*
    { return resolveExpressionBinaryOp(first, others); }
  / ExpressionLevel5

ExpressionLevel5 = ExpressionLevelN;

ExpressionLevelN
  = "-" _ item:ExpressionItem
    { return makeOperatorFunction({ type: "operator", operator: "-", args: [ item ] }); }
  / ExpressionItem

ExpressionParenthesis
  = "(" _ expr:Expression _ ")"
    { return expr; }

ExpressionItem
  = ExpressionFunction
  / ExpressionField
  / ExpressionVariable
  / ExpressionValue
  / ExpressionParenthesis

ExpressionVariable
  = name:Name
    { return { type: "variable", name: name }; }

ExpressionField
  = expr:(ExpressionFunction / ExpressionVariable / ExpressionParenthesis) "." field:Name
    { return { type: "field", value: expr, fieldName: field }; }

ExpressionFunction
  = name:Name _ "(" args:ExpressionFunctionArgumentList ")"
    { return { type: "function", name: name, args: resolveArgumentList(args) }; }

ExpressionFunctionArgumentList
  = _ first:ExpressionArgument others:( _ "," _ ExpressionArgument)* _
    { return resolveList(first, others, 3); }
  / _
    { return []; }

ExpressionArgument
  = name:Name _ "=" _ expr:Expression
    { return { name: name, value: expr }; }
  / expr:Expression
    { return { value: expr }; }

ExpressionValue
  = value:Float
    { return { type: "value", valueType: "float", value: value }; }
  / value:Integer
    { return { type: "value", valueType: "bool", value: value }; }
  / value:Boolean
    { return { type: "value", valueType: "int", value: value }; }
  / "[" _ first:Float others:(_ "," _ Float)* _ "]"
    {
      var list = resolveList(first, others, 3);
      return { type: "value", valueType: "Vector" + list.length, value: list };
    }

// Value
Value
  = Float
  / Integer
  / Boolean
  / "[" _ first:Float others:(_ "," _ Float)* _ "]"
    { return resolveList(first, others, 3); }

// Integer value
Integer
  = str:([+-]? [0-9]+)
    { return parseFloat(flatten(str)); }

// Float value
Float
  = str:([+-]? [0-9]+ ("." [0-9]+)? ([eE] [+-]? [0-9]+)?)
    { return parseFloat(flatten(str)); }

// Boolean value
Boolean
  = "true"
    { return true; }
  / "false"
    { return false; }

// A name
Name
  = name:([a-zA-Z_][a-zA-Z0-9_]*) { return flatten(name); }

// A sequence of spaces (can be empty)
_
  = [ \t\n]*
    { return ' '; }

// A sequence of spaces (must be non-empty)
__
  = [ \t\n]+
    { return ' '; }
