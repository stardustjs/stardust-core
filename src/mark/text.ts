import { Platform } from "../platform";
import { Mark } from "./mark";
import { BindingValue, Image, Binding, Array } from "../binding";
import { ScaleBinding } from "../scale";
import { compile } from "./marks";
import * as TextCache from "./textCache";

interface TextLayoutData {
    size: number[];
    position: number[];
}

export class TextMark extends Mark {
    private _textBinding: BindingValue = "text";
    private _fontFamilyBinding: BindingValue = "Arial";
    private _fontSizeBinding: BindingValue = 12;
    private _fontWeightBinding: BindingValue = "normal";
    private _fontStyleBinding: BindingValue = "normal";

    private _textCache: TextCache.TextCache;
    private _textLayouts: TextLayoutData[];
    private _shouldRefreshCanvas: boolean;
    private _image: Image;
    private _textInfo: Array;

    constructor(mode: "2d" | "3d" = "2d", platform: Platform) {
        super(compile(`
            mark TextMark(
                position: ${mode == "2d" ? "Vector2" : "Vector3"},
                normal: Vector3 = [ 0, 0, 1 ],
                up: ${mode == "2d" ? "Vector2 = [ 0, 1 ]" : "Vector3 = [ 0, 1, 0 ]"},
                scale: float = 1,
                color: Color = [ 0, 0, 0, 1 ],
                alignX: float = 0,
                alignY: float = 0,
                mScaling: float,
                mImage: Image,
                mTextInfo: Vector4Array,
                mIndex: float
            ) {
                let p = ${mode == "2d" ? "Vector3(position.x, position.y, 0)" : "position"};
                let info = array(mTextInfo, mIndex);
                let e1 = normalize(cross(${mode == "2d" ? "Vector3(up.x, up.y, 0)" : "up"}, normal)) * info.x * (scale / mScaling);
                let e2 = normalize(cross(normal, e1)) * info.y * (scale / mScaling);
                p = p - e1 * alignX - e2 * (1 - alignY);
                let mSizeX = Vector2(info.x, 0);
                let mSizeY = Vector2(0, info.y);
                let mTexPos = Vector2(info.z, info.w);
                emit [
                    { position: p, tp: mTexPos, color: color },
                    { position: p + e1, tp: mTexPos + mSizeX, color: color },
                    { position: p + e1 + e2, tp: mTexPos + mSizeX + mSizeY, color: color },
                    { position: p, tp: mTexPos, color: color },
                    { position: p + e1 + e2, tp: mTexPos + mSizeX + mSizeY, color: color },
                    { position: p + e2, tp: mTexPos + mSizeY, color: color }
                ];
            }
        `)["TextMark"], compile(`
            shader TextShader(
                tp: Vector2,
                mImage: Image,
                color: Color
            ) {
                let c = image(mImage, tp);
                let alpha = c.a;
                if(alpha == 0) {
                    discard;
                } else {
                    emit { color: Color(color.r, color.g, color.b, alpha * color.a) };
                }
            }
        `)["TextShader"], platform);

        this._textCache = new TextCache.TextCache(1024, 1024);

        this._image = new Image();
        this._textInfo = new Array();
        this.attr("mScaling", this._textCache.scaling);
        this.attr("mImage", this._image);
        this.attr("mIndex", (d, i) => i);
        this.attr("mTextInfo", this._textInfo);

        this._shouldRefreshCanvas = true;
    }

    public prepare(): Mark {
        if (this._shouldRefreshCanvas) {
            let data = this.data();
            let texts = new Binding("string", this._textBinding).map(data);
            let fontFamilys = new Binding("string", this._fontFamilyBinding).map(data);
            let fontSizes = new Binding("string", this._fontSizeBinding).map(data);
            let fontWeights = new Binding("string", this._fontWeightBinding).map(data);
            let fontStyles = new Binding("string", this._fontStyleBinding).map(data);

            let attempt = () => {
                this._textLayouts = texts.map((x, i) => {
                    let font = new TextCache.Font(fontFamilys[i].toString(), fontSizes[i] as number, fontWeights[i].toString(), fontStyles[i].toString());
                    let info = this._textCache.addText(x.toString(), font);
                    return {
                        size: [info.w, info.h],
                        position: [info.x, info.y]
                    };
                });
            }
            try {
                attempt();
            } catch (e) {
                this._textCache.clear();
                attempt();
            }
            this._textInfo.data(texts);
            this._textInfo.value((d, i) => [
                this._textLayouts[i].size[0], this._textLayouts[i].size[1],
                this._textLayouts[i].position[0], this._textLayouts[i].position[1]
            ]);
            this.attr("mTextInfo", this._textInfo);
            if (this._textCache.updated) {
                this._image.setImage(this._textCache.canvas);
                this.attr("mImage", this._image);
                this._textCache.updated = false;
            }
            this._shouldRefreshCanvas = false;
        }
        return super.prepare();
    }

    public attr(name: string): BindingValue | ScaleBinding;
    public attr(name: string, value: BindingValue | ScaleBinding): Mark;
    public attr(name: string, value?: BindingValue | ScaleBinding): Mark | BindingValue | ScaleBinding {
        switch (name) {
            case "text": {
                if (value === undefined) {
                    return this._textBinding;
                } else {
                    this._textBinding = value as BindingValue;
                    this._shouldRefreshCanvas = true;
                    return this;
                }
            }
            case "fontFamily": {
                if (value === undefined) {
                    return this._fontFamilyBinding;
                } else {
                    this._fontFamilyBinding = value as BindingValue;
                    this._shouldRefreshCanvas = true;
                    return this;
                }
            }
            case "fontSize": {
                if (value === undefined) {
                    return this._fontSizeBinding;
                } else {
                    this._fontSizeBinding = value as BindingValue;
                    this._shouldRefreshCanvas = true;
                    return this;
                }
            }
            case "fontWeight": {
                if (value === undefined) {
                    return this._fontWeightBinding;
                } else {
                    this._fontWeightBinding = value as BindingValue;
                    this._shouldRefreshCanvas = true;
                    return this;
                }
            }
            case "fontStyle": {
                if (value === undefined) {
                    return this._fontStyleBinding;
                } else {
                    this._fontStyleBinding = value as BindingValue;
                    this._shouldRefreshCanvas = true;
                    return this;
                }
            }
            default: {
                return super.attr(name, value);
            }
        }
    }

    public data(): any[];
    public data(data: any[]): Mark;
    public data(data?: any[]): Mark | any[] {
        if (data === undefined) {
            return super.data();
        } else {
            super.data(data);
            this._shouldRefreshCanvas = true;
            return this;
        }
    }
}

export function createText(mode: "2d" | "3d", platform: Platform) {
    return new TextMark(mode, platform);
}