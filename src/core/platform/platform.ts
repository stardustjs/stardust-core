import { Specification } from "../spec/spec";
import { Binding, ShiftBinding } from "../binding/binding";
import { Dictionary } from "../utils/utils";
import { Mark } from "../mark/mark";

export abstract class PlatformMarkData {}

export abstract class PlatformMark {
    // Is the input attribute compiled as uniform?
    public abstract isUniform(name: string): boolean;
    // Update a uniform in the spec, on isUniform(name) == true.
    public abstract updateUniform(name: string, value: Specification.Value): void;
    // Upload data to the mark.
    public abstract uploadData(data: any[][]): PlatformMarkData;

    // Render the graphics.
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

export abstract class Platform {
    // Compile a mark specification to PlatformMark object.
    public abstract compile(
        mark: Mark,
        spec: Specification.Mark,
        bindings: Dictionary<Binding>,
        shfitBindings: Dictionary<ShiftBinding>
    ): PlatformMark;
}

let platformConstructors = new Dictionary<(...args: any[]) => Platform>();

export function registerPlatformConstructor(name: string, ctor: (...args: any[]) => Platform) {
    platformConstructors.set(name, ctor);
}

export function platform(name: string, ...args: any[]): Platform {
    return platformConstructors.get(name)(...args);
}