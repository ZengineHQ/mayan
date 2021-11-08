export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

export const sanitizeForPostMessage = obj => {
  const referenceMap = new Map();

  function sanitize (obj) {
    if (referenceMap.has(obj)) {
      // the reference at this location is what we want
      // (either circular object or a primitive we've seen before)
      return referenceMap.get(obj);
    }

    if (Object(obj) !== obj) {
      // short circuit for obvious primitive values
      referenceMap.set(obj, obj);

      return obj;
    }

    switch ({}.toString.call(obj).slice(8, -1)) { // gets the class name (probably)
      case 'Boolean':
      case 'Number':
      case 'String':
      case 'Date':
      case 'RegExp':
      case 'Blob':
      case 'FileList':
      case 'ImageData':
      case 'ImageBitmap':
      case 'ArrayBuffer':
        // is a supported data type that doesn't need to be cloned
        referenceMap.set(obj, obj);

        return obj;
      case 'Array': {
        const newArr = [];

        // store the new reference before looping to avoid infinite loop
        referenceMap.set(obj, newArr);

        // use reduce to build array and maintain new reference as the return value
        return obj.reduce((nA, el) => {
          nA.push(sanitize(el));

          return nA;
        }, newArr);
      }
      case 'Object': {
        const newObj = {};

        // store the new reference before looping to avoid infinite loop
        referenceMap.set(obj, newObj);

        // use reduce to build object and maintain new reference as the return value
        return Object.keys(obj).reduce((nO, key) => {
          // We don't want angular properties beginning with $
          if (key[0] !== '$') {
            nO[key] = sanitize(obj[key]);
          }

          return nO;
        }, newObj);
      }
      case 'Map': {
        const newMap = new Map();

        referenceMap.set(obj, newMap); // store the new reference before looping to avoid infinite loop

        // have to be careful what methods are used because of IE11 (Map has no polyfills)
        obj.forEach((value, key) => {
          const newKey = sanitize(key);

          if (key === undefined || newKey !== undefined) {
            newMap.set(newKey, sanitize(value));
          }
        });

        return newMap;
      }
      case 'Set': {
        const newSet = new Set();

        referenceMap.set(obj, newSet); // store the new reference before looping to avoid infinite loop

        // have to be careful what methods are used because of IE11 (Set has no polyfills)
        obj.forEach(value => {
          const newValue = sanitize(value);

          if (value === undefined || newValue !== undefined) {
            newSet.add(newValue);
          }
        });

        return newSet;
      }
      default:
        return undefined; // obj is not structured-clone-friendly (like a function, for example)
    }
  }

  return sanitize(obj);
};