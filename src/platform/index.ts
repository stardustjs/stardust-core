import { Dictionary } from "../common";

import * as Specification from "../specification";
import { Binding, ShiftBinding, TextureBinding } from "../binding/binding";

import { Mark } from "../mark/mark";

export abstract class PlatformMarkData { }

export abstract class PlatformMark {
    /** Is the input attribute compiled as uniform? */
    public abstract isUniform(name: string): boolean;

    /** Update a uniform in the spec, on isUniform(name) == true */
    public abstract updateUniform(name: string, value: Specification.Value): void;
    public abstract updateTexture(name: string, value: TextureBinding): void;

    public abstract uploadData(data: any[][]): PlatformMarkData;

    /** Render the graphics */
    public abstract render(data: PlatformMarkData, onRender: (i: number) => void): void;
}

export class Viewport {
}

export class Viewport2D extends Viewport {
    constructor(
        public width: number,
        public height: number
    ) { super(); }
}

export class Viewport3D extends Viewport {
    constructor(
        public width: number,
        public height: number,
        public fov: number
    ) { super(); }
}

let platformConstructors = new Dictionary<(...args: any[]) => Platform>();

export abstract class Platform {
    /** Compile a mark specification to PlatformMark object */
    public abstract compile(
        mark: Mark,
        spec: Specification.Mark,
        shader: Specification.Shader,
        bindings: Dictionary<Binding>,
        shfitBindings: Dictionary<ShiftBinding>
    ): PlatformMark;

    /** Register a platform */
    public static Register(name: string, ctor: (...args: any[]) => Platform) {
        platformConstructors.set(name, ctor);
    }

    /** Create a platform */
    public static Create(name: string, ...args: any[]) {
        return platformConstructors.get(name)(...args);
    }
}

export function platform(name: string, ...args: any[]) {
    return Platform.Create(name, ...args);
}