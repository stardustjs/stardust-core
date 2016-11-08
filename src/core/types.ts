// Basic types.

export interface Type {
    name: string;
    size: number;
    primitive: string;
    primitiveCount: number;
}

function MakeType(name: string, size: number, primitive: string, primitiveCount: number): Type {
    return {
        name: name,
        size: size,
        primitive: primitive,
        primitiveCount: primitiveCount
    };
}

export let types: { [name: string]: Type; } = {
    "float": MakeType("float", 4, "float", 1),
    "int": MakeType("int", 4, "int", 1),
    "Vector2": MakeType("Vector2", 8, "float", 2),
    "Vector3": MakeType("Vector3", 12, "float", 3),
    "Quaternion": MakeType("Quaternion", 16, "float", 4),
    "Color": MakeType("Color", 16, "float", 4)
}