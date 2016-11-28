// Prebuilt scales.
import { Dictionary } from "../utils";
import { compileExpression } from "../compiler/compiler";
import { parseExpression } from "../compiler/parser";
import { Specification } from "../spec";
import { BindingValue, BindingPrimitive } from "../binding";
import { ScaleArgument, ScaleBinding, Scale, DomainRangeScale, CustomScale, ScaleAttributeInfo } from "./scale";
import * as SC from "../specConstruct";

export module scale {
    export function linear(valueType: string = "float"): DomainRangeScale {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, valueType, [ "float" ], ...args);
        }) as DomainRangeScale;

        let domain: [ BindingValue, BindingValue ] = [ 0, 1 ];
        let range: [ BindingValue, BindingValue ] = [ 0, 1 ];

        scale.domain = (value?: [ BindingValue, BindingValue ]) => {
            if(value == null) return domain;
            domain[0] = value[0];
            domain[1] = value[1];
            return scale;
        }
        scale.range = (value?: [ BindingValue, BindingValue ]) => {
            if(value == null) return range;
            range[0] = value[0];
            range[1] = value[1];
            return scale;
        }

        scale.getAttributes = () => {
            return [
                { name: "d0", type: valueType, binding: domain[0] },
                { name: "d1", type: valueType, binding: domain[1] },
                { name: "r0", type: valueType, binding: range[0] },
                { name: "r1", type: valueType, binding: range[1] }
            ];
        };
        scale.getExpression = (attrs, value) => {
            return SC.mix(
                attrs["r0"], attrs["r1"],
                SC.div(SC.sub(value, attrs["d0"]), SC.sub(attrs["d1"], attrs["d0"]))
            );
        }
        return scale;
    }

    export function log(valueType: string = "float"): DomainRangeScale {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, valueType, [ "float" ], ...args);
        }) as DomainRangeScale;

        let domain: [ BindingValue, BindingValue ] = [ 0, 1 ];
        let range: [ BindingValue, BindingValue ] = [ 0, 1 ];

        scale.domain = (value?: [ BindingValue, BindingValue ]) => {
            if(value == null) return domain;
            domain[0] = value[0];
            domain[1] = value[1];
            return scale;
        }
        scale.range = (value?: [ BindingValue, BindingValue ]) => {
            if(value == null) return range;
            range[0] = value[0];
            range[1] = value[1];
            return scale;
        }

        scale.getAttributes = () => {
            return [
                { name: "d0", type: valueType, binding: domain[0] },
                { name: "d1", type: valueType, binding: domain[1] },
                { name: "r0", type: valueType, binding: range[0] },
                { name: "r1", type: valueType, binding: range[1] }
            ];
        };
        scale.getExpression = (attrs, value) => {
            return SC.mix(
                attrs["r0"], attrs["r1"],
                SC.div(
                    SC.log(SC.div(value, attrs["d0"])),
                    SC.log(SC.div(attrs["d1"], attrs["d0"]))
                )
            );
        }
        return scale;
    }

    // Common arithmetics
    export function addScale() {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float", "float" ], ...args);
        }) as DomainRangeScale;
        scale.getAttributes = () => [];
        scale.getExpression = (attrs, value1, value2) => SC.add(value1, value2);
        return scale;
    }

    export function subScale() {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float", "float" ], ...args);
        }) as DomainRangeScale;
        scale.getAttributes = () => [];
        scale.getExpression = (attrs, value1, value2) => SC.sub(value1, value2);
        return scale;
    }

    export function mulScale() {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float", "float" ], ...args);
        }) as DomainRangeScale;
        scale.getAttributes = () => [];
        scale.getExpression = (attrs, value1, value2) => SC.mul(value1, value2);
        return scale;
    }

    export function divScale() {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float", "float" ], ...args);
        }) as DomainRangeScale;
        scale.getAttributes = () => [];
        scale.getExpression = (attrs, value1, value2) => SC.div(value1, value2);
        return scale;
    }

    // Common arithmetics
    export function vector2Scale() {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "Vector2", [ "float", "float" ], ...args);
        }) as DomainRangeScale;
        scale.getAttributes = () => [];
        scale.getExpression = (attrs, value1, value2) => SC.func("Vector2", "Vector2", value1, value2);
        return scale;
    }

    export function add(value1: ScaleArgument, value2: ScaleArgument) {
        return addScale()(value1, value2);
    }
    export function sub(value1: ScaleArgument, value2: ScaleArgument) {
        return subScale()(value1, value2);
    }
    export function mul(value1: ScaleArgument, value2: ScaleArgument) {
        return mulScale()(value1, value2);
    }
    export function div(value1: ScaleArgument, value2: ScaleArgument) {
        return divScale()(value1, value2);
    }
    export function Vector2(value1: ScaleArgument, value2: ScaleArgument) {
        return vector2Scale()(value1, value2);
    }

    export function custom(expr: string): CustomScale {
        let parsed = parseExpression(expr);
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            // Inference the return type
            let vars = new Dictionary<Specification.Expression>();
            attributes.forEach((attr, name) => {
                vars.set(name, { type: "constant", valueType: attr.type, value: null } as Specification.ExpressionConstant);
            });
            vars.set("value", { type: "constant", valueType: "float", value: null } as Specification.ExpressionConstant);
            let e = compileExpression(parsed, vars);
            return new ScaleBinding(scale, e.valueType, [ "float" ], ...args);
        }) as CustomScale;

        let attributes = new Dictionary<{ type: string, value: BindingValue }>();

        scale.attr = (name: string, value: BindingValue) => {
            if(value == null) {
                return attributes.get(name).value;
            } else {
                attributes.set(name, { type: "float", value: value });
                return scale;
            }
        };

        scale.getAttributes = () => {
            let r: ScaleAttributeInfo[] = [];;
            attributes.forEach((attr, name) => {
                r.push({ name: name, type: attr.type, binding: attr.value });
            });
            return r;
        };
        scale.getExpression = (attrs, value) => {
            let vars = new Dictionary<Specification.Expression>();
            for(let name in attrs) {
                if(attrs.hasOwnProperty(name)) {
                    vars.set(name, attrs[name]);
                }
            }
            vars.set("value", value);
            return compileExpression(parsed, vars);
        }
        return scale;
    }
}