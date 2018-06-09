export let primitives = `
    mark Triangle(
        p1: Vector3,
        p2: Vector3,
        p3: Vector3,
        color: Color = [ 0, 0, 0, 1 ]
    ) {
        let normal = normalize(cross(p2 - p1, p3 - p1));
        emit [
            { position: p1, color: color, normal: normal },
            { position: p2, color: color, normal: normal },
            { position: p3, color: color, normal: normal }
        ];
    }

    mark Tetrahedron(
        p1: Vector3,
        p2: Vector3,
        p3: Vector3,
        p4: Vector3,
        color: Color = [ 0, 0, 0, 1 ]
    ) {
        Triangle(p3, p4, p1, color);
        Triangle(p1, p4, p2, color);
        Triangle(p1, p2, p3, color);
        Triangle(p2, p3, p4, color);
    }

    mark Line(
        p1: Vector3,
        p2: Vector3,
        width: float = 1,
        color: Color = [ 1, 0, 1, 1 ]
    ) {
        let center = (p1 + p2) * 0.5;
        let d = p2 - p1;
        let v = get_camera_direction(center);
        let F = normalize(cross(d, v));
        let normal = normalize(cross(F, d));
        let s = width * 0.5;
        emit [
            { position: p1 + F * s, color: color, normal: normal },
            { position: p2 + F * s, color: color, normal: normal },
            { position: p1 - F * s, color: color, normal: normal },
            { position: p1 - F * s, color: color, normal: normal },
            { position: p2 - F * s, color: color, normal: normal },
            { position: p2 + F * s, color: color, normal: normal }
        ];
    }

    mark Cube(
        center: Vector3,
        radius: float,
        color: Color
    ) {
        let p000 = Vector3(center.x - radius, center.y - radius, center.z - radius);
        let p001 = Vector3(center.x - radius, center.y - radius, center.z + radius);
        let p010 = Vector3(center.x - radius, center.y + radius, center.z - radius);
        let p011 = Vector3(center.x - radius, center.y + radius, center.z + radius);
        let p100 = Vector3(center.x + radius, center.y - radius, center.z - radius);
        let p101 = Vector3(center.x + radius, center.y - radius, center.z + radius);
        let p110 = Vector3(center.x + radius, center.y + radius, center.z - radius);
        let p111 = Vector3(center.x + radius, center.y + radius, center.z + radius);
        let nx = Vector3(1, 0, 0);
        let ny = Vector3(0, 1, 0);
        let nz = Vector3(0, 0, 1);
        emit [ { position: p000, color: color, normal: nz }, { position: p110, color: color, normal: nz }, { position: p100, color: color, normal: nz } ];
        emit [ { position: p000, color: color, normal: nz }, { position: p010, color: color, normal: nz }, { position: p110, color: color, normal: nz } ];
        emit [ { position: p001, color: color, normal: nz }, { position: p101, color: color, normal: nz }, { position: p111, color: color, normal: nz } ];
        emit [ { position: p001, color: color, normal: nz }, { position: p111, color: color, normal: nz }, { position: p011, color: color, normal: nz } ];
        emit [ { position: p000, color: color, normal: ny }, { position: p100, color: color, normal: ny }, { position: p101, color: color, normal: ny } ];
        emit [ { position: p000, color: color, normal: ny }, { position: p101, color: color, normal: ny }, { position: p001, color: color, normal: ny } ];
        emit [ { position: p010, color: color, normal: ny }, { position: p111, color: color, normal: ny }, { position: p110, color: color, normal: ny } ];
        emit [ { position: p010, color: color, normal: ny }, { position: p011, color: color, normal: ny }, { position: p111, color: color, normal: ny } ];
        emit [ { position: p000, color: color, normal: nx }, { position: p001, color: color, normal: nx }, { position: p011, color: color, normal: nx } ];
        emit [ { position: p000, color: color, normal: nx }, { position: p011, color: color, normal: nx }, { position: p010, color: color, normal: nx } ];
        emit [ { position: p100, color: color, normal: nx }, { position: p101, color: color, normal: nx }, { position: p111, color: color, normal: nx } ];
        emit [ { position: p100, color: color, normal: nx }, { position: p111, color: color, normal: nx }, { position: p110, color: color, normal: nx } ];
    }
`;