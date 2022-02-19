(function(global, define) {

  // define module and also export to global
  define(function (require, exports, module) {
    return function (str) {
        return (new DOMParser()).parseFromString(str, 'text/xml');
    }
  });  

}( this, // refers to global
   // Help Node out by setting up define.
   typeof module === 'object' && typeof define !== 'function'
     ? function (factory) { module.exports = factory(require, exports, module); } 
     // eslint-disable-next-line no-undef
     : define
));

  