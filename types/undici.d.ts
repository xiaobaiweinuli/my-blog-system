declare global {
  // eslint-disable-next-line no-unused-vars
  interface RequestInit {
    dispatcher?: import('undici').Dispatcher;
  }
}

// This file needs to be a module, so we export an empty object.
export {};
