import { Specification, types, Type } from "../spec/spec";
import { getBindingValue, BindingPrimitive } from "./types";

export interface TextureData {
    // Must be 4 component texture.
    width: number;
    height: number;
    numberComponents: number;
    data: Float32Array;
    dimensions: number;
}

export abstract class TextureBinding {
    public abstract getTextureData(): TextureData;
}

export type ArrayBindingFunction = (datum: any, index: number, data: any[]) => BindingPrimitive;

export class Array extends TextureBinding {
    private _data: any[] = null;
    private _valueFunction: ArrayBindingFunction = null;
    private _dirty = false;
    private _textureData: TextureData = null;

    public getTextureData(): TextureData {
        if (this._dirty) {
            let values = this._data.map(this._valueFunction).map(getBindingValue);
            if (values.length == 0) {
                this._textureData = null;
            } else {
                let array: Float32Array;
                let numberComponents: number;
                if (typeof (values[0]) == "number") {
                    numberComponents = 1;
                    array = new Float32Array(values.length * 4);
                    for (let i = 0; i < values.length; i++) {
                        array[i * 4] = values[i] as number;
                    }
                } else {
                    numberComponents = (values[0] as number[]).length;
                    array = new Float32Array(values.length * 4);
                    let offset = 0;
                    for (let i = 0; i < values.length; i++) {
                        let v = values[i] as number[];
                        for (let j = 0; j < numberComponents; j++) {
                            array[offset++] = v[j];
                        }
                        offset += 4 - numberComponents;
                    }
                }
                this._textureData = {
                    width: this._data.length,
                    height: 1,
                    dimensions: 1,
                    numberComponents: numberComponents,
                    data: array
                }
            }
        }
        return this._textureData;
    }

    public data(): any[];
    public data(data: any[]): Array;
    public data(data?: any[]): Array | any[] {
        if (data != null) {
            this._data = data;
            this._dirty = true;
            return this;
        } else {
            return this._data;
        }
    }

    public value(): ArrayBindingFunction;
    public value(func: ArrayBindingFunction): Array;
    public value(func?: ArrayBindingFunction): Array | ArrayBindingFunction {
        if (func != null) {
            this._valueFunction = func;
            this._dirty = true;
            return this;
        } else {
            return this._valueFunction;
        }
    }
}

export function array(): Array {
    return new Array();
}