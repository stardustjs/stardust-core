import { compileString } from "./compiler/compiler";
import { CustomShape } from "./compiler/declare";
import { Shape } from "./shape";
import { Specification } from "./spec";
import { Platform } from "./platform";

export module shape {
    export function create(spec: Specification.Shape, platform: Platform): Shape;
    export function create(spec: CustomShape, platform: Platform): Shape;
    export function create(spec: CustomShape | Specification.Shape, platform: Platform): Shape {
        if(spec instanceof CustomShape) {
            return new Shape(spec.compile(), platform);
        } else {
            return new Shape(spec, platform);
        }
    }

    export function custom(): CustomShape {
        return new CustomShape();
    }

    export function compile(code: string): Specification.ShapeSpecifications {
        return compileString(code);
    }

    export function circle(sides: number = 32): Specification.Shape {
        return shape.compile(`
            shape Circle(
                center: Vector2,
                radius: float,
                color: Color
            ) {
                for(i in 0..${sides - 1}) {
                    let a1 = i / ${sides.toFixed(1)} * PI * 2.0;
                    let a2 = (i + 1) / ${sides.toFixed(1)} * PI * 2.0;
                    let p1 = Vector2(radius * cos(a1), radius * sin(a1));
                    let p2 = Vector2(radius * cos(a2), radius * sin(a2));
                    emit [
                        { position: center + p1, color: color },
                        { position: center, color: color },
                        { position: center + p2, color: color }
                    ];
                }
            }
        `)["Circle"];
    }

    export function line(): Specification.Shape {
        return shape.compile(`
            shape Line(
                p1: Vector2,
                p2: Vector2,
                width: float = 1,
                color: Color = [ 0, 0, 0, 1 ]
            ) {
                let d = normalize(p2 - p1);
                let t = Vector2(d.y, -d.x) * (width / 2);
                emit [
                    { position: p1 + t, color: color },
                    { position: p1 - t, color: color },
                    { position: p2 + t, color: color }
                ];
                emit [
                    { position: p1 - t, color: color },
                    { position: p2 - t, color: color },
                    { position: p2 + t, color: color }
                ];
            }
        `)["Line"];
    }

    export function polyline(): Specification.Shape {
        let spec = shape.compile(`
            import Triangle from P2D;

            shape Sector2(
                c: Vector2,
                p1: Vector2,
                p2: Vector2,
                color: Color
            ) {
                let pc = c + normalize(p1 + p2 - c - c) * length(p1 - c);
                Triangle(c, p1, pc, color);
                Triangle(c, pc, p2, color);
            }

            shape Sector4(
                c: Vector2,
                p1: Vector2,
                p2: Vector2,
                color: Color
            ) {
                let pc = c + normalize(p1 + p2 - c - c) * length(p1 - c);
                Sector2(c, p1, pc, color);
                Sector2(c, pc, p2, color);
            }

            shape PolylineRound(
                p: Vector2, p_p: Vector2, p_n: Vector2, p_nn: Vector2,
                width: float,
                color: Color = [ 0, 0, 0, 1 ]
            ) {
                let EPS = 1e-5;
                let w = width / 2;
                let d = normalize(p - p_n);
                let n = Vector2(d.y, -d.x);
                let m1: Vector2;
                if(length(p - p_p) < EPS) {
                    m1 = n * w;
                } else {
                    m1 = normalize(d + normalize(p - p_p)) * w;
                }
                let m2: Vector2;
                if(length(p_n - p_nn) < EPS) {
                    m2 = -n * w;
                } else {
                    m2 = normalize(normalize(p_n - p_nn) - d) * w;
                }
                let c1a: Vector2;
                let c1b: Vector2;
                let a1: Vector2;
                let a2: Vector2;
                if(dot(m1, n) > 0) {
                    c1a = p + m1;
                    c1b = p + n * w;
                    a2 = c1b;
                    a1 = p - m1 * (w / dot(m1, n));
                } else {
                    c1a = p + m1;
                    c1b = p - n * w;
                    a2 = p + m1 * (w / dot(m1, n));
                    a1 = c1b;
                }
                let c2a: Vector2;
                let c2b: Vector2;
                let b1: Vector2;
                let b2: Vector2;
                if(dot(m2, n) < 0) {
                    c2a = p_n + m2;
                    c2b = p_n - n * w;
                    b1 = c2b;
                    b2 = p_n + m2 * (w / dot(m2, n));
                } else {
                    c2a = p_n + m2;
                    c2b = p_n + n * w;
                    b2 = c2b;
                    b1 = p_n - m2 * (w / dot(m2, n));
                }
                Sector4(p, c1a, c1b, color);
                Sector4(p_n, c2a, c2b, color);
                Triangle(p, a1, b1, color);
                Triangle(p, b1, p_n, color);
                Triangle(p, a2, b2, color);
                Triangle(p, b2, p_n, color);
            }
        `)["PolylineRound"];
        spec.repeatBegin = 1;
        spec.repeatEnd = 1;
        return spec;
    }
}