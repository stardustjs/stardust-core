import { MathType } from "../math/math";

// Stardust use colors with range 0-1 instead of 0-255, different from HTML!
export class Color extends MathType {
    constructor(
        public r: number = 0,
        public g: number = 0,
        public b: number = 0,
        public a: number = 1)
    { super(); }

    public toArray(): number[] {
        return [ this.r, this.g, this.b, this.a ];
    }
    public clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }
    public static FromArray([r, g, b, a]: number[]): Color {
        return new Color(r, g, b, a);
    }
    public static FromHTML(html: string) {
        return Color.FromArray(color.fromHTML(html));
    }
}

export module color {
    export function fromHTML(html: string = "#000000", alpha?: number): number[] {
        let m: RegExpMatchArray;
        m = html.match(/^ *rgb *\( *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *\) *$/);
        if(m) {
            return [ +m[1] / 255.0, +m[2] / 255.0, +m[3] / 255.0, alpha != null ? alpha : 1 ];
        }
        m = html.match(/^ *rgba *\( *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *\) *$/);
        if(m) {
            return [ +m[1] / 255.0, +m[2] / 255.0, +m[3] / 255.0, alpha != null ? alpha * +m[4]: +m[4] ];
        }
        m = html.match(/^ *\#([0-9a-fA-F]{3}) *$/);
        if(m) {
            let r = parseInt(m[1][0], 16) * 17;
            let g = parseInt(m[1][1], 16) * 17;
            let b = parseInt(m[1][2], 16) * 17;
            return [ r / 255.0, g / 255.0, b / 255.0, alpha != null ? alpha : 1 ];
        }
        m = html.match(/^ *\#([0-9a-fA-F]{6}) *$/);
        if(m) {
            let r = parseInt(m[1].slice(0, 2), 16);
            let g = parseInt(m[1].slice(2, 4), 16);
            let b = parseInt(m[1].slice(4, 6), 16);
            return [ r / 255.0, g / 255.0, b / 255.0, alpha != null ? alpha : 1 ];
        }
        return [ 0, 0, 0, 1 ];
    }
}