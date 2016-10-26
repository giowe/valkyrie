'use strict';

module.exports = class Utils {
  static forEach(arr, fn) {
    let i = 0;
    const len = arr.length;
    while (i < len) {
      fn (arr[i], i);
      i++;
    }
  };

  static decodeURIParam(param) {
    try { return decodeURIComponent(param); }
    catch (err) { return err.toString() }
  };

  static joinUrls(url1, url2) {
    if (!url1) return url2;
    else if (!url2) return url1;
    else if ((url1.slice(-1) === '/' && url2[0] !== '/') || (url1.slice(-1) !== '/' && url2[0] === '/')) return `${url1}${url2}`;
    else if ( url1.slice(-1) === '/' && url2[0] === '/') return `${url1}${url2.substr(1, url2.length-1)}`;
    else if ( url1.slice(-1) !== '/' && url2[0] !== '/') return `${url1}/${url2}`;
  }
};