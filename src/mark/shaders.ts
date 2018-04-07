import { compileString } from "../compiler/compiler";
import * as Specification from "../specification/specification";

export function compile(code: string): Specification.Marks {
    return compileString(code);
}

export function basic(): Specification.Shader {
    return compile(`
        shader Default(
            color: Color = [ 0, 0, 0, 1 ]
        ) {
            emit { color: color };
        }
    `)["Default"];
}

export function lighting(): Specification.Shader {
    return compile(`
        shader Default(
            color: Color = [ 0, 0, 0, 1 ],
            normal: Vector3,
            position: Vector3
        ) {
            let lighting = normalize(position);
            let NdotL = abs(dot(normal, lighting));
            let s = NdotL * 0.5 + 0.5;
            emit { color: Color(s * color.r, s * color.g, s * color.b, color.a) };
        }
    `)["Default"];
}