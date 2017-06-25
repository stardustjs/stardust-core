import { Specification } from "../spec/spec";
import { BindingValue, BindingPrimitive } from "../binding/binding";

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
    domain(): [ BindingValue, BindingValue ];
    domain(value: [ BindingValue, BindingValue ]): DomainRangeScale;

    range(): [ BindingValue, BindingValue ];
    range(value: [ BindingValue, BindingValue ]): DomainRangeScale;
}

export interface InterpolateScale extends Scale {
    t(): BindingValue;
    t(value: BindingValue): InterpolateScale;
}

export interface CustomScale extends Scale {
    attr(name: string): BindingValue;
    attr(name: string, value: BindingValue): CustomScale;
    attr(name: string, type: string, value: BindingValue): CustomScale;
}