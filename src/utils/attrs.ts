const store = new WeakMap<object, Map<PropertyKey, any>>();

export function getAttr<T>(node: object, key: PropertyKey, def: any = null): T {
    const options = store.get(node);
    return options && options.get(key) || def;
};

export function setAttr(node: object, key: PropertyKey, value: any) {
    let options = store.get(node);
    if (!options) {
        options = new Map();
        store.set(node, options);
    }
    options.set(key, value);
};

export var AttrSymbols = {
    RawUrl: Symbol('raw-url'),
    HeaderType: Symbol('header-type'),
    HeaderLevel: Symbol('header-level'),
    ImageIndex: Symbol('image-index'),
};
