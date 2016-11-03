'use strict';

const Utils = require('./Utils');
const Route = require('./Route');

const _supportedHttpMethods = [
  'all', 'checkout', 'copy', 'delete', 'get', 'head', 'lock',
  'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify',
  'options', 'patch', 'post', 'purge', 'put', 'report',
  'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'
];

const _defaultSettings =  {
  sensitive: false, //When true the path will be case sensitive
  strict: false,    //When false the trailing slash is optional
  end: true,        //When false the path will match at the beginning
  delimiter: '/'    //Set the default delimiter for repeat parameters
};

module.exports = class Router {
  constructor(settings) {
    this.settings = Object.assign({}, _defaultSettings, settings);
    this.stack = [];
    this.mountpath = '';
    this.parent = null;
    this.stackIndex = null;

    Utils.forEach(_supportedHttpMethods, httpMethod => {
      this[httpMethod] = (path, fn) => this.use(httpMethod, path, fn);
    });

    return this;
  }

  use(httpMethods, path, chainable) {
    if (typeof path === 'undefined' && typeof chainable === 'undefined') {
      chainable  = httpMethods;
      httpMethods = 'ALL';
      path       = '*';
    } else if (typeof chainable === 'undefined') {
      chainable  = path;
      path       = httpMethods;
      httpMethods = 'ALL';
    }

    if (typeof httpMethods === 'string')  httpMethods = httpMethods.toUpperCase();
    else if (Array.isArray(httpMethods)) Utils.forEach(httpMethods, (httpMethod, i) => httpMethods[i] = httpMethod.toUpperCase());

    switch (chainable.constructor.name) {
      case 'Function':
        new Route(httpMethods, path, chainable).addToStack(this);
        break;

      case 'Application':
      case 'Router':
        //TODO valutare come passare l'http method
        chainable.addToStack(this, path);
        break;
    }
  };

  addToStack(parent, prefix){
    this.mountpath = prefix;
    this.parent = parent;
    this.stackIndex = parent.stack.length;
    parent.stack.push(this);
    return this;
  }

  getNextRoute(req, res, fromIndex){
    const l = this.stack.length;
    for (let i = fromIndex; i < l; i++) {
      const chainable = this.stack[i];

      let route;
      switch (chainable.constructor.name) {
        case 'Route':
          route = chainable.matchRequest(req, this.settings);
          break;
        case 'Application':
        case 'Router': {
          route = chainable.getNextRoute(req, res, 0);
          break;
        }
      }
      if (route) return route;
    }

    if (this.parent) {
      const route = this.parent.getNextRoute(req, res, this.stackIndex + 1);
      if (route) return route;
    }

    return null;
  }

  describe(level) {
    if (typeof level !== 'number') level = 0;
    let indent = '';
    for (let i = 0; i < level; i++) indent += '│  ';
    console.log(`${indent}${this.constructor.name} [${this.stackIndex}] ${this.mountpath}`);

    const l = this.stack.length;
    Utils.forEach(this.stack, (chainable, i) => {
      const type = chainable.constructor.name;
      const frame = i < l-1 || level !== 0? '├─ ' : '└─ ';
      if (type !== 'Route') chainable.describe(level+1);
      else console.log(`${indent}${frame}${type} (${chainable.stackIndex}) ${chainable.httpMethod} ${chainable.path}`);
    });
  }
};
