// Prebuilt scales.
import { Specification } from "./spec";
import { BindingValue, BindingPrimitive } from "./binding";
import * as SC from "./specConstruct";

export type ScaleArgument = BindingValue | ScaleBinding;

export interface ScaleAttributeInfo {
    name: string;
    type: string;
    binding: BindingValue;
}

export interface ScaleBindingAttributeInfo extends ScaleAttributeInfo {
    scaleBinding: ScaleBinding;
    bindedName: string;
}

export class ScaleBinding {
    private _scale: Scale;
    private _returnType: string;
    private _argTypes: string[];
    private _args: ScaleArgument[];

    constructor(scale: Scale, returnType: string, argTypes: string[], ...args: ScaleArgument[]) {
        this._scale = scale;
        this._returnType = returnType;
        this._argTypes = argTypes;
        this._args = args;
    }

    public getReturnType(): string {
        return this._returnType;
    }

    public getAttributes(): ScaleBindingAttributeInfo[] {
        let result: ScaleBindingAttributeInfo[] = [];
        for(let attr of this._scale.getAttributes()) {
            result.push({
                scaleBinding: this,
                bindedName: `s${attr.name}`,
                name: attr.name,
                type: attr.type,
                binding: attr.binding
            })
        }
        this._args.forEach((arg, index) => {
            if(arg instanceof ScaleBinding) {
                let a = arg as ScaleBinding;
                let attributes = a.getAttributes();
                for(let attr of attributes) {
                    result.push({
                        scaleBinding: this,
                        bindedName: `a${index}${attr.bindedName}`,
                        name: attr.name,
                        type: attr.type,
                        binding: attr.binding
                    })
                }
            } else {
                // Binded values become attributes here.
                result.push({
                    scaleBinding: this,
                    bindedName: `a${index}`,
                    name: `a${index}`,
                    type: this._argTypes[index],
                    binding: arg as BindingValue
                });
            }
        });
        return result;
    }

    public getExpression(attrs: { [ name: string ]: Specification.Expression }): Specification.Expression {
        let sAttrs: { [ name: string ]: Specification.Expression } = {};
        for(let attr of this._scale.getAttributes()) {
            sAttrs[attr.name] = attrs[`s${attr.name}`];
        }
        let values = this._args.map((arg, index) => {
            if(arg instanceof ScaleBinding) {
                let a = arg as ScaleBinding;
                let attributes = a.getAttributes();
                let aAttrs: { [ name: string ]: Specification.Expression } = {};
                for(let attr of attributes) {
                    aAttrs[attr.bindedName] = attrs[`a${index}${attr.bindedName}`];
                }
                return arg.getExpression(aAttrs);
            } else {
                return attrs[`a${index}`];
            }
        });
        return this._scale.getExpression(sAttrs, ...values);
    }
}

export interface Scale {
    (...args: ScaleArgument[]): ScaleBinding;
    getExpression: (attrs: { [ name: string ]: Specification.Expression }, ...values: Specification.Expression[]) => Specification.Expression;
    getAttributes: () => ScaleAttributeInfo[];
}

export interface DomainRangeScale extends Scale {
    domain: (value?: [ BindingValue, BindingValue ]) => DomainRangeScale | [ BindingValue, BindingValue ];
    range: (value?: [ BindingValue, BindingValue ]) => DomainRangeScale | [ BindingValue, BindingValue ];
}

export module scales {
    export function linear(): DomainRangeScale {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float" ], ...args);
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
                { name: "d0", type: "float", binding: domain[0] },
                { name: "d1", type: "float", binding: domain[1] },
                { name: "r0", type: "float", binding: range[0] },
                { name: "r1", type: "float", binding: range[1] }
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

    export function log(): DomainRangeScale {
        let scale = ((...args: ScaleArgument[]): ScaleBinding => {
            return new ScaleBinding(scale, "float", [ "float" ], ...args);
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
                { name: "d0", type: "float", binding: domain[0] },
                { name: "d1", type: "float", binding: domain[1] },
                { name: "r0", type: "float", binding: range[0] },
                { name: "r1", type: "float", binding: range[1] }
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
        scale.getExpression = (attrs, value1, value2) => {
            console.log(value1, value2);
            return SC.add(value1, value2);
        }
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
}