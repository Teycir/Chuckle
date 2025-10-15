const storage = new Map<string, any>();

global.chrome = {
  storage: {
    local: {
      get: (keys: any) => {
        if (keys === null) {
          return Promise.resolve(Object.fromEntries(storage));
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storage.get(keys) });
        }
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => result[key] = storage.get(key));
        }
        return Promise.resolve(result);
      },
      set: (items: any) => {
        Object.entries(items).forEach(([key, value]) => storage.set(key, value));
        return Promise.resolve();
      },
      remove: (keys: any) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => storage.delete(key));
        return Promise.resolve();
      },
      clear: () => {
        storage.clear();
        return Promise.resolve();
      }
    }
  }
} as any;
