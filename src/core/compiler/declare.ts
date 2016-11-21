// Declare shape code with Javascript calls.

import { Dictionary } from "../utils";
import { Specification } from "../spec";
import { compileString } from "./compiler";

export class CustomShapeItem {
    private _name: string;
    private _attrs: Dictionary<string>;

    constructor(name: string) {
        this._name = name;
        this._attrs = new Dictionary<string>();
    }

    public attr(name: string, expression: string): CustomShapeItem {
        this._attrs.set(name, expression);
        return this;
    }

    public generateCode(): string {
        var attrDefs: string[] = [];
        this._attrs.forEach((value, key) => {
            attrDefs.push(`${key} = ${value}`);
        });
        return `${this._name}(${attrDefs.join(", ")})`;
    }
}

export class CustomShape {
    private _imports: [ string, string ][];
    private _inputs: [ string, string, string ][];
    private _variables: [ string, string ][];
    private _items: CustomShapeItem[];

    constructor() {
        this._imports = [];
        this._inputs = [];
        this._variables = [];
        this._items = [];
    }

    public input(name: string, type: string, initial?: string): CustomShape {
        this._inputs.push([ name, type, initial ]);
        return this;
    }

    public variable(name: string, expression: string): CustomShape {
        this._variables.push([ name, expression ]);
        return this;
    }

    public add(name: string): CustomShapeItem {
        let [ libraryName, shapeName ] = name.split(".");
        let alreadyImported = false;
        for(let [ lib, shape ] of this._imports) {
            if(lib == libraryName && shape == shapeName) {
                alreadyImported = true;
            }
        }
        if(!alreadyImported) {
            this._imports.push([ libraryName, shapeName ]);
        }
        let item = new CustomShapeItem(shapeName);
        this._items.push(item);
        return item;
    }

    public generateCode(shapeName: string): string {
        let lines: string[] = [];
        for(let [ library, name ] of this._imports) {
            lines.push(`import ${name} from ${library};`);
        }
        // Input attributes:
        let inputDefs: string[] = [];
        for(let [ name, type, initial ] of this._inputs) {
            if(initial == null) {
                inputDefs.push(`${name}: ${type}`);
            } else {
                inputDefs.push(`${name}: ${type} = ${initial}`);
            }
        }
        lines.push(`shape ${shapeName}(`);
        lines.push(`    ${inputDefs.join(", ")}`);
        lines.push(`) {`);
        // Variables
        for(let [ name, expression ] of this._variables) {
            lines.push(`    let ${name} = ${expression};`);
        }
        for(let item of this._items) {
            lines.push(`    ${item.generateCode()};`);
        }
        lines.push(`}`);
        return lines.join("\n");
    }

    public compile(): Specification.Shape {
        let code = this.generateCode("Shape");
        let specs = compileString(code);
        return specs["Shape"];
    }

    public static test() {
        let g = new CustomShape();
        g.input("x", "float").input("y", "float")
        .add("P2D.Circle")
            .attr("center", "Vector2(x, y)")
            .attr("radius", "1")
            .attr("color", "Color(0, 1, 0, 1)")
        console.log(g.generateCode("Shape"));
        console.log(g.compile());

    }
}