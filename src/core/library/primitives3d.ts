export let primitives = `
    shape Triangle(
        Vector3 p1,
        Vector3 p2,
        Vector3 p3,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        emit [
            { position: p1, color: color },
            { position: p2, color: color },
            { position: p3, color: color }
        ];
    }

    shape Tetrahedron(
        Vector3 p1,
        Vector3 p2,
        Vector3 p3,
        Vector3 p4
    ) {
        Triangle(p3, p4, p1);
        Triangle(p1, p4, p2);
        Triangle(p1, p2, p3);
        Triangle(p2, p3, p4);
    }
`;