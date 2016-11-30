import { Specification } from "../spec/spec";
import { Platform, PlatformMark, PlatformMarkData } from "../platform/platform";
import { Binding, ShiftBinding, BindingValue, BindingPrimitive, getBindingValue } from "../binding/binding";
import { RuntimeError } from "../exceptions";
import { Dictionary, shallowClone } from "../utils/utils";
import { ScaleBinding } from "../scale/scale";

export type MarkBinding = Binding | ScaleBinding;

export interface InstanceInformation {
    data: any[];
    attrs?: { [ name: string ]: BindingPrimitive };
    onRender?: (datum: any, index: number, data: any[]) => any;
};

export type InstanceFunction = (datum: any, index: number, data: any[]) => InstanceInformation;

let shiftBindingDescriptions = [
    { shift: -2, suffix: "_pp" },
    { shift: -1, suffix: "_p" },
    { shift: +1, suffix: "_n" },
    { shift: +2, suffix: "_nn" }
];

export class Mark {
    private _spec: Specification.Mark;
    private _platform: Platform;
    private _bindings: Dictionary<MarkBinding>;
    private _shiftBindings: Dictionary<ShiftBinding>;
    private _data: any[];
    private _instanceFunction: InstanceFunction;
    private _platformMark: PlatformMark;
    private _platformMarkData: PlatformMarkData;
    private _shouldUploadData: boolean;

    constructor(spec: Specification.Mark, platform: Platform) {
        this._spec = spec;
        this._data = [];
        this._platform = platform;
        this._bindings = new Dictionary<MarkBinding>();
        this._shiftBindings = new Dictionary<ShiftBinding>();
        this._platformMark = null;
        this._shouldUploadData = true;
        this._instanceFunction = null;

        // Set bindings to default value whenever exists.
        for(let name in this._spec.input) {
            if(this._spec.input.hasOwnProperty(name)) {
                let input = this._spec.input[name];
                if(input.default != null) {
                    this._bindings.set(name, new Binding(input.type, input.default));
                }
            }
        }

        // Assign shift bindings based on naming convention.
        for(let name in this._spec.input) {
            if(this._spec.input.hasOwnProperty(name)) {
                for(let { shift, suffix } of shiftBindingDescriptions) {
                    if(this._spec.input.hasOwnProperty(name + suffix)) {
                        this._shiftBindings.set(name + suffix, new ShiftBinding(name, shift));
                    }
                }
            }
        }
    }

    public get spec(): Specification.Mark {
        return this._spec;
    }

    public attr(name: string): BindingValue | ScaleBinding;
    public attr(name: string, value: BindingValue | ScaleBinding): Mark;
    public attr(name: string, value?: BindingValue | ScaleBinding): Mark | BindingValue | ScaleBinding {
        if(value === undefined) {
            if(!this._bindings.has(name)) {
                throw new RuntimeError(`attr '${name} is undefined.`);
            }
            let binding = this._bindings.get(name);
            if(binding instanceof Binding) {
                return binding.value;
            } else {
                return binding as ScaleBinding;
            }
        } else {
            if(!this._spec.input.hasOwnProperty(name)) {
                throw new RuntimeError(`attr '${name} is undefined.`);
            }
            if(value instanceof ScaleBinding) {
                if(this._platformMark) {
                    if(this._bindings.get(name) != value) {
                        this._platformMark = null;
                    }
                }
                this._bindings.set(name, value);
            } else {
                // Create new binding.
                let newBinding = new Binding(this._spec.input[name].type, value);
                // Decide if we should recompile the platform code.
                if(this._platformMark) {
                    // Recompile if the input was compiled as input,
                    // and the new binding is not a function.
                    if(this._platformMark.isUniform(name) && !newBinding.isFunction) {
                        this._platformMark.updateUniform(name, newBinding.specValue);
                    } else {
                        this._platformMark = null;
                    }
                }
                this._bindings.set(name, newBinding);
            }
            return this;
        }
    }

    public data(): any[];
    public data(data: any[]): Mark;
    public data(data?: any[]): Mark | any[] {
        if(data === undefined) {
            return this._data;
        } else {
            this._data = data.slice();
            this._shouldUploadData = true;
            return this;
        }
    }

    public instance(func?: InstanceFunction): Mark | any {
        if(func === undefined) {
            return this._instanceFunction;
        } else {
            this._instanceFunction = func;
        }
    }

    // Make alternative spec to include ScaleBinding values.
    public prepareSpecification(): [ Specification.Mark, Dictionary<Binding>, Dictionary<ShiftBinding> ] {
        let newSpec: Specification.Mark = {
            input: shallowClone(this._spec.input),
            output: this._spec.output,
            statements: this._spec.statements.slice(),
            variables: shallowClone(this._spec.variables),
            repeatBegin: this._spec.repeatBegin,
            repeatEnd: this._spec.repeatEnd
        };

        let newBindings = this._bindings.clone() as Dictionary<Binding>;
        let shiftBindings = this._shiftBindings.clone();

        this._bindings.forEach((binding, name) => {
            if(binding instanceof ScaleBinding) {
                let attributes = binding.getAttributes();
                let attrs: { [ name: string ]: Specification.Expression } = {};
                attributes.forEach((attr) => {
                    let bindedName = name + attr.bindedName;
                    newBindings.set(bindedName, new Binding(attr.type, attr.binding));
                    attrs[attr.bindedName] = {
                        type: "variable",
                        valueType: attr.type,
                        variableName: bindedName
                    } as Specification.ExpressionVariable;
                    newSpec.input[bindedName] = {
                        type: attr.type,
                        default: null
                    };
                });
                // Move the attribute to variables.
                newSpec.variables[name] = newSpec.input[name].type;
                newSpec.statements.splice(0, 0, {
                    type: "assign",
                    variableName: name,
                    expression: binding.getExpression(attrs),
                    valueType: newSpec.input[name].type
                } as Specification.StatementAssign);
                for(let { suffix, shift } of shiftBindingDescriptions) {
                    if(newSpec.input.hasOwnProperty(name + suffix)) {
                        newSpec.variables[name + suffix] = newSpec.input[name].type;
                        let shiftAttrs: { [ name: string ]: Specification.Expression } = {};
                        attributes.forEach((attr) => {
                            let bindedName = name + attr.bindedName;
                            if(newBindings.get(bindedName).isFunction) {
                                let shiftBindedName = bindedName + suffix;
                                shiftBindings.set(shiftBindedName, new ShiftBinding(bindedName, shift));
                                shiftAttrs[attr.bindedName] = {
                                    type: "variable",
                                    valueType: attr.type,
                                    variableName: shiftBindedName
                                } as Specification.ExpressionVariable;
                                newSpec.input[shiftBindedName] = {
                                    type: attr.type,
                                    default: null
                                };
                            } else {
                                shiftAttrs[attr.bindedName] = {
                                    type: "variable",
                                    valueType: attr.type,
                                    variableName: bindedName
                                } as Specification.ExpressionVariable;
                            }
                        });
                        newSpec.statements.splice(0, 0, {
                            type: "assign",
                            variableName: name + suffix,
                            expression: binding.getExpression(shiftAttrs),
                            valueType: newSpec.input[name].type
                        } as Specification.StatementAssign);
                    }
                }

                delete newSpec.input[name];
                newBindings.delete(name);
                for(let { suffix } of shiftBindingDescriptions) {
                    if(shiftBindings.has(name + suffix)) {
                        delete newSpec.input[name + suffix];
                        shiftBindings.delete(name + suffix);
                    }
                }
            }
        });
        return [ newSpec, newBindings, shiftBindings ];
    }

    public uploadScaleUniforms() {
        this._bindings.forEach((binding, name) => {
            if(binding instanceof ScaleBinding) {
                let attributes = binding.getAttributes();
                let attrs: { [ name: string ]: Specification.Expression } = {};
                attributes.forEach((attr) => {
                    this._platformMark.updateUniform(name + attr.bindedName, attr.binding as Specification.Value);
                });
            }
        });
    }

    public prepare(): Mark {
        if(!this._platformMark) {
            let [ spec, binding, shiftBinding ] = this.prepareSpecification();
            this._platformMark = this._platform.compile(this, spec, binding, shiftBinding);
            this._shouldUploadData = true;
        }
        if(this._shouldUploadData) {
            if(this._instanceFunction == null) {
                this._platformMarkData = this._platformMark.uploadData([ this._data ]);
            } else {
                let allData: any[][] = [];
                this._data.forEach((datum, index) => {
                    let info = this._instanceFunction(datum, index, this._data);
                    allData.push(info.data);
                });
                this._platformMarkData = this._platformMark.uploadData(allData);
            }
            this._shouldUploadData = false;
        }
        return this;
    }

    public render(): Mark {
        this.prepare();
        if(this._instanceFunction == null) {
            this._platformMark.render(this._platformMarkData, () => {
                this.uploadScaleUniforms();
            });
        } else {
            this._platformMark.render(this._platformMarkData, (index: number) => {
                let datum = this._data[index];
                let info = this._instanceFunction(datum, index, this._data);
                if(info.attrs != null) {
                    for(let attr in info.attrs) {
                        if(info.attrs.hasOwnProperty(attr)) {
                            this._platformMark.updateUniform(attr, getBindingValue(info.attrs[attr]));
                        }
                    }
                }
                if(info.onRender) {
                    info.onRender(datum, index, this._data);
                }
                this.uploadScaleUniforms();
            });
        }
        return this;
    }
}