'use strict';
const ip = require('ip');

module.exports = (options) => {
  let remoteIpName = 'remoteIp';
  let isPrivateIpName;
  let trustedHeaderSequence = ['x-forwarded-for', 'x-real-ip'];

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }

  if(options && typeof options === 'object'){
    if(isNonEmptyString(options.remoteIpName)){
      remoteIpName = options.remoteIpName;
    }
    if(isNonEmptyString(options.isPrivateIpName)){
      isPrivateIpName = options.isPrivateIpName;
    }
    if(options.trustedHeaderSequence instanceof Array){
      trustedHeaderSequence = options.trustedHeaderSequence.map(c => c.toLowerCase())
    }
  }

  return (req, res, next) => {
    let ipFromHeader;

    for(let field of trustedHeaderSequence){
      if(typeof req.headers[field] === 'string'){
        ipFromHeader = req.headers[field].split(', ')[0];
        break;
      }
    }

    req[remoteIpName] = ipFromHeader ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if(isPrivateIpName){
      req[isPrivateIpName] = ip.isPrivate(req[remoteIpName]);
    }

    next();
  }
}