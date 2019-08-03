
export namespace Events {
    export const addImage = Symbol('OnAddImage');
}

export const HeaderTypes = ['title', 'chapter', 'section', 'number'] as const;
export type HeaderTypes = typeof HeaderTypes[number];
