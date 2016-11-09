import { Specification } from "./spec";
import { Platform, PlatformShape, PlatformShapeData } from "./platform";
import { Binding, BindingValue, BindingPrimitive, getBindingValue } from "./binding";
import { RuntimeError } from "./exceptions";
import { Dictionary, shallowClone } from "./utils";
import { ScaleBinding } from "./scale/scale";

export type ShapeBinding = Binding | ScaleBinding;

export interface InstanceInformation {
    data: any[];
    attrs: { [ name: string ]: BindingPrimitive };
};

export type InstanceFunction = (datum: any, index: number, data: any[]) => InstanceInformation;

export class Shape {
    private _spec: Specification.Shape;
    private _platform: Platform;
    private _bindings: Dictionary<ShapeBinding>;
    private _data: any[];
    private _instanceFunction: InstanceFunction;
    private _platformShape: PlatformShape;
    private _platformShapeData: PlatformShapeData | PlatformShapeData[];
    private _shouldUploadData: boolean;

    constructor(spec: Specification.Shape, platform: Platform) {
        this._spec = spec;
        this._data = [];
        this._platform = platform;
        this._bindings = new Dictionary<ShapeBinding>();
        this._platformShape = null;
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
    }

    public get spec(): Specification.Shape {
        return this._spec;
    }

    public attr(name: string): BindingValue | ScaleBinding;
    public attr(name: string, value: BindingValue | ScaleBinding): Shape;
    public attr(name: string, value?: BindingValue | ScaleBinding): Shape | BindingValue | ScaleBinding {
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
                if(this._platformShape) {
                    if(this._bindings.get(name) != value) {
                        this._platformShape = null;
                    }
                }
                this._bindings.set(name, value);
            } else {
                // Create new binding.
                let newBinding = new Binding(this._spec.input[name].type, value);
                // Decide if we should recompile the platform code.
                if(this._platformShape) {
                    // Recompile if the input was compiled as input,
                    // and the new binding is not a function.
                    if(this._platformShape.isUniform(name) && !newBinding.isFunction) {
                        this._platformShape.updateUniform(name, newBinding.specValue);
                    } else {
                        this._platformShape = null;
                    }
                }
                this._bindings.set(name, newBinding);
            }
            return this;
        }
    }

    public data(): any[];
    public data(data: any[]): Shape;
    public data(data?: any[]): Shape | any[] {
        if(data === undefined) {
            return this._data;
        } else {
            this._data = data.slice();
            this._shouldUploadData = true;
            return this;
        }
    }

    public instance(func?: InstanceFunction): Shape | any {
        if(func === undefined) {
            return this._instanceFunction;
        } else {
            this._instanceFunction = func;
        }
    }

    // Make alternative spec to include ScaleBinding values.
    public prepareSpecification(): [ Specification.Shape, Dictionary<Binding> ] {
        let newSpec: Specification.Shape = {
            input: shallowClone(this._spec.input),
            output: this._spec.output,
            statements: this._spec.statements.slice(),
            variables: shallowClone(this._spec.variables)
        };

        let newBindings = this._bindings.clone() as Dictionary<Binding>;

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
                delete newSpec.input[name];
                newBindings.delete(name);
            }
        });
        return [ newSpec, newBindings ];
    }

    public uploadScaleUniforms() {
        this._bindings.forEach((binding, name) => {
            if(binding instanceof ScaleBinding) {
                let attributes = binding.getAttributes();
                let attrs: { [ name: string ]: Specification.Expression } = {};
                attributes.forEach((attr) => {
                    this._platformShape.updateUniform(name + attr.bindedName, attr.binding as Specification.Value);
                });
            }
        });
    }

    public prepare(): Shape {
        if(!this._platformShape) {
            let [ spec, binding ] = this.prepareSpecification();
            this._platformShape = this._platform.compile(this, spec, binding);
            this._shouldUploadData = true;
        }
        if(this._shouldUploadData) {
            if(this._instanceFunction == null) {
                this._platformShapeData = this._platformShape.uploadData(this._data);
            } else {
                this._platformShapeData = this._data.map((datum, index) => {
                    let info = this._instanceFunction(datum, index, this._data);
                    this._platformShape.uploadData(info.data);
                });
            }
            this._shouldUploadData = false;
        }
        return this;
    }

    public render(): Shape {
        this.prepare();
        this.uploadScaleUniforms();
        if(this._instanceFunction == null) {
            this._platformShape.render(this._platformShapeData as PlatformShapeData);
        } else {
            let datas = this._platformShapeData as PlatformShapeData[];
            this._data.forEach((datum, index) => {
                let info = this._instanceFunction(datum, index, this._data);
                for(let attr in info.attrs) {
                    if(info.attrs.hasOwnProperty(attr)) {
                        this._platformShape.updateUniform(attr, getBindingValue(info.attrs[attr]));
                    }
                }
                this._platformShape.render(datas[index]);
            });
        }
        return this;
    }
}