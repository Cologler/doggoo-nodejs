const store = new WeakMap<object, Map<PropertyKey, unknown>>();

export function getAttr<T>(node: object, key: PropertyKey, def: T | null = null): T | null {
    const options = store.get(node);
    if (options) {
        const value = options.get(key);
        if (value !== undefined) {
            return <T> value;
        }
    }
    return def;
};

export function getRequiredAttr<T>(node: object, key: PropertyKey): T {
    const options = store.get(node);
    if (options) {
        const value = options.get(key);
        if (value !== undefined) {
            return <T> value;
        }
    }
    throw new Error('missing required attr');
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
