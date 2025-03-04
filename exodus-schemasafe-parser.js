(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.parser = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// browserify browserify-export.js --standalone schemasafe -o exodus-schemasafe-parser.js

const { parser } = require('@exodus/schemasafe');

module.exports = parser;
},{"@exodus/schemasafe":8}],5:[function(require,module,exports){
'use strict'

const { format, safe, safeand, safenot, safenotor } = require('./safe-format')
const genfun = require('./generate-function')
const { resolveReference, joinPath, getDynamicAnchors, hasKeywords } = require('./pointer')
const formats = require('./formats')
const { toPointer, ...functions } = require('./scope-functions')
const { scopeMethods } = require('./scope-utils')
const { buildName, types, jsHelpers } = require('./javascript')
const { knownKeywords, schemaVersions, knownVocabularies } = require('./known-keywords')
const { initTracing, andDelta, orDelta, applyDelta, isDynamic, inProperties } = require('./tracing')

const noopRegExps = new Set(['^[\\s\\S]*$', '^[\\S\\s]*$', '^[^]*$', '', '.*', '^', '$'])
const primitiveTypes = ['null', 'boolean', 'number', 'integer', 'string']

// for checking schema parts in consume()
const schemaTypes = new Map(
  Object.entries({
    boolean: (arg) => typeof arg === 'boolean',
    array: (arg) => Array.isArray(arg) && Object.getPrototypeOf(arg) === Array.prototype,
    object: (arg) => arg && Object.getPrototypeOf(arg) === Object.prototype,
    finite: (arg) => Number.isFinite(arg),
    natural: (arg) => Number.isInteger(arg) && arg >= 0,
    string: (arg) => typeof arg === 'string',
    jsonval: (arg) => functions.deepEqual(arg, JSON.parse(JSON.stringify(arg))),
  })
)
const isPlainObject = schemaTypes.get('object')
const isSchemaish = (arg) => isPlainObject(arg) || typeof arg === 'boolean'
const deltaEmpty = (delta) => functions.deepEqual(delta, { type: [] })

const schemaIsOlderThan = ($schema, ver) =>
  schemaVersions.indexOf($schema) > schemaVersions.indexOf(`https://json-schema.org/${ver}/schema`)

const schemaIsUnkownOrOlder = ($schema, ver) => {
  const normalized = `${$schema}`.replace(/^http:\/\//, 'https://').replace(/#$/, '')
  if (!schemaVersions.includes(normalized)) return true
  return schemaIsOlderThan(normalized, ver)
}

// Helper methods for semi-structured paths
const propvar = (parent, keyname, inKeys = false, number = false) =>
  Object.freeze({ parent, keyname, inKeys, number }) // property by variable
const propimm = (parent, keyval, checked = false) => Object.freeze({ parent, keyval, checked }) // property by immediate value

const evaluatedStatic = Symbol('evaluatedStatic')
const optDynamic = Symbol('optDynamic')
const optDynAnchors = Symbol('optDynAnchors')
const optRecAnchors = Symbol('optRecAnchors')

const constantValue = (schema) => {
  if (typeof schema === 'boolean') return schema
  if (isPlainObject(schema) && Object.keys(schema).length === 0) return true
  return undefined
}

const refsNeedFullValidation = new Set() // cleared before and after each full compilation
const rootMeta = new Map() // cleared before and after each full compilation
const generateMeta = (root, $schema, enforce, requireSchema) => {
  if ($schema) {
    const version = $schema.replace(/^http:\/\//, 'https://').replace(/#$/, '')
    enforce(schemaVersions.includes(version), 'Unexpected schema version:', version)
    rootMeta.set(root, {
      exclusiveRefs: schemaIsOlderThan(version, 'draft/2019-09'),
      contentValidation: schemaIsOlderThan(version, 'draft/2019-09'),
      dependentUnsupported: schemaIsOlderThan(version, 'draft/2019-09'),
      newItemsSyntax: !schemaIsOlderThan(version, 'draft/2020-12'),
      containsEvaluates: !schemaIsOlderThan(version, 'draft/2020-12'),
      objectContains: !schemaIsOlderThan(version, 'draft/next'),
      bookending: schemaIsOlderThan(version, 'draft/next'),
    })
  } else {
    enforce(!requireSchema, '[requireSchema] $schema is required')
    rootMeta.set(root, {})
  }
}

const compileSchema = (schema, root, opts, scope, basePathRoot = '') => {
  const {
    mode = 'default',
    useDefaults = false,
    removeAdditional = false, // supports additionalProperties: false and additionalItems: false
    includeErrors = false,
    allErrors = false,
    contentValidation,
    dryRun, // unused, just for rest siblings
    lint: lintOnly = false,
    allowUnusedKeywords = opts.mode === 'lax' || opts.mode === 'spec',
    allowUnreachable = opts.mode === 'lax' || opts.mode === 'spec',
    requireSchema = opts.mode === 'strong',
    requireValidation = opts.mode === 'strong',
    requireStringValidation = opts.mode === 'strong',
    forbidNoopValues = opts.mode === 'strong', // e.g. $recursiveAnchor: false (it's false by default)
    complexityChecks = opts.mode === 'strong',
    unmodifiedPrototypes = false, // assumes no mangled Object/Array prototypes
    isJSON = false, // assume input to be JSON, which e.g. makes undefined impossible
    $schemaDefault = null,
    formatAssertion = opts.mode !== 'spec' || schemaIsUnkownOrOlder(root.$schema, 'draft/2019-09'),
    formats: optFormats = {},
    weakFormats = opts.mode !== 'strong',
    extraFormats = false,
    schemas, // always a Map, produced at wrapper
    ...unknown
  } = opts
  const fmts = {
    ...formats.core,
    ...(weakFormats ? formats.weak : {}),
    ...(extraFormats ? formats.extra : {}),
    ...optFormats,
  }
  if (Object.keys(unknown).length !== 0)
    throw new Error(`Unknown options: ${Object.keys(unknown).join(', ')}`)

  if (!['strong', 'lax', 'default', 'spec'].includes(mode)) throw new Error(`Invalid mode: ${mode}`)
  if (!includeErrors && allErrors) throw new Error('allErrors requires includeErrors to be enabled')
  if (requireSchema && $schemaDefault) throw new Error('requireSchema forbids $schemaDefault')
  if (mode === 'strong') {
    const validation = { requireValidation, requireStringValidation }
    const strong = { ...validation, formatAssertion, complexityChecks, requireSchema }
    const weak = { weakFormats, allowUnusedKeywords }
    for (const [k, v] of Object.entries(strong)) if (!v) throw new Error(`Strong mode demands ${k}`)
    for (const [k, v] of Object.entries(weak)) if (v) throw new Error(`Strong mode forbids ${k}`)
  }

  const { gensym, getref, genref, genformat } = scopeMethods(scope)

  const buildPath = (prop) => {
    const path = []
    let curr = prop
    while (curr) {
      if (!curr.name) path.unshift(curr)
      curr = curr.parent || curr.errorParent
    }

    // fast case when there are no variables inside path
    if (path.every((part) => part.keyval !== undefined))
      return format('%j', toPointer(path.map((part) => part.keyval)))

    // Be very careful while refactoring, this code significantly affects includeErrors performance
    // It attempts to construct fast code presentation for paths, e.g. "#/abc/"+pointerPart(key0)+"/items/"+i0
    const stringParts = ['#']
    const stringJoined = () => {
      const value = stringParts.map(functions.pointerPart).join('/')
      stringParts.length = 0
      return value
    }
    let res = null
    for (const { keyname, keyval, number } of path) {
      if (keyname) {
        if (!number) scope.pointerPart = functions.pointerPart
        const value = number ? keyname : format('pointerPart(%s)', keyname)
        const str = `${stringJoined()}/`
        res = res ? format('%s+%j+%s', res, str, value) : format('%j+%s', str, value)
      } else if (keyval) stringParts.push(keyval)
    }
    return stringParts.length > 0 ? format('%s+%j', res, `/${stringJoined()}`) : res
  }

  const funname = genref(schema)
  let validate = null // resolve cyclic dependencies
  const wrap = (...args) => {
    const res = validate(...args)
    wrap.errors = validate.errors
    return res
  }
  scope[funname] = wrap

  const hasRefs = hasKeywords(schema, ['$ref', '$recursiveRef', '$dynamicRef'])
  const hasDynAnchors = opts[optDynAnchors] && hasRefs && hasKeywords(schema, ['$dynamicAnchor'])
  const dynAnchorsHead = () => {
    if (!opts[optDynAnchors]) return format('')
    return hasDynAnchors ? format(', dynAnchors = []') : format(', dynAnchors')
  }
  const recAnchorsHead = opts[optRecAnchors] ? format(', recursive') : format('')

  const fun = genfun()
  fun.write('function validate(data%s%s) {', recAnchorsHead, dynAnchorsHead())
  if (includeErrors) fun.write('validate.errors = null')
  if (allErrors) fun.write('let errorCount = 0')
  if (opts[optDynamic]) fun.write('validate.evaluatedDynamic = null')

  let dynamicAnchorsNext = opts[optDynAnchors] ? format(', dynAnchors') : format('')
  if (hasDynAnchors) {
    fun.write('const dynLocal = [{}]')
    dynamicAnchorsNext = format(', [...dynAnchors, dynLocal[0] || []]')
  }

  const helpers = jsHelpers(fun, scope, propvar, { unmodifiedPrototypes, isJSON }, noopRegExps)
  const { present, forObjectKeys, forArray, patternTest, compare } = helpers

  const recursiveLog = []
  const getMeta = () => rootMeta.get(root)
  const basePathStack = basePathRoot ? [basePathRoot] : []
  const visit = (errors, history, current, node, schemaPath, trace = {}, { constProp } = {}) => {
    // e.g. top-level data and property names, OR already checked by present() in history, OR in keys and not undefined
    const isSub = history.length > 0 && history[history.length - 1].prop === current
    const queryCurrent = () => history.filter((h) => h.prop === current)
    const definitelyPresent =
      !current.parent || current.checked || (current.inKeys && isJSON) || queryCurrent().length > 0

    const name = buildName(current)
    const currPropImm = (...args) => propimm(current, ...args)

    const error = ({ path = [], prop = current, source, suberr }) => {
      const schemaP = toPointer([...schemaPath, ...path])
      const dataP = includeErrors ? buildPath(prop) : null
      if (includeErrors === true && errors && source) {
        // we can include absoluteKeywordLocation later, perhaps
        scope.errorMerge = functions.errorMerge
        const args = [source, schemaP, dataP]
        if (allErrors) {
          fun.write('if (validate.errors === null) validate.errors = []')
          fun.write('validate.errors.push(...%s.map(e => errorMerge(e, %j, %s)))', ...args)
        } else fun.write('validate.errors = [errorMerge(%s[0], %j, %s)]', ...args)
      } else if (includeErrors === true && errors) {
        const errorJS = format('{ keywordLocation: %j, instanceLocation: %s }', schemaP, dataP)
        if (allErrors) {
          fun.write('if (%s === null) %s = []', errors, errors)
          fun.write('%s.push(%s)', errors, errorJS)
        } else fun.write('%s = [%s]', errors, errorJS) // Array assignment is significantly faster, do not refactor the two branches
      }
      if (suberr) mergeerror(suberr) // can only happen in allErrors
      if (allErrors) fun.write('errorCount++')
      else fun.write('return false')
    }
    const errorIf = (condition, errorArgs) => fun.if(condition, () => error(errorArgs))

    if (lintOnly && !scope.lintErrors) scope.lintErrors = [] // we can do this as we don't build functions in lint-only mode
    const fail = (msg, value) => {
      const comment = value !== undefined ? ` ${JSON.stringify(value)}` : ''
      const keywordLocation = joinPath(basePathRoot, toPointer(schemaPath))
      const message = `${msg}${comment} at ${keywordLocation}`
      if (lintOnly) return scope.lintErrors.push({ message, keywordLocation, schema }) // don't fail if we are just collecting all errors
      throw new Error(message)
    }
    const patternTestSafe = (pat, key) => {
      try {
        return patternTest(pat, key)
      } catch (e) {
        fail(e.message)
        return format('false') // for lint-only mode
      }
    }
    const enforce = (ok, ...args) => ok || fail(...args)
    const laxMode = (ok, ...args) => enforce(mode === 'lax' || mode === 'spec' || ok, ...args)
    const enforceMinMax = (a, b) => laxMode(!(node[b] < node[a]), `Invalid ${a} / ${b} combination`)
    const enforceValidation = (msg, suffix = 'should be specified') =>
      enforce(!requireValidation, `[requireValidation] ${msg} ${suffix}`)
    const subPath = (...args) => [...schemaPath, ...args]
    const uncertain = (msg) =>
      enforce(!removeAdditional && !useDefaults, `[removeAdditional/useDefaults] uncertain: ${msg}`)
    const complex = (msg, arg) => enforce(!complexityChecks, `[complexityChecks] ${msg}`, arg)
    const saveMeta = ($sch) => generateMeta(root, $sch || $schemaDefault, enforce, requireSchema)

    // evaluated tracing
    const stat = initTracing()
    const evaluateDelta = (delta) => applyDelta(stat, delta)

    if (typeof node === 'boolean') {
      if (node === true) {
        enforceValidation('schema = true', 'is not allowed') // any is valid here
        return { stat } // nothing is evaluated for true
      }
      errorIf(definitelyPresent || current.inKeys ? true : present(current), {}) // node === false
      evaluateDelta({ type: [] }) // everything is evaluated for false
      return { stat }
    }

    enforce(isPlainObject(node), 'Schema is not an object')
    for (const key of Object.keys(node))
      enforce(knownKeywords.includes(key) || allowUnusedKeywords, 'Keyword not supported:', key)

    if (Object.keys(node).length === 0) {
      enforceValidation('empty rules node', 'is not allowed')
      return { stat } // nothing to validate here, basically the same as node === true
    }

    const unused = new Set(Object.keys(node))
    const multiConsumable = new Set()
    const consume = (prop, ...ruleTypes) => {
      enforce(multiConsumable.has(prop) || unused.has(prop), 'Unexpected double consumption:', prop)
      enforce(functions.hasOwn(node, prop), 'Is not an own property:', prop)
      enforce(ruleTypes.every((t) => schemaTypes.has(t)), 'Invalid type used in consume')
      enforce(ruleTypes.some((t) => schemaTypes.get(t)(node[prop])), 'Unexpected type for', prop)
      unused.delete(prop)
    }
    const get = (prop, ...ruleTypes) => {
      if (node[prop] !== undefined) consume(prop, ...ruleTypes)
      return node[prop]
    }
    const handle = (prop, ruleTypes, handler, errorArgs = {}) => {
      if (node[prop] === undefined) return false
      // opt-out on null is explicit in both places here, don't set default
      consume(prop, ...ruleTypes)
      if (handler !== null) {
        try {
          const condition = handler(node[prop])
          if (condition !== null) errorIf(condition, { path: [prop], ...errorArgs })
        } catch (e) {
          if (lintOnly && !e.message.startsWith('[opt] ')) {
            fail(e.message) // for lint-only mode, but not processing special re-run errors
          } else {
            throw e
          }
        }
      }
      return true
    }

    if (node === root) {
      saveMeta(get('$schema', 'string'))
      handle('$vocabulary', ['object'], ($vocabulary) => {
        for (const [vocab, flag] of Object.entries($vocabulary)) {
          if (flag === false) continue
          enforce(flag === true && knownVocabularies.includes(vocab), 'Unknown vocabulary:', vocab)
        }
        return null
      })
    } else if (!getMeta()) saveMeta(root.$schema)

    if (getMeta().objectContains) {
      // When object contains is enabled, contains-related keywords can be consumed two times: in object branch and in array branch
      for (const prop of ['contains', 'minContains', 'maxContains']) multiConsumable.add(prop)
    }

    handle('examples', ['array'], null) // unused, meta-only
    handle('example', ['jsonval'], null) // unused, meta-only, OpenAPI
    for (const ignore of ['title', 'description', '$comment']) handle(ignore, ['string'], null) // unused, meta-only strings
    for (const ignore of ['deprecated', 'readOnly', 'writeOnly']) handle(ignore, ['boolean'], null) // unused, meta-only flags

    handle('$defs', ['object'], null) || handle('definitions', ['object'], null) // defs are allowed, those are validated on usage

    const compileSub = (sub, subR, path) =>
      sub === schema ? safe('validate') : getref(sub) || compileSchema(sub, subR, opts, scope, path)
    const basePath = () => (basePathStack.length > 0 ? basePathStack[basePathStack.length - 1] : '')
    const basePathStackLength = basePathStack.length // to restore at exit
    const setId = ($id) => {
      basePathStack.push(joinPath(basePath(), $id))
      return null
    }

    // None of the below should be handled if an exlusive pre-2019-09 $ref is present
    if (!getMeta().exclusiveRefs || !node.$ref) {
      handle('$id', ['string'], setId) || handle('id', ['string'], setId)
      handle('$anchor', ['string'], null) // $anchor is used only for ref resolution, on usage
      handle('$dynamicAnchor', ['string'], null) // handled separately and on ref resolution

      if (node.$recursiveAnchor || !forbidNoopValues) {
        handle('$recursiveAnchor', ['boolean'], (isRecursive) => {
          if (isRecursive) recursiveLog.push([node, root, basePath()])
          return null
        })
      }
    }

    // handle schema-wide dynamic anchors
    const isDynScope = hasDynAnchors && (node === schema || node.id || node.$id)
    if (isDynScope) {
      const allDynamic = getDynamicAnchors(node)
      if (node !== schema) fun.write('dynLocal.unshift({})') // inlined at top level
      for (const [key, subcheck] of allDynamic) {
        const resolved = resolveReference(root, schemas, `#${key}`, basePath())
        const [sub, subRoot, path] = resolved[0] || []
        enforce(sub === subcheck, `Unexpected $dynamicAnchor resolution: ${key}`)
        const n = compileSub(sub, subRoot, path)
        fun.write('dynLocal[0][%j] = %s', `#${key}`, n)
      }
    }

    // evaluated: declare dynamic
    const needUnevaluated = (rule) =>
      opts[optDynamic] && (node[rule] || node[rule] === false || node === schema)
    const local = Object.freeze({
      item: needUnevaluated('unevaluatedItems') ? gensym('evaluatedItem') : null,
      items: needUnevaluated('unevaluatedItems') ? gensym('evaluatedItems') : null,
      props: needUnevaluated('unevaluatedProperties') ? gensym('evaluatedProps') : null,
    })
    const dyn = Object.freeze({
      item: local.item || trace.item,
      items: local.items || trace.items,
      props: local.props || trace.props,
    })
    const canSkipDynamic = () =>
      (!dyn.items || stat.items === Infinity) && (!dyn.props || stat.properties.includes(true))
    const evaluateDeltaDynamic = (delta) => {
      // Skips applying those that have already been proved statically
      if (dyn.item && delta.item && stat.items !== Infinity)
        fun.write('%s.push(%s)', dyn.item, delta.item)
      if (dyn.items && delta.items > stat.items) fun.write('%s.push(%d)', dyn.items, delta.items)
      if (dyn.props && (delta.properties || []).includes(true) && !stat.properties.includes(true)) {
        fun.write('%s[0].push(true)', dyn.props)
      } else if (dyn.props) {
        const inStat = (properties, patterns) => inProperties(stat, { properties, patterns })
        const properties = (delta.properties || []).filter((x) => !inStat([x], []))
        const patterns = (delta.patterns || []).filter((x) => !inStat([], [x]))
        if (properties.length > 0) fun.write('%s[0].push(...%j)', dyn.props, properties)
        if (patterns.length > 0) fun.write('%s[1].push(...%j)', dyn.props, patterns)
        for (const sym of delta.propertiesVars || []) fun.write('%s[0].push(%s)', dyn.props, sym)
      }
    }
    const applyDynamicToDynamic = (target, item, items, props) => {
      if (isDynamic(stat).items && target.item && item)
        fun.write('%s.push(...%s)', target.item, item)
      if (isDynamic(stat).items && target.items && items)
        fun.write('%s.push(...%s)', target.items, items)
      if (isDynamic(stat).properties && target.props && props) {
        fun.write('%s[0].push(...%s[0])', target.props, props)
        fun.write('%s[1].push(...%s[1])', target.props, props)
      }
    }

    const makeRecursive = () => {
      if (!opts[optRecAnchors]) return format('') // recursive anchors disabled
      if (recursiveLog.length === 0) return format(', recursive') // no recursive default, i.e. no $recursiveAnchor has been set in this schema
      return format(', recursive || %s', compileSub(...recursiveLog[0]))
    }
    const applyRef = (n, errorArgs) => {
      // evaluated: propagate static from ref to current, skips cyclic.
      // Can do this before the call as the call is just a write
      const delta = (scope[n] && scope[n][evaluatedStatic]) || { unknown: true } // assume unknown if ref is cyclic
      evaluateDelta(delta)
      const call = format('%s(%s%s%s)', n, name, makeRecursive(), dynamicAnchorsNext)
      if (!includeErrors && canSkipDynamic()) return format('!%s', call) // simple case
      const res = gensym('res')
      const err = gensym('err') // Save and restore errors in case of recursion (if needed)
      const suberr = gensym('suberr')
      if (includeErrors) fun.write('const %s = validate.errors', err)
      fun.write('const %s = %s', res, call)
      if (includeErrors) fun.write('const %s = %s.errors', suberr, n)
      if (includeErrors) fun.write('validate.errors = %s', err)
      errorIf(safenot(res), { ...errorArgs, source: suberr })
      // evaluated: propagate dynamic from ref to current
      fun.if(res, () => {
        const item = isDynamic(delta).items ? format('%s.evaluatedDynamic[0]', n) : null
        const items = isDynamic(delta).items ? format('%s.evaluatedDynamic[1]', n) : null
        const props = isDynamic(delta).properties ? format('%s.evaluatedDynamic[2]', n) : null
        applyDynamicToDynamic(dyn, item, items, props)
      })

      return null
    }

    /* Preparation and methods, post-$ref validation will begin at the end of the function */

    // This is used for typechecks, null means * here
    const allIn = (arr, valid) => arr && arr.every((s) => valid.includes(s)) // all arr entries are in valid
    const someIn = (arr, possible) => possible.some((x) => arr === null || arr.includes(x)) // all possible are in arrs

    const parentCheckedType = (...valid) => queryCurrent().some((h) => allIn(h.stat.type, valid))
    const definitelyType = (...valid) => allIn(stat.type, valid) || parentCheckedType(...valid)
    const typeApplicable = (...possible) =>
      someIn(stat.type, possible) && queryCurrent().every((h) => someIn(h.stat.type, possible))

    const enforceRegex = (source, target = node) => {
      enforce(typeof source === 'string', 'Invalid pattern:', source)
      if (requireValidation || requireStringValidation)
        enforce(/^\^.*\$$/.test(source), 'Should start with ^ and end with $:', source)
      if (/([{+*].*[{+*]|\)[{+*]|^[^^].*[{+*].)/.test(source) && target.maxLength === undefined)
        complex('maxLength should be specified for pattern:', source)
    }

    // Those checks will need to be skipped if another error is set in this block before those ones
    const havePattern = node.pattern && !noopRegExps.has(node.pattern) // we won't generate code for noop
    const haveComplex = node.uniqueItems || havePattern || node.patternProperties || node.format
    const prev = allErrors && haveComplex ? gensym('prev') : null
    const prevWrap = (shouldWrap, writeBody) =>
      fun.if(shouldWrap && prev !== null ? format('errorCount === %s', prev) : true, writeBody)

    const nexthistory = () => [...history, { stat, prop: current }]
    // Can not be used before undefined check! The one performed by present()
    const rule = (...args) => visit(errors, nexthistory(), ...args).stat
    const subrule = (suberr, ...args) => {
      if (args[0] === current) {
        const constval = constantValue(args[1])
        if (constval === true) return { sub: format('true'), delta: {} }
        if (constval === false) return { sub: format('false'), delta: { type: [] } }
      }
      const sub = gensym('sub')
      fun.write('const %s = (() => {', sub)
      if (allErrors) fun.write('let errorCount = 0') // scoped error counter
      const { stat: delta } = visit(suberr, nexthistory(), ...args)
      if (allErrors) {
        fun.write('return errorCount === 0')
      } else fun.write('return true')
      fun.write('})()')
      return { sub, delta }
    }

    const suberror = () => {
      const suberr = includeErrors && allErrors ? gensym('suberr') : null
      if (suberr) fun.write('let %s = null', suberr)
      return suberr
    }
    const mergeerror = (suberr) => {
      if (errors === null || suberr === null) return // suberror can be null e.g. on failed empty contains, errors can be null in e.g. not or if
      fun.if(suberr, () => fun.write('%s.push(...%s)', errors, suberr))
    }

    // Extracted single additional(Items/Properties) rules, for reuse with unevaluated(Items/Properties)
    const willRemoveAdditional = () => {
      if (!removeAdditional) return false
      if (removeAdditional === true) return true
      if (removeAdditional === 'keyword') {
        if (!node.removeAdditional) return false
        consume('removeAdditional', 'boolean')
        return true
      }
      throw new Error(`Invalid removeAdditional: ${removeAdditional}`)
    }
    const additionalItems = (rulePath, limit, extra) => {
      const handled = handle(rulePath, ['object', 'boolean'], (ruleValue) => {
        if (ruleValue === false && willRemoveAdditional()) {
          fun.write('if (%s.length > %s) %s.length = %s', name, limit, name, limit)
          return null
        }
        if (ruleValue === false && !extra) return format('%s.length > %s', name, limit)
        forArray(current, limit, (prop, i) => {
          if (extra) fun.write('if (%s) continue', extra(i))
          return rule(prop, ruleValue, subPath(rulePath))
        })
        return null
      })
      if (handled) evaluateDelta({ items: Infinity })
    }
    const additionalProperties = (rulePath, condition) => {
      const handled = handle(rulePath, ['object', 'boolean'], (ruleValue) => {
        forObjectKeys(current, (sub, key) => {
          fun.if(condition(key), () => {
            if (ruleValue === false && willRemoveAdditional()) fun.write('delete %s[%s]', name, key)
            else rule(sub, ruleValue, subPath(rulePath))
          })
        })
        return null
      })
      if (handled) evaluateDelta({ properties: [true] })
    }
    const additionalCondition = (key, properties, patternProperties) =>
      safeand(
        ...properties.map((p) => format('%s !== %j', key, p)),
        ...patternProperties.map((p) => safenot(patternTestSafe(p, key)))
      )
    const lintRequired = (properties, patterns) => {
      const regexps = patterns.map((p) => new RegExp(p, 'u'))
      const known = (key) => properties.includes(key) || regexps.some((r) => r.test(key))
      for (const key of stat.required) enforce(known(key), `Unknown required property:`, key)
    }
    const finalLint = []

    /* Checks inside blocks are independent, they are happening on the same code depth */

    const checkNumbers = () => {
      const minMax = (value, operator) => format('!(%d %c %s)', value, operator, name) // don't remove negation, accounts for NaN

      if (Number.isFinite(node.exclusiveMinimum)) {
        handle('exclusiveMinimum', ['finite'], (min) => minMax(min, '<'))
      } else {
        handle('minimum', ['finite'], (min) => minMax(min, node.exclusiveMinimum ? '<' : '<='))
        handle('exclusiveMinimum', ['boolean'], null) // handled above
      }

      if (Number.isFinite(node.exclusiveMaximum)) {
        handle('exclusiveMaximum', ['finite'], (max) => minMax(max, '>'))
        enforceMinMax('minimum', 'exclusiveMaximum')
        enforceMinMax('exclusiveMinimum', 'exclusiveMaximum')
      } else if (node.maximum !== undefined) {
        handle('maximum', ['finite'], (max) => minMax(max, node.exclusiveMaximum ? '>' : '>='))
        handle('exclusiveMaximum', ['boolean'], null) // handled above
        enforceMinMax('minimum', 'maximum')
        enforceMinMax('exclusiveMinimum', 'maximum')
      }

      const multipleOf = node.multipleOf === undefined ? 'divisibleBy' : 'multipleOf' // draft3 support
      handle(multipleOf, ['finite'], (value) => {
        enforce(value > 0, `Invalid ${multipleOf}:`, value)
        const [part, exp] = `${value}`.split('e-')
        const frac = `${part}.`.split('.')[1]
        const e = frac.length + (exp ? Number(exp) : 0)
        if (Number.isInteger(value * 2 ** e)) return format('%s %% %d !== 0', name, value) // exact
        scope.isMultipleOf = functions.isMultipleOf
        const args = [name, value, e, Math.round(value * Math.pow(10, e))] // precompute for performance
        return format('!isMultipleOf(%s, %d, 1e%d, %d)', ...args)
      })
    }

    const checkStrings = () => {
      handle('maxLength', ['natural'], (max) => {
        scope.stringLength = functions.stringLength
        return format('%s.length > %d && stringLength(%s) > %d', name, max, name, max)
      })
      handle('minLength', ['natural'], (min) => {
        scope.stringLength = functions.stringLength
        return format('%s.length < %d || stringLength(%s) < %d', name, min, name, min)
      })
      enforceMinMax('minLength', 'maxLength')

      prevWrap(true, () => {
        const checkFormat = (fmtname, target, formatsObj = fmts) => {
          const known = typeof fmtname === 'string' && functions.hasOwn(formatsObj, fmtname)
          enforce(known, 'Unrecognized format used:', fmtname)
          const formatImpl = formatsObj[fmtname]
          const valid = formatImpl instanceof RegExp || typeof formatImpl === 'function'
          enforce(valid, 'Invalid format used:', fmtname)
          if (!formatAssertion) return null
          if (formatImpl instanceof RegExp) {
            // built-in formats are fine, check only ones from options
            if (functions.hasOwn(optFormats, fmtname)) enforceRegex(formatImpl.source)
            return format('!%s.test(%s)', genformat(formatImpl), target)
          }
          return format('!%s(%s)', genformat(formatImpl), target)
        }

        handle('format', ['string'], (value) => {
          evaluateDelta({ fullstring: true })
          return checkFormat(value, name)
        })

        handle('pattern', ['string'], (pattern) => {
          enforceRegex(pattern)
          evaluateDelta({ fullstring: true })
          return noopRegExps.has(pattern) ? null : safenot(patternTestSafe(pattern, name))
        })

        enforce(node.contentSchema !== false, 'contentSchema cannot be set to false')
        const cV = contentValidation === undefined ? getMeta().contentValidation : contentValidation
        const haveContent = node.contentEncoding || node.contentMediaType || node.contentSchema
        const contentErr =
          '"content*" keywords are disabled by default per spec, enable with { contentValidation = true } option (see doc/Options.md for more info)'
        enforce(!haveContent || cV || allowUnusedKeywords, contentErr)
        if (haveContent && cV) {
          const dec = gensym('dec')
          if (node.contentMediaType) fun.write('let %s = %s', dec, name)

          if (node.contentEncoding === 'base64') {
            errorIf(checkFormat('base64', name, formats.extra), { path: ['contentEncoding'] })
            if (node.contentMediaType) {
              scope.deBase64 = functions.deBase64
              fun.write('try {')
              fun.write('%s = deBase64(%s)', dec, dec)
            }
            consume('contentEncoding', 'string')
          } else enforce(!node.contentEncoding, 'Unknown contentEncoding:', node.contentEncoding)

          let json = false
          if (node.contentMediaType === 'application/json') {
            fun.write('try {')
            fun.write('%s = JSON.parse(%s)', dec, dec)
            json = true
            consume('contentMediaType', 'string')
          } else enforce(!node.contentMediaType, 'Unknown contentMediaType:', node.contentMediaType)

          if (node.contentSchema) {
            enforce(json, 'contentSchema requires contentMediaType application/json')
            const decprop = Object.freeze({ name: dec, errorParent: current })
            rule(decprop, node.contentSchema, subPath('contentSchema')) // TODO: isJSON true for speed?
            consume('contentSchema', 'object', 'array')
            evaluateDelta({ fullstring: true })
          }
          if (node.contentMediaType) {
            fun.write('} catch (e) {')
            error({ path: ['contentMediaType'] })
            fun.write('}')
            if (node.contentEncoding) {
              fun.write('} catch (e) {')
              error({ path: ['contentEncoding'] })
              fun.write('}')
            }
          }
        }
      })
    }

    const checkArrays = () => {
      handle('maxItems', ['natural'], (max) => {
        const prefixItemsName = getMeta().newItemsSyntax ? 'prefixItems' : 'items'
        if (Array.isArray(node[prefixItemsName]) && node[prefixItemsName].length > max)
          fail(`Invalid maxItems: ${max} is less than ${prefixItemsName} array length`)
        return format('%s.length > %d', name, max)
      })
      handle('minItems', ['natural'], (min) => format('%s.length < %d', name, min)) // can be higher that .items length with additionalItems
      enforceMinMax('minItems', 'maxItems')

      const checkItemsArray = (items) => {
        for (let p = 0; p < items.length; p++) rule(currPropImm(p), items[p], subPath(`${p}`))
        evaluateDelta({ items: items.length })
        return null
      }
      if (getMeta().newItemsSyntax) {
        handle('prefixItems', ['array'], checkItemsArray)
        additionalItems('items', format('%d', (node.prefixItems || []).length))
      } else if (Array.isArray(node.items)) {
        handle('items', ['array'], checkItemsArray)
        additionalItems('additionalItems', format('%d', node.items.length))
      } else {
        handle('items', ['object', 'boolean'], (items) => {
          forArray(current, format('0'), (prop) => rule(prop, items, subPath('items')))
          evaluateDelta({ items: Infinity })
          return null
        })
        // If items is not an array, additionalItems is allowed, but ignored per some spec tests!
        // We do nothing and let it throw except for in allowUnusedKeywords mode
        // As a result, omitting .items is not allowed by default, only in allowUnusedKeywords mode
      }

      checkContains((run) => {
        forArray(current, format('0'), (prop, i) => {
          run(prop, () => {
            evaluateDelta({ dyn: { item: true } })
            evaluateDeltaDynamic({ item: i })
          })
        })
      })

      const itemsSimple = (ischema) => {
        if (!isPlainObject(ischema)) return false
        if (ischema.enum || functions.hasOwn(ischema, 'const')) return true
        if (ischema.type) {
          const itemTypes = Array.isArray(ischema.type) ? ischema.type : [ischema.type]
          if (itemTypes.every((itemType) => primitiveTypes.includes(itemType))) return true
        }
        if (ischema.$ref) {
          const [sub] = resolveReference(root, schemas, ischema.$ref, basePath())[0] || []
          if (itemsSimple(sub)) return true
        }
        return false
      }
      const itemsSimpleOrFalse = (ischema) => ischema === false || itemsSimple(ischema)
      const uniqueSimple = () => {
        if (node.maxItems !== undefined || itemsSimpleOrFalse(node.items)) return true
        // In old format, .additionalItems requires .items to have effect
        if (Array.isArray(node.items) && itemsSimpleOrFalse(node.additionalItems)) return true
        return false
      }
      prevWrap(true, () => {
        handle('uniqueItems', ['boolean'], (uniqueItems) => {
          if (uniqueItems === false) return null
          if (!uniqueSimple()) complex('maxItems should be specified for non-primitive uniqueItems')
          Object.assign(scope, { unique: functions.unique, deepEqual: functions.deepEqual })
          return format('!unique(%s)', name)
        })
      })
    }

    // if allErrors is false, we can skip present check for required properties validated before
    const checked = (p) =>
      !allErrors &&
      (stat.required.includes(p) || queryCurrent().some((h) => h.stat.required.includes(p)))

    const checkObjects = () => {
      const propertiesCount = format('Object.keys(%s).length', name)
      handle('maxProperties', ['natural'], (max) => format('%s > %d', propertiesCount, max))
      handle('minProperties', ['natural'], (min) => format('%s < %d', propertiesCount, min))
      enforceMinMax('minProperties', 'maxProperties')

      handle('propertyNames', ['object', 'boolean'], (s) => {
        forObjectKeys(current, (sub, key) => {
          // Add default type for non-ref schemas, so strong mode is fine with omitting it
          const nameSchema = typeof s === 'object' && !s.$ref ? { type: 'string', ...s } : s
          const nameprop = Object.freeze({ name: key, errorParent: sub, type: 'string' })
          rule(nameprop, nameSchema, subPath('propertyNames'))
        })
        return null
      })

      handle('required', ['array'], (required) => {
        for (const req of required) {
          if (checked(req)) continue
          const prop = currPropImm(req)
          errorIf(safenot(present(prop)), { path: ['required'], prop })
        }
        evaluateDelta({ required })
        return null
      })

      for (const dependencies of ['dependencies', 'dependentRequired', 'dependentSchemas']) {
        if (dependencies !== 'dependencies' && getMeta().dependentUnsupported) continue
        handle(dependencies, ['object'], (value) => {
          for (const key of Object.keys(value)) {
            const deps = typeof value[key] === 'string' ? [value[key]] : value[key]
            const item = currPropImm(key, checked(key))
            if (Array.isArray(deps) && dependencies !== 'dependentSchemas') {
              const clauses = deps.filter((k) => !checked(k)).map((k) => present(currPropImm(k)))
              const condition = safenot(safeand(...clauses))
              const errorArgs = { path: [dependencies, key] }
              if (clauses.length === 0) {
                // nothing to do
              } else if (item.checked) {
                errorIf(condition, errorArgs)
                evaluateDelta({ required: deps })
              } else {
                errorIf(safeand(present(item), condition), errorArgs)
              }
            } else if (isSchemaish(deps) && dependencies !== 'dependentRequired') {
              uncertain(dependencies) // TODO: we don't always need this, remove when no uncertainity?
              fun.if(item.checked ? true : present(item), () => {
                const delta = rule(current, deps, subPath(dependencies, key), dyn)
                evaluateDelta(orDelta({}, delta))
                evaluateDeltaDynamic(delta)
              })
            } else fail(`Unexpected ${dependencies} entry`)
          }
          return null
        })
      }

      handle('propertyDependencies', ['object'], (propertyDependencies) => {
        for (const [key, variants] of Object.entries(propertyDependencies)) {
          enforce(isPlainObject(variants), 'propertyDependencies must be an object')
          uncertain('propertyDependencies') // TODO: we don't always need this, remove when no uncertainity?
          const item = currPropImm(key, checked(key))
          // NOTE: would it be useful to also check if it's a string?
          fun.if(item.checked ? true : present(item), () => {
            for (const [val, deps] of Object.entries(variants)) {
              enforce(isSchemaish(deps), 'propertyDependencies must contain schemas')
              fun.if(compare(buildName(item), val), () => {
                // TODO: we already know that we have an object here, optimize?
                const delta = rule(current, deps, subPath('propertyDependencies', key, val), dyn)
                evaluateDelta(orDelta({}, delta))
                evaluateDeltaDynamic(delta)
              })
            }
          })
        }
        return null
      })

      handle('properties', ['object'], (properties) => {
        for (const p of Object.keys(properties)) {
          if (constProp === p) continue // checked in discriminator, avoid double-check
          rule(currPropImm(p, checked(p)), properties[p], subPath('properties', p))
        }
        evaluateDelta({ properties: Object.keys(properties) })
        return null
      })

      prevWrap(node.patternProperties, () => {
        handle('patternProperties', ['object'], (patternProperties) => {
          forObjectKeys(current, (sub, key) => {
            for (const p of Object.keys(patternProperties)) {
              enforceRegex(p, node.propertyNames || {})
              fun.if(patternTestSafe(p, key), () => {
                rule(sub, patternProperties[p], subPath('patternProperties', p))
              })
            }
          })
          evaluateDelta({ patterns: Object.keys(patternProperties) })
          return null
        })
        if (node.additionalProperties || node.additionalProperties === false) {
          const properties = Object.keys(node.properties || {})
          const patternProperties = Object.keys(node.patternProperties || {})
          if (node.additionalProperties === false) {
            // Postpone the check to the end when all nested .required are collected
            finalLint.push(() => lintRequired(properties, patternProperties))
          }
          const condition = (key) => additionalCondition(key, properties, patternProperties)
          additionalProperties('additionalProperties', condition)
        }
      })

      if (getMeta().objectContains) {
        checkContains((run) => {
          forObjectKeys(current, (prop, i) => {
            run(prop, () => {
              evaluateDelta({ dyn: { properties: [true] } })
              evaluateDeltaDynamic({ propertiesVars: [i] })
            })
          })
        })
      }
    }

    const checkConst = () => {
      const handledConst = handle('const', ['jsonval'], (val) => safenot(compare(name, val)))
      if (handledConst && !allowUnusedKeywords) return true // enum can't be present, this is rechecked by allowUnusedKeywords
      const handledEnum = handle('enum', ['array'], (vals) => {
        const objects = vals.filter((value) => value && typeof value === 'object')
        const primitive = vals.filter((value) => !(value && typeof value === 'object'))
        return safenotor(...[...primitive, ...objects].map((value) => compare(name, value)))
      })
      return handledConst || handledEnum
    }

    const checkContains = (iterate) => {
      // This can be called two times, 'object' and 'array' separately
      handle('contains', ['object', 'boolean'], () => {
        uncertain('contains')

        if (getMeta().objectContains && typeApplicable('array') && typeApplicable('object')) {
          enforceValidation("possible type confusion in 'contains',", "forbid 'object' or 'array'")
        }

        const passes = gensym('passes')
        fun.write('let %s = 0', passes)

        const suberr = suberror()
        iterate((prop, evaluate) => {
          const { sub } = subrule(suberr, prop, node.contains, subPath('contains'))
          fun.if(sub, () => {
            fun.write('%s++', passes)
            if (getMeta().containsEvaluates) {
              enforce(!removeAdditional, 'Can\'t use removeAdditional with draft2020+ "contains"')
              evaluate()
            }
          })
        })

        if (!handle('minContains', ['natural'], (mn) => format('%s < %d', passes, mn), { suberr }))
          errorIf(format('%s < 1', passes), { path: ['contains'], suberr })

        handle('maxContains', ['natural'], (max) => format('%s > %d', passes, max))
        enforceMinMax('minContains', 'maxContains')
        return null
      })
    }

    const checkGeneric = () => {
      handle('not', ['object', 'boolean'], (not) => subrule(null, current, not, subPath('not')).sub)
      if (node.not) uncertain('not')

      const thenOrElse = node.then || node.then === false || node.else || node.else === false
      // if we allow lone "if" to be present with allowUnusedKeywords, then we must process it to do the evaluation
      // TODO: perhaps we can optimize this out if dynamic evaluation isn't needed _even with this if processed_
      if (thenOrElse || allowUnusedKeywords)
        handle('if', ['object', 'boolean'], (ifS) => {
          uncertain('if/then/else')
          const { sub, delta: deltaIf } = subrule(null, current, ifS, subPath('if'), dyn)
          let handleElse, handleThen, deltaElse, deltaThen
          handle('else', ['object', 'boolean'], (elseS) => {
            handleElse = () => {
              deltaElse = rule(current, elseS, subPath('else'), dyn)
              evaluateDeltaDynamic(deltaElse)
            }
            return null
          })
          handle('then', ['object', 'boolean'], (thenS) => {
            handleThen = () => {
              deltaThen = rule(current, thenS, subPath('then'), dyn)
              evaluateDeltaDynamic(andDelta(deltaIf, deltaThen))
            }
            return null
          })
          if (!handleThen && !deltaEmpty(deltaIf)) handleThen = () => evaluateDeltaDynamic(deltaIf)
          fun.if(sub, handleThen, handleElse)
          evaluateDelta(orDelta(deltaElse || {}, andDelta(deltaIf, deltaThen || {})))
          return null
        })

      const performAllOf = (allOf, rulePath = 'allOf') => {
        enforce(allOf.length > 0, `${rulePath} cannot be empty`)
        for (const [key, sch] of Object.entries(allOf))
          evaluateDelta(rule(current, sch, subPath(rulePath, key), dyn))
        return null
      }
      handle('allOf', ['array'], (allOf) => performAllOf(allOf))

      let handleDiscriminator = null
      handle('discriminator', ['object'], (discriminator) => {
        const seen = new Set()
        const fix = (check, message, arg) => enforce(check, `[discriminator]: ${message}`, arg)
        const { propertyName: pname, mapping: map, ...e0 } = discriminator
        const prop = currPropImm(pname)
        fix(pname && !node.oneOf !== !node.anyOf, 'need propertyName, oneOf OR anyOf')
        fix(Object.keys(e0).length === 0, 'only "propertyName" and "mapping" are supported')
        const keylen = (obj) => (isPlainObject(obj) ? Object.keys(obj).length : null)
        handleDiscriminator = (branches, ruleName) => {
          const runDiscriminator = () => {
            fun.write('switch (%s) {', buildName(prop)) // we could also have used ifs for complex types
            let delta
            for (const [i, branch] of Object.entries(branches)) {
              const { const: myval, enum: myenum, ...e1 } = (branch.properties || {})[pname] || {}
              let vals = myval !== undefined ? [myval] : myenum
              if (!vals && branch.$ref) {
                const [sub] = resolveReference(root, schemas, branch.$ref, basePath())[0] || []
                enforce(isPlainObject(sub), 'failed to resolve $ref:', branch.$ref)
                const rprop = (sub.properties || {})[pname] || {}
                vals = rprop.const !== undefined ? [rprop.const] : rprop.enum
              }
              const ok1 = Array.isArray(vals) && vals.length > 0
              fix(ok1, 'branches should have unique string const or enum values for [propertyName]')
              const ok2 = Object.keys(e1).length === 0 && (!myval || !myenum)
              fix(ok2, 'only const OR enum rules are allowed on [propertyName] in branches')
              for (const val of vals) {
                const okMapping = !map || (functions.hasOwn(map, val) && map[val] === branch.$ref)
                fix(okMapping, 'mismatching mapping for', val)
                const valok = typeof val === 'string' && !seen.has(val)
                fix(valok, 'const/enum values for [propertyName] should be unique strings')
                seen.add(val)
                fun.write('case %j:', val)
              }
              const subd = rule(current, branch, subPath(ruleName, i), dyn, { constProp: pname })
              evaluateDeltaDynamic(subd)
              delta = delta ? orDelta(delta, subd) : subd
              fun.write('break')
            }
            fix(map === undefined || keylen(map) === seen.size, 'mismatching mapping size')
            evaluateDelta(delta)
            fun.write('default:')
            error({ path: [ruleName] })
            fun.write('}')
          }
          const propCheck = () => {
            if (!checked(pname)) {
              const errorPath = ['discriminator', 'propertyName']
              fun.if(present(prop), runDiscriminator, () => error({ path: errorPath, prop }))
            } else runDiscriminator()
          }
          if (allErrors || !functions.deepEqual(stat.type, ['object'])) {
            fun.if(types.get('object')(name), propCheck, () => error({ path: ['discriminator'] }))
          } else propCheck()
          // can't evaluateDelta on type and required to not break the checks below, but discriminator
          // is usually used with refs anyway so those won't be of much use
          fix(functions.deepEqual(stat.type, ['object']), 'has to be checked for type:', 'object')
          fix(stat.required.includes(pname), 'propertyName should be placed in required:', pname)
          return null
        }
        return null
      })

      // Mark the schema as uncertain if the path taken is not determined solely by the branch type
      const uncertainBranchTypes = (key, arr) => {
        // In general, { const: [] } can interfere with other { type: 'array' }
        // Same for { const: {} } and { type: 'object' }
        // So this check doesn't treat those as non-conflicting, and instead labels those as uncertain conflicts
        const btypes = arr.map((x) => x.type || (Array.isArray(x.const) ? 'array' : typeof x.const)) // typeof can be 'undefined', but we don't care
        const maybeObj = btypes.filter((x) => !primitiveTypes.includes(x) && x !== 'array').length
        const maybeArr = btypes.filter((x) => !primitiveTypes.includes(x) && x !== 'object').length
        if (maybeObj > 1 || maybeArr > 1) uncertain(`${key}, use discriminator to make it certain`)
      }

      handle('anyOf', ['array'], (anyOf) => {
        enforce(anyOf.length > 0, 'anyOf cannot be empty')
        if (anyOf.length === 1) return performAllOf(anyOf)
        if (handleDiscriminator) return handleDiscriminator(anyOf, 'anyOf')
        const suberr = suberror()
        if (!canSkipDynamic()) {
          uncertainBranchTypes('anyOf', anyOf) // const sorting for removeAdditional is not supported in dynamic mode
          // In this case, all have to be checked to gather evaluated properties
          const entries = Object.entries(anyOf).map(([key, sch]) =>
            subrule(suberr, current, sch, subPath('anyOf', key), dyn)
          )
          evaluateDelta(entries.map((x) => x.delta).reduce((acc, cur) => orDelta(acc, cur)))
          errorIf(safenotor(...entries.map(({ sub }) => sub)), { path: ['anyOf'], suberr })
          for (const { delta, sub } of entries) fun.if(sub, () => evaluateDeltaDynamic(delta))
          return null
        }
        // We sort the variants to perform const comparisons first, then primitives/array/object/unknown
        // This way, we can be sure that array/object + removeAdditional do not affect const evaluation
        // Note that this _might_ e.g. remove all elements of an array in a 2nd branch _and_ fail with `const: []` in the 1st, but that's expected behavior
        // This can be done because we can stop on the first match in anyOf if we don't need dynamic evaluation
        const constBlocks = anyOf.filter((x) => functions.hasOwn(x, 'const'))
        const otherBlocks = anyOf.filter((x) => !functions.hasOwn(x, 'const'))
        uncertainBranchTypes('anyOf', otherBlocks)
        const blocks = [...constBlocks, ...otherBlocks]
        let delta

        if (!getMeta().exclusiveRefs) {
          // Under unevaluated* support, we can't optimize out branches using simple rules, see below
          const entries = Object.entries(anyOf).map(([key, sch]) =>
            subrule(suberr, current, sch, subPath('anyOf', key), dyn)
          )
          delta = entries.map((x) => x.delta).reduce((acc, cur) => orDelta(acc, cur))
          errorIf(safenotor(...entries.map(({ sub }) => sub)), { path: ['anyOf'], suberr })
        } else {
          // Optimization logic below isn't stable under unevaluated* presence, as branches can be the sole reason of
          // causing dynamic evaluation, and optimizing them out can miss the `if (!canSkipDynamic()) {` check above
          let body = () => error({ path: ['anyOf'], suberr })
          for (const [key, sch] of Object.entries(blocks).reverse()) {
            const oldBody = body
            body = () => {
              const { sub, delta: deltaVar } = subrule(suberr, current, sch, subPath('anyOf', key))
              fun.if(safenot(sub), oldBody) // this can exclude branches, see note above
              delta = delta ? orDelta(delta, deltaVar) : deltaVar
            }
          }
          body()
        }

        evaluateDelta(delta)
        return null
      })

      handle('oneOf', ['array'], (oneOf) => {
        enforce(oneOf.length > 0, 'oneOf cannot be empty')
        if (oneOf.length === 1) return performAllOf(oneOf)
        if (handleDiscriminator) return handleDiscriminator(oneOf, 'oneOf')
        uncertainBranchTypes('oneOf', oneOf)
        const passes = gensym('passes')
        fun.write('let %s = 0', passes)
        const suberr = suberror()
        let delta
        let i = 0
        const entries = Object.entries(oneOf).map(([key, sch]) => {
          if (!includeErrors && i++ > 1) errorIf(format('%s > 1', passes), { path: ['oneOf'] })
          const entry = subrule(suberr, current, sch, subPath('oneOf', key), dyn)
          fun.if(entry.sub, () => fun.write('%s++', passes))
          delta = delta ? orDelta(delta, entry.delta) : entry.delta
          return entry
        })
        evaluateDelta(delta)
        errorIf(format('%s !== 1', passes), { path: ['oneOf'] })
        fun.if(format('%s === 0', passes), () => mergeerror(suberr)) // if none matched, dump all errors
        for (const entry of entries) fun.if(entry.sub, () => evaluateDeltaDynamic(entry.delta))
        return null
      })
    }

    const typeWrap = (checkBlock, validTypes, queryType) => {
      const [funSize, unusedSize] = [fun.size(), unused.size]
      fun.if(definitelyType(...validTypes) ? true : queryType, checkBlock)
      // enforce check that non-applicable blocks are empty and no rules were applied
      if (funSize !== fun.size() || unusedSize !== unused.size)
        enforce(typeApplicable(...validTypes), `Unexpected rules in type`, node.type)
    }

    // Unevaluated validation
    const checkArraysFinal = () => {
      if (stat.items === Infinity) {
        // Everything is statically evaluated, so this check is unreachable. Allow only 'false' rule here.
        if (node.unevaluatedItems === false) consume('unevaluatedItems', 'boolean')
      } else if (node.unevaluatedItems || node.unevaluatedItems === false) {
        if (isDynamic(stat).items) {
          if (!opts[optDynamic]) throw new Error('[opt] Dynamic unevaluated tracing not enabled')
          const limit = format('Math.max(%d, ...%s)', stat.items, dyn.items)
          const extra = (i) => format('%s.includes(%s)', dyn.item, i)
          additionalItems('unevaluatedItems', limit, getMeta().containsEvaluates ? extra : null)
        } else {
          additionalItems('unevaluatedItems', format('%d', stat.items))
        }
      }
    }
    const checkObjectsFinal = () => {
      prevWrap(stat.patterns.length > 0 || stat.dyn.patterns.length > 0 || stat.unknown, () => {
        if (stat.properties.includes(true)) {
          // Everything is statically evaluated, so this check is unreachable. Allow only 'false' rule here.
          if (node.unevaluatedProperties === false) consume('unevaluatedProperties', 'boolean')
        } else if (node.unevaluatedProperties || node.unevaluatedProperties === false) {
          const notStatic = (key) => additionalCondition(key, stat.properties, stat.patterns)
          if (isDynamic(stat).properties) {
            if (!opts[optDynamic]) throw new Error('[opt] Dynamic unevaluated tracing not enabled')
            scope.propertyIn = functions.propertyIn
            const notDynamic = (key) => format('!propertyIn(%s, %s)', key, dyn.props)
            const condition = (key) => safeand(notStatic(key), notDynamic(key))
            additionalProperties('unevaluatedProperties', condition)
          } else {
            if (node.unevaluatedProperties === false) lintRequired(stat.properties, stat.patterns)
            additionalProperties('unevaluatedProperties', notStatic)
          }
        }
      })
    }

    const performValidation = () => {
      if (prev !== null) fun.write('const %s = errorCount', prev)
      if (checkConst()) {
        const typeKeys = [...types.keys()] // we don't extract type from const/enum, it's enough that we know that it's present
        evaluateDelta({ properties: [true], items: Infinity, type: typeKeys, fullstring: true }) // everything is evaluated for const
        if (!allowUnusedKeywords) {
          // const/enum shouldn't have any other validation rules except for already checked type/$ref
          enforce(unused.size === 0, 'Unexpected keywords mixed with const or enum:', [...unused])
          // If it does though, we should not short-circuit validation. This could be optimized by extracting types, but not significant
          return
        }
      }

      typeWrap(checkNumbers, ['number', 'integer'], types.get('number')(name))
      typeWrap(checkStrings, ['string'], types.get('string')(name))
      typeWrap(checkArrays, ['array'], types.get('array')(name))
      typeWrap(checkObjects, ['object'], types.get('object')(name))

      checkGeneric()

      // evaluated: apply static + dynamic
      typeWrap(checkArraysFinal, ['array'], types.get('array')(name))
      typeWrap(checkObjectsFinal, ['object'], types.get('object')(name))

      for (const lint of finalLint) lint()

      // evaluated: propagate dynamic to parent dynamic (aka trace)
      // static to parent is merged via return value
      applyDynamicToDynamic(trace, local.item, local.items, local.props)
    }

    // main post-presence check validation function
    const writeMain = () => {
      if (local.item) fun.write('const %s = []', local.item)
      if (local.items) fun.write('const %s = [0]', local.items)
      if (local.props) fun.write('const %s = [[], []]', local.props)

      // refs
      handle('$ref', ['string'], ($ref) => {
        const resolved = resolveReference(root, schemas, $ref, basePath())
        const [sub, subRoot, path] = resolved[0] || []
        if (!sub && sub !== false) {
          fail('failed to resolve $ref:', $ref)
          if (lintOnly) return null // failures are just collected in linter mode and don't throw, this makes a ref noop
        }
        const n = compileSub(sub, subRoot, path)
        const rn = sub === schema ? funname : n // resolve to actual name
        if (!scope[rn]) throw new Error('Unexpected: coherence check failed')
        if (!scope[rn][evaluatedStatic] && sub.type) {
          const type = Array.isArray(sub.type) ? sub.type : [sub.type]
          evaluateDelta({ type })
          if (requireValidation) {
            // We are inside a cyclic ref, label it as a one that needs full validation to support assumption in next clause
            refsNeedFullValidation.add(rn)
            // If validation is required, then a cyclic $ref is guranteed to validate all items and properties
            if (type.includes('array')) evaluateDelta({ items: Infinity })
            if (type.includes('object')) evaluateDelta({ properties: [true] })
          }
          if (requireStringValidation && type.includes('string')) {
            refsNeedFullValidation.add(rn)
            evaluateDelta({ fullstring: true })
          }
        }
        return applyRef(n, { path: ['$ref'] })
      })
      if (getMeta().exclusiveRefs) {
        enforce(!opts[optDynamic], 'unevaluated* is supported only on draft2019-09 and above')
        if (node.$ref) return // ref overrides any sibling keywords for older schemas
      }
      handle('$recursiveRef', ['string'], ($recursiveRef) => {
        if (!opts[optRecAnchors]) throw new Error('[opt] Recursive anchors are not enabled')
        enforce($recursiveRef === '#', 'Behavior of $recursiveRef is defined only for "#"')
        // Resolve to recheck that recursive ref is enabled
        const resolved = resolveReference(root, schemas, '#', basePath())
        const [sub, subRoot, path] = resolved[0]
        laxMode(sub.$recursiveAnchor, '$recursiveRef without $recursiveAnchor')
        const n = compileSub(sub, subRoot, path)
        // Apply deep recursion from here only if $recursiveAnchor is true, else just run self
        const nrec = sub.$recursiveAnchor ? format('(recursive || %s)', n) : n
        return applyRef(nrec, { path: ['$recursiveRef'] })
      })
      handle('$dynamicRef', ['string'], ($dynamicRef) => {
        if (!opts[optDynAnchors]) throw new Error('[opt] Dynamic anchors are not enabled')
        laxMode(/^[^#]*#[a-zA-Z0-9_-]+$/.test($dynamicRef), 'Unsupported $dynamicRef format')
        const dynamicTail = $dynamicRef.replace(/^[^#]+/, '')
        const resolved = resolveReference(root, schemas, $dynamicRef, basePath())
        if (!resolved[0] && !getMeta().bookending) {
          // TODO: this is draft/next only atm, recheck if dynamicResolve() can fail in runtime and what should happen
          // We have this allowed in lax mode only for now
          // Ref: https://github.com/json-schema-org/json-schema-spec/issues/1064#issuecomment-947223332
          // Ref: https://github.com/json-schema-org/json-schema-spec/pull/1139
          // Ref: https://github.com/json-schema-org/json-schema-spec/issues/1140 (unresolved)
          laxMode(false, '$dynamicRef bookending resolution failed (even though not required)')
          scope.dynamicResolve = functions.dynamicResolve
          const nrec = format('dynamicResolve(dynAnchors || [], %j)', dynamicTail)
          return applyRef(nrec, { path: ['$dynamicRef'] })
        }
        enforce(resolved[0], '$dynamicRef bookending resolution failed', $dynamicRef)
        const [sub, subRoot, path] = resolved[0]
        const ok = sub.$dynamicAnchor && `#${sub.$dynamicAnchor}` === dynamicTail
        laxMode(ok, '$dynamicRef without $dynamicAnchor in the same scope')
        const n = compileSub(sub, subRoot, path)
        scope.dynamicResolve = functions.dynamicResolve
        const nrec = ok ? format('(dynamicResolve(dynAnchors || [], %j) || %s)', dynamicTail, n) : n
        return applyRef(nrec, { path: ['$dynamicRef'] })
      })

      // typecheck
      let typeCheck = null
      handle('type', ['string', 'array'], (type) => {
        const typearr = Array.isArray(type) ? type : [type]
        for (const t of typearr) enforce(typeof t === 'string' && types.has(t), 'Unknown type:', t)
        if (current.type) {
          enforce(functions.deepEqual(typearr, [current.type]), 'One type allowed:', current.type)
          evaluateDelta({ type: [current.type] })
          return null
        }
        if (parentCheckedType(...typearr)) return null
        const filteredTypes = typearr.filter((t) => typeApplicable(t))
        if (filteredTypes.length === 0) fail('No valid types possible')
        evaluateDelta({ type: typearr }) // can be safely done here, filteredTypes already prepared
        typeCheck = safenotor(...filteredTypes.map((t) => types.get(t)(name)))
        return null
      })

      // main validation block
      // if type validation was needed and did not return early, wrap this inside an else clause.
      if (typeCheck && allErrors) {
        fun.if(typeCheck, () => error({ path: ['type'] }), performValidation)
      } else {
        if (typeCheck) errorIf(typeCheck, { path: ['type'] })
        performValidation()
      }

      // account for maxItems to recheck if they limit items. TODO: perhaps we could keep track of this in stat?
      if (stat.items < Infinity && node.maxItems <= stat.items) evaluateDelta({ items: Infinity })
    }

    // presence check and call main validation block
    if (node.default !== undefined && useDefaults) {
      if (definitelyPresent) fail('Can not apply default value here (e.g. at root)')
      const defvalue = get('default', 'jsonval')
      fun.if(present(current), writeMain, () => fun.write('%s = %j', name, defvalue))
    } else {
      handle('default', ['jsonval'], null) // unused
      fun.if(definitelyPresent ? true : present(current), writeMain)
    }

    basePathStack.length = basePathStackLength // restore basePath

    // restore recursiveAnchor history if it's not empty and ends with current node
    if (recursiveLog[0] && recursiveLog[recursiveLog.length - 1][0] === node) recursiveLog.pop()
    if (isDynScope && node !== schema) fun.write('dynLocal.shift()') // restore dynamic scope, no need on top-level

    // Checks related to static schema analysis
    if (!allowUnreachable) enforce(!fun.optimizedOut, 'some checks are never reachable')
    if (isSub) {
      const logicalOp = ['not', 'if', 'then', 'else'].includes(schemaPath[schemaPath.length - 1])
      const branchOp = ['oneOf', 'anyOf', 'allOf'].includes(schemaPath[schemaPath.length - 2])
      const depOp = ['dependencies', 'dependentSchemas'].includes(schemaPath[schemaPath.length - 2])
      const propDepOp = ['propertyDependencies'].includes(schemaPath[schemaPath.length - 3])
      // Coherence check, unreachable, double-check that we came from expected path
      enforce(logicalOp || branchOp || depOp || propDepOp, 'Unexpected logical path')
    } else if (!schemaPath.includes('not')) {
      // 'not' does not mark anything as evaluated (unlike even if/then/else), so it's safe to exclude from these
      // checks, as we are sure that everything will be checked without it. It can be viewed as a pure add-on.
      const isRefTop = schema !== root && node === schema // We are at the top-level of an opaque ref inside the schema object
      if (!isRefTop || refsNeedFullValidation.has(funname)) {
        refsNeedFullValidation.delete(funname)
        if (!stat.type) enforceValidation('type')
        // This can't be true for top-level schemas, only references with #/...
        if (typeApplicable('array') && stat.items !== Infinity)
          enforceValidation(node.items ? 'additionalItems or unevaluatedItems' : 'items rule')
        if (typeApplicable('object') && !stat.properties.includes(true))
          enforceValidation('additionalProperties or unevaluatedProperties')
        if (!stat.fullstring && requireStringValidation) {
          const stringWarning = 'pattern, format or contentSchema should be specified for strings'
          fail(`[requireStringValidation] ${stringWarning}, use pattern: ^[\\s\\S]*$ to opt-out`)
        }
      }
      if (typeof node.propertyNames !== 'object')
        for (const sub of ['additionalProperties', 'unevaluatedProperties'])
          if (node[sub]) enforceValidation(`wild-card ${sub}`, 'requires propertyNames')
    }
    if (node.properties && !node.required) enforceValidation('if properties is used, required')
    enforce(unused.size === 0 || allowUnusedKeywords, 'Unprocessed keywords:', [...unused])

    return { stat, local } // return statically evaluated
  }

  const { stat, local } = visit(format('validate.errors'), [], { name: safe('data') }, schema, [])
  if (refsNeedFullValidation.has(funname)) throw new Error('Unexpected: unvalidated cyclic ref')

  // evaluated: return dynamic for refs
  if (opts[optDynamic] && (isDynamic(stat).items || isDynamic(stat).properties)) {
    if (!local) throw new Error('Failed to trace dynamic properties') // Unreachable
    fun.write('validate.evaluatedDynamic = [%s, %s, %s]', local.item, local.items, local.props)
  }

  if (allErrors) fun.write('return errorCount === 0')
  else fun.write('return true')

  fun.write('}')

  if (!lintOnly) {
    validate = fun.makeFunction(scope)
    delete scope[funname] // more logical key order
    scope[funname] = validate
  }
  scope[funname][evaluatedStatic] = stat // still needed even in non-compiled lint for recursive refs check
  return funname
}

const compile = (schemas, opts) => {
  if (!Array.isArray(schemas)) throw new Error('Expected an array of schemas')
  try {
    const scope = Object.create(null)
    const { getref } = scopeMethods(scope)
    refsNeedFullValidation.clear() // for isolation/safeguard
    rootMeta.clear() // for isolation/safeguard
    const refs = schemas.map((s) => getref(s) || compileSchema(s, s, opts, scope))
    if (refsNeedFullValidation.size !== 0) throw new Error('Unexpected: not all refs are validated')
    return { scope, refs }
  } catch (e) {
    // For performance, we try to build the schema without dynamic tracing first, then re-run with
    // it enabled if needed. Enabling it without need can give up to about 40% performance drop.
    if (!opts[optDynamic] && e.message === '[opt] Dynamic unevaluated tracing not enabled')
      return compile(schemas, { ...opts, [optDynamic]: true })
    // Also enable dynamic and recursive refs only if needed
    if (!opts[optDynAnchors] && e.message === '[opt] Dynamic anchors are not enabled')
      return compile(schemas, { ...opts, [optDynAnchors]: true })
    if (!opts[optRecAnchors] && e.message === '[opt] Recursive anchors are not enabled')
      return compile(schemas, { ...opts, [optRecAnchors]: true })
    throw e
  } finally {
    refsNeedFullValidation.clear() // for gc
    rootMeta.clear() // for gc
  }
}

module.exports = { compile }

},{"./formats":6,"./generate-function":7,"./javascript":9,"./known-keywords":10,"./pointer":11,"./safe-format":12,"./scope-functions":13,"./scope-utils":14,"./tracing":15}],6:[function(require,module,exports){
'use strict'

const core = {
  // matches ajv + length checks + does not start with a dot
  // note that quoted emails are deliberately unsupported (as in ajv), who would want \x01 in email
  // first check is an additional fast path with lengths: 20+(1+21)*2 = 64, (1+61+1)+((1+60+1)+1)*3 = 252 < 253, that should cover most valid emails
  // max length is 64 (name) + 1 (@) + 253 (host), we want to ensure that prior to feeding to the fast regex
  // the second regex checks for quoted, starting-leading dot in name, and two dots anywhere
  email: (input) => {
    if (input.length > 318) return false
    const fast = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,20}(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,21}){0,2}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?){0,3}$/i
    if (fast.test(input)) return true
    if (!input.includes('@') || /(^\.|^"|\.@|\.\.)/.test(input)) return false
    const [name, host, ...rest] = input.split('@')
    if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253) return false
    if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) return false
    return host.split('.').every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))
  },
  // matches ajv + length checks
  hostname: (input) => {
    if (input.length > (input.endsWith('.') ? 254 : 253)) return false
    const hostname = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.?$/i
    return hostname.test(input)
  },

  // 'time' matches ajv + length checks, 'date' matches ajv full
  // date: https://tools.ietf.org/html/rfc3339#section-5.6
  // date-time: https://tools.ietf.org/html/rfc3339#section-5.6
  // leap year: https://tools.ietf.org/html/rfc3339#appendix-C
  // 11: 1990-01-01, 1: T, 9: 00:00:00., 12: maxiumum fraction length (non-standard), 6: +00:00
  date: (input) => {
    if (input.length !== 10) return false
    if (input[5] === '0' && input[6] === '2') {
      if (/^\d\d\d\d-02-(?:[012][1-8]|[12]0|[01]9)$/.test(input)) return true
      const matches = input.match(/^(\d\d\d\d)-02-29$/)
      if (!matches) return false
      const year = matches[1] | 0
      return year % 16 === 0 || (year % 4 === 0 && year % 25 !== 0)
    }
    if (input.endsWith('31')) return /^\d\d\d\d-(?:0[13578]|1[02])-31$/.test(input)
    return /^\d\d\d\d-(?:0[13-9]|1[012])-(?:[012][1-9]|[123]0)$/.test(input)
  },
  // leap second handling is special, we check it's 23:59:60.*
  time: (input) => {
    if (input.length > 9 + 12 + 6) return false
    const time = /^(?:2[0-3]|[0-1]\d):[0-5]\d:(?:[0-5]\d|60)(?:\.\d+)?(?:z|[+-](?:2[0-3]|[0-1]\d)(?::?[0-5]\d)?)?$/i
    if (!time.test(input)) return false
    if (!/:60/.test(input)) return true
    const p = input.match(/([0-9.]+|[^0-9.])/g)
    let hm = Number(p[0]) * 60 + Number(p[2])
    if (p[5] === '+') hm += 24 * 60 - Number(p[6] || 0) * 60 - Number(p[8] || 0)
    else if (p[5] === '-') hm += Number(p[6] || 0) * 60 + Number(p[8] || 0)
    return hm % (24 * 60) === 23 * 60 + 59
  },
  // first two lines specific to date-time, then tests for unanchored (at end) date, code identical to 'date' above
  // input[17] === '6' is a check for :60
  'date-time': (input) => {
    if (input.length > 10 + 1 + 9 + 12 + 6) return false
    const full = /^\d\d\d\d-(?:0[1-9]|1[0-2])-(?:[0-2]\d|3[01])[t\s](?:2[0-3]|[0-1]\d):[0-5]\d:(?:[0-5]\d|60)(?:\.\d+)?(?:z|[+-](?:2[0-3]|[0-1]\d)(?::?[0-5]\d)?)$/i
    const feb = input[5] === '0' && input[6] === '2'
    if ((feb && input[8] === '3') || !full.test(input)) return false
    if (input[17] === '6') {
      const p = input.slice(11).match(/([0-9.]+|[^0-9.])/g)
      let hm = Number(p[0]) * 60 + Number(p[2])
      if (p[5] === '+') hm += 24 * 60 - Number(p[6] || 0) * 60 - Number(p[8] || 0)
      else if (p[5] === '-') hm += Number(p[6] || 0) * 60 + Number(p[8] || 0)
      if (hm % (24 * 60) !== 23 * 60 + 59) return false
    }
    if (feb) {
      if (/^\d\d\d\d-02-(?:[012][1-8]|[12]0|[01]9)/.test(input)) return true
      const matches = input.match(/^(\d\d\d\d)-02-29/)
      if (!matches) return false
      const year = matches[1] | 0
      return year % 16 === 0 || (year % 4 === 0 && year % 25 !== 0)
    }
    if (input[8] === '3' && input[9] === '1') return /^\d\d\d\d-(?:0[13578]|1[02])-31/.test(input)
    return /^\d\d\d\d-(?:0[13-9]|1[012])-(?:[012][1-9]|[123]0)/.test(input)
  },

  /* ipv4 and ipv6 are from ajv with length restriction */
  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  ipv4: (ip) =>
    ip.length <= 15 &&
    /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)$/.test(ip),
  // optimized http://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
  // max length: 1000:1000:1000:1000:1000:1000:255.255.255.255
  // we parse ip6 format with a simple scan, leaving embedded ipv4 validation to a regex
  // s0=count(:), s1=count(.), hex=count(a-zA-Z0-9), short=count(::)>0
  // 48-57: '0'-'9', 97-102, 65-70: 'a'-'f', 'A'-'F', 58: ':', 46: '.'
  /* eslint-disable one-var */
  // prettier-ignore
  ipv6: (input) => {
    if (input.length > 45 || input.length < 2) return false
    let s0 = 0, s1 = 0, hex = 0, short = false, letters = false, last = 0, start = true
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i)
      if (i === 1 && last === 58 && c !== 58) return false
      if (c >= 48 && c <= 57) {
        if (++hex > 4) return false
      } else if (c === 46) {
        if (s0 > 6 || s1 >= 3 || hex === 0 || letters) return false
        s1++
        hex = 0
      } else if (c === 58) {
        if (s1 > 0 || s0 >= 7) return false
        if (last === 58) {
          if (short) return false
          short = true
        } else if (i === 0) start = false
        s0++
        hex = 0
        letters = false
      } else if ((c >= 97 && c <= 102) || (c >= 65 && c <= 70)) {
        if (s1 > 0) return false
        if (++hex > 4) return false
        letters = true
      } else return false
      last = c
    }
    if (s0 < 2 || (s1 > 0 && (s1 !== 3 || hex === 0))) return false
    if (short && input.length === 2) return true
    if (s1 > 0 && !/(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(input)) return false
    const spaces = s1 > 0 ? 6 : 7
    if (!short) return s0 === spaces && start && hex > 0
    return (start || hex > 0) && s0 < spaces
  },
  /* eslint-enable one-var */
  // matches ajv with optimization
  uri: /^[a-z][a-z0-9+\-.]*:(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/?(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  // matches ajv with optimization
  'uri-reference': /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/?(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?)?(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  // ajv has /^(([^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?([a-z0-9_]|%[0-9a-f]{2})+(:[1-9][0-9]{0,3}|\*)?(,([a-z0-9_]|%[0-9a-f]{2})+(:[1-9][0-9]{0,3}|\*)?)*\})*$/i
  // this is equivalent
  // uri-template: https://tools.ietf.org/html/rfc6570
  // eslint-disable-next-line no-control-regex
  'uri-template': /^(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2}|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,

  // ajv has /^(\/([^~/]|~0|~1)*)*$/, this is equivalent
  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  'json-pointer': /^(?:|\/(?:[^~]|~0|~1)*)$/,
  // ajv has /^(0|[1-9][0-9]*)(#|(\/([^~/]|~0|~1)*)*)$/, this is equivalent
  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
  'relative-json-pointer': /^(?:0|[1-9][0-9]*)(?:|#|\/(?:[^~]|~0|~1)*)$/,

  // uuid: http://tools.ietf.org/html/rfc4122
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // length restriction is an arbitrary safeguard
  // first regex checks if this a week duration (can't be combined with others)
  // second regex verifies symbols, no more than one fraction, at least 1 block is present, and T is not last
  // third regex verifies structure
  duration: (input) =>
    input.length > 1 &&
    input.length < 80 &&
    (/^P\d+([.,]\d+)?W$/.test(input) ||
      (/^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) &&
        /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input))),

  // TODO: iri, iri-reference, idn-email, idn-hostname
}

const extra = {
  // basic
  alpha: /^[a-zA-Z]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,

  // hex
  'hex-digits': /^[0-9a-f]+$/i,
  'hex-digits-prefixed': /^0x[0-9a-f]+$/i,
  'hex-bytes': /^([0-9a-f][0-9a-f])+$/i,
  'hex-bytes-prefixed': /^0x([0-9a-f][0-9a-f])+$/i,

  base64: (input) => input.length % 4 === 0 && /^[a-z0-9+/]*={0,3}$/i.test(input),

  // ajv has /^#(\/([a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, this is equivalent
  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  'json-pointer-uri-fragment': /^#(|\/(\/|[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)$/i,

  // draft3 backwards compat
  'host-name': core.hostname,
  'ip-address': core.ipv4,

  // manually cleaned up from is-my-json-valid, CSS 2.1 colors only per draft03 spec
  color: /^(#[0-9A-Fa-f]{3,6}|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|rgb\(\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*\)|rgb\(\s*(\d?\d%|100%)\s*,\s*(\d?\d%|100%)\s*,\s*(\d?\d%|100%)\s*\))$/,

  // style is deliberately unsupported, don't accept untrusted styles
}

const weak = {
  // In weak because don't accept regexes from untrusted sources, using them can cause DoS
  // matches ajv + length checks
  // eslint comment outside because we don't want comments in functions, those affect output
  /* eslint-disable no-new */
  regex: (str) => {
    if (str.length > 1e5) return false
    const Z_ANCHOR = /[^\\]\\Z/
    if (Z_ANCHOR.test(str)) return false
    try {
      new RegExp(str, 'u')
      return true
    } catch (e) {
      return false
    }
  },
  /* eslint-enable no-new */
}

module.exports = { core, extra, weak }

},{}],7:[function(require,module,exports){
'use strict'

const { format, safe, safenot } = require('./safe-format')
const { jaystring } = require('./javascript')

/*
 * Construct a function from lines/blocks/if conditions.
 *
 * Returns a Function instance (makeFunction) or code in text format (makeModule).
 */

const INDENT_START = /[{[]/
const INDENT_END = /[}\]]/

module.exports = () => {
  const lines = []
  let indent = 0

  const pushLine = (line) => {
    if (INDENT_END.test(line.trim()[0])) indent--
    lines.push({ indent, code: line })
    if (INDENT_START.test(line[line.length - 1])) indent++
  }

  const build = () => {
    if (indent !== 0) throw new Error('Unexpected indent at build()')
    const joined = lines.map((line) => format('%w%s', line.indent * 2, line.code)).join('\n')
    return /^[a-z][a-z0-9]*$/i.test(joined) ? `return ${joined}` : `return (${joined})`
  }

  const processScope = (scope) => {
    const entries = Object.entries(scope)
    for (const [key, value] of entries) {
      if (!/^[a-z][a-z0-9]*$/i.test(key)) throw new Error('Unexpected scope key!')
      if (!(typeof value === 'function' || value instanceof RegExp))
        throw new Error('Unexpected scope value!')
    }
    return entries
  }

  return {
    optimizedOut: false, // some branch of code has been optimized out
    size: () => lines.length,

    write(fmt, ...args) {
      if (typeof fmt !== 'string') throw new Error('Format must be a string!')
      if (fmt.includes('\n')) throw new Error('Only single lines are supported')
      pushLine(format(fmt, ...args))
      return true // code was written
    },

    block(prefix, writeBody, noInline = false) {
      const oldIndent = indent
      this.write('%s {', prefix)
      const length = lines.length
      writeBody()
      if (length === lines.length) {
        // no lines inside block, unwind the block
        lines.pop()
        indent = oldIndent
        return false // nothing written
      } else if (length === lines.length - 1 && !noInline) {
        // a single line has been written, inline it if opt-in allows
        const { code } = lines[lines.length - 1]
        // check below is just for generating more readable code, it's safe to inline all !noInline
        if (!/^(if|for) /.test(code)) {
          lines.length -= 2
          indent = oldIndent
          return this.write('%s %s', prefix, code)
        }
      }
      return this.write('}')
    },

    if(condition, writeBody, writeElse) {
      if (`${condition}` === 'false') {
        if (writeElse) writeElse()
        if (writeBody) this.optimizedOut = true
      } else if (`${condition}` === 'true') {
        if (writeBody) writeBody()
        if (writeElse) this.optimizedOut = true
      } else if (writeBody && this.block(format('if (%s)', condition), writeBody, !!writeElse)) {
        if (writeElse) this.block(format('else'), writeElse) // !!writeElse above ensures {} wrapping before `else`
      } else if (writeElse) {
        this.if(safenot(condition), writeElse)
      }
    },

    makeModule(scope = {}) {
      const scopeDefs = processScope(scope).map(
        ([key, val]) => `const ${safe(key)} = ${jaystring(val)};`
      )
      return `(function() {\n'use strict'\n${scopeDefs.join('\n')}\n${build()}})()`
    },

    makeFunction(scope = {}) {
      const scopeEntries = processScope(scope)
      const keys = scopeEntries.map((entry) => entry[0])
      const vals = scopeEntries.map((entry) => entry[1])
      // eslint-disable-next-line no-new-func
      return Function(...keys, `'use strict'\n${build()}`)(...vals)
    },
  }
}

},{"./javascript":9,"./safe-format":12}],8:[function(require,module,exports){
'use strict'

const genfun = require('./generate-function')
const { buildSchemas } = require('./pointer')
const { compile } = require('./compile')
const { deepEqual } = require('./scope-functions')

const jsonCheckWithErrors = (validate) =>
  function validateIsJSON(data) {
    if (!deepEqual(data, JSON.parse(JSON.stringify(data)))) {
      validateIsJSON.errors = [{ instanceLocation: '#', error: 'not JSON compatible' }]
      return false
    }
    const res = validate(data)
    validateIsJSON.errors = validate.errors
    return res
  }

const jsonCheckWithoutErrors = (validate) => (data) =>
  deepEqual(data, JSON.parse(JSON.stringify(data))) && validate(data)

const validator = (
  schema,
  { parse = false, multi = false, jsonCheck = false, isJSON = false, schemas = [], ...opts } = {}
) => {
  if (jsonCheck && isJSON) throw new Error('Can not specify both isJSON and jsonCheck options')
  if (parse && (jsonCheck || isJSON))
    throw new Error('jsonCheck and isJSON options are not applicable in parser mode')
  const mode = parse ? 'strong' : 'default' // strong mode is default in parser, can be overriden
  const willJSON = isJSON || jsonCheck || parse
  const arg = multi ? schema : [schema]
  const options = { mode, ...opts, schemas: buildSchemas(schemas, arg), isJSON: willJSON }
  const { scope, refs } = compile(arg, options) // only a single ref
  if (opts.dryRun) return
  if (opts.lint) return scope.lintErrors
  const fun = genfun()
  if (parse) {
    scope.parseWrap = opts.includeErrors ? parseWithErrors : parseWithoutErrors
  } else if (jsonCheck) {
    scope.deepEqual = deepEqual
    scope.jsonCheckWrap = opts.includeErrors ? jsonCheckWithErrors : jsonCheckWithoutErrors
  }
  if (multi) {
    fun.write('[')
    for (const ref of refs.slice(0, -1)) fun.write('%s,', ref)
    if (refs.length > 0) fun.write('%s', refs[refs.length - 1])
    fun.write(']')
    if (parse) fun.write('.map(parseWrap)')
    else if (jsonCheck) fun.write('.map(jsonCheckWrap)')
  } else {
    if (parse) fun.write('parseWrap(%s)', refs[0])
    else if (jsonCheck) fun.write('jsonCheckWrap(%s)', refs[0])
    else fun.write('%s', refs[0])
  }
  const validate = fun.makeFunction(scope)
  validate.toModule = ({ semi = true } = {}) => fun.makeModule(scope) + (semi ? ';' : '')
  validate.toJSON = () => schema
  return validate
}

const parseWithErrors = (validate) => (src) => {
  if (typeof src !== 'string') return { valid: false, error: 'Input is not a string' }
  try {
    const value = JSON.parse(src)
    if (!validate(value)) {
      const { keywordLocation, instanceLocation } = validate.errors[0]
      const keyword = keywordLocation.slice(keywordLocation.lastIndexOf('/') + 1)
      const error = `JSON validation failed for ${keyword} at ${instanceLocation}`
      return { valid: false, error, errors: validate.errors }
    }
    return { valid: true, value }
  } catch ({ message }) {
    return { valid: false, error: message }
  }
}

const parseWithoutErrors = (validate) => (src) => {
  if (typeof src !== 'string') return { valid: false }
  try {
    const value = JSON.parse(src)
    if (!validate(value)) return { valid: false }
    return { valid: true, value }
  } catch (e) {
    return { valid: false }
  }
}

const parser = function(schema, { parse = true, ...opts } = {}) {
  if (!parse) throw new Error('can not disable parse in parser')
  return validator(schema, { parse, ...opts })
}

const lint = function(schema, { lint: lintOption = true, ...opts } = {}) {
  if (!lintOption) throw new Error('can not disable lint option in lint()')
  return validator(schema, { lint: lintOption, ...opts })
}

module.exports = { validator, parser, lint }

},{"./compile":5,"./generate-function":7,"./pointer":11,"./scope-functions":13}],9:[function(require,module,exports){
'use strict'

const { format, safe } = require('./safe-format')
const { scopeMethods } = require('./scope-utils')
const functions = require('./scope-functions')

// for building into the validation function
const types = new Map(
  Object.entries({
    null: (name) => format('%s === null', name),
    boolean: (name) => format('typeof %s === "boolean"', name),
    array: (name) => format('Array.isArray(%s)', name),
    object: (n) => format('typeof %s === "object" && %s && !Array.isArray(%s)', n, n, n),
    number: (name) => format('typeof %s === "number"', name),
    integer: (name) => format('Number.isInteger(%s)', name),
    string: (name) => format('typeof %s === "string"', name),
  })
)

const buildName = ({ name, parent, keyval, keyname }) => {
  if (name) {
    if (parent || keyval || keyname) throw new Error('name can be used only stand-alone')
    return name // top-level
  }
  if (!parent) throw new Error('Can not use property of undefined parent!')
  const parentName = buildName(parent)
  if (keyval !== undefined) {
    if (keyname) throw new Error('Can not use key value and name together')
    if (!['string', 'number'].includes(typeof keyval)) throw new Error('Invalid property path')
    if (/^[a-z][a-z0-9_]*$/i.test(keyval)) return format('%s.%s', parentName, safe(keyval))
    return format('%s[%j]', parentName, keyval)
  } else if (keyname) {
    return format('%s[%s]', parentName, keyname)
  }
  /* c8 ignore next */
  throw new Error('Unreachable')
}

const jsonProtoKeys = new Set(
  [].concat(
    ...[Object, Array, String, Number, Boolean].map((c) => Object.getOwnPropertyNames(c.prototype))
  )
)

const jsHelpers = (fun, scope, propvar, { unmodifiedPrototypes, isJSON }, noopRegExps) => {
  const { gensym, genpattern, genloop } = scopeMethods(scope, propvar)

  const present = (obj) => {
    const name = buildName(obj) // also checks for coherence, do not remove
    const { parent, keyval, keyname, inKeys, checked } = obj
    /* c8 ignore next */
    if (checked || (inKeys && isJSON)) throw new Error('Unreachable: useless check for undefined')
    if (inKeys) return format('%s !== undefined', name)
    if (parent && keyname) {
      scope.hasOwn = functions.hasOwn
      const pname = buildName(parent)
      if (isJSON) return format('%s !== undefined && hasOwn(%s, %s)', name, pname, keyname)
      return format('%s in %s && hasOwn(%s, %s)', keyname, pname, pname, keyname)
    } else if (parent && keyval !== undefined) {
      // numbers must be converted to strings for this check, hence `${keyval}` in check below
      if (unmodifiedPrototypes && isJSON && !jsonProtoKeys.has(`${keyval}`))
        return format('%s !== undefined', name)
      scope.hasOwn = functions.hasOwn
      const pname = buildName(parent)
      if (isJSON) return format('%s !== undefined && hasOwn(%s, %j)', name, pname, keyval)
      return format('%j in %s && hasOwn(%s, %j)', keyval, pname, pname, keyval)
    }
    /* c8 ignore next */
    throw new Error('Unreachable: present() check without parent')
  }

  const forObjectKeys = (obj, writeBody) => {
    const key = gensym('key')
    fun.block(format('for (const %s of Object.keys(%s))', key, buildName(obj)), () => {
      writeBody(propvar(obj, key, true), key) // always own property here
    })
  }

  const forArray = (obj, start, writeBody) => {
    const i = genloop()
    const name = buildName(obj)
    fun.block(format('for (let %s = %s; %s < %s.length; %s++)', i, start, i, name, i), () => {
      writeBody(propvar(obj, i, unmodifiedPrototypes, true), i) // own property in Array if proto not mangled
    })
  }

  const patternTest = (pat, key) => {
    // Convert common patterns to string checks, makes generated code easier to read (and a tiny perf bump)
    const r = pat.replace(/[.^$|*+?(){}[\]\\]/gu, '') // Special symbols: .^$|*+?(){}[]\
    if (pat === `^${r}$`) return format('(%s === %j)', key, pat.slice(1, -1)) // ^abc$ -> === abc
    if (noopRegExps.has(pat)) return format('true') // known noop

    // All of the below will cause warnings in enforced string validation mode, but let's make what they actually do more visible
    // note that /^.*$/u.test('\n') is false, so don't combine .* with anchors here!
    if ([r, `${r}+`, `${r}.*`, `.*${r}.*`].includes(pat)) return format('%s.includes(%j)', key, r)
    if ([`^${r}`, `^${r}+`, `^${r}.*`].includes(pat)) return format('%s.startsWith(%j)', key, r)
    if ([`${r}$`, `.*${r}$`].includes(pat)) return format('%s.endsWith(%j)', key, r)

    const subr = [...r].slice(0, -1).join('') // without the last symbol, astral plane aware
    if ([`${r}*`, `${r}?`].includes(pat))
      return subr.length === 0 ? format('true') : format('%s.includes(%j)', key, subr) // abc*, abc? -> includes(ab)
    if ([`^${r}*`, `^${r}?`].includes(pat))
      return subr.length === 0 ? format('true') : format('%s.startsWith(%j)', key, subr) // ^abc*, ^abc? -> startsWith(ab)

    // A normal reg-exp test
    return format('%s.test(%s)', genpattern(pat), key)
  }

  const compare = (name, val) => {
    if (!val || typeof val !== 'object') return format('%s === %j', name, val)

    let type // type is needed for speedup only, deepEqual rechecks that
    // small plain object/arrays are fast cases and we inline those instead of calling deepEqual
    const shouldInline = (arr) => arr.length <= 3 && arr.every((x) => !x || typeof x !== 'object')
    if (Array.isArray(val)) {
      type = types.get('array')(name)
      if (shouldInline(val)) {
        let k = format('%s.length === %d', name, val.length)
        for (let i = 0; i < val.length; i++) k = format('%s && %s[%d] === %j', k, name, i, val[i])
        return format('%s && %s', type, k)
      }
    } else {
      type = types.get('object')(name)
      const [keys, values] = [Object.keys(val), Object.values(val)]
      if (shouldInline(values)) {
        let k = format('Object.keys(%s).length === %d', name, keys.length)
        if (keys.length > 0) scope.hasOwn = functions.hasOwn
        for (const key of keys) k = format('%s && hasOwn(%s, %j)', k, name, key)
        for (const key of keys) k = format('%s && %s[%j] === %j', k, name, key, val[key])
        return format('%s && %s', type, k)
      }
    }

    scope.deepEqual = functions.deepEqual
    return format('%s && deepEqual(%s, %j)', type, name, val)
  }

  return { present, forObjectKeys, forArray, patternTest, compare, propvar }
}

// Stringifcation of functions and regexps, for scope
const isArrowFnWithParensRegex = /^\([^)]*\) *=>/
const isArrowFnWithoutParensRegex = /^[^=]*=>/
const toJayString = Symbol.for('toJayString')
function jaystring(item) {
  if (typeof item === 'function') {
    if (item[toJayString]) return item[toJayString] // this is supported only for functions

    if (Object.getPrototypeOf(item) !== Function.prototype)
      throw new Error('Can not stringify: a function with unexpected prototype')

    const stringified = `${item}`
    if (item.prototype) {
      if (!/^function[ (]/.test(stringified)) throw new Error('Unexpected function')
      return stringified // normal function
    }
    if (isArrowFnWithParensRegex.test(stringified) || isArrowFnWithoutParensRegex.test(stringified))
      return stringified // Arrow function

    // Shortened ES6 object method declaration
    throw new Error('Can not stringify: only either normal or arrow functions are supported')
  } else if (typeof item === 'object') {
    const proto = Object.getPrototypeOf(item)
    if (item instanceof RegExp && proto === RegExp.prototype) return format('%r', item)
    throw new Error('Can not stringify: an object with unexpected prototype')
  }
  throw new Error(`Can not stringify: unknown type ${typeof item}`)
}

module.exports = { types, buildName, jsHelpers, jaystring }

},{"./safe-format":12,"./scope-functions":13,"./scope-utils":14}],10:[function(require,module,exports){
'use strict'

const knownKeywords = [
  ...['$schema', '$vocabulary'], // version
  ...['id', '$id', '$anchor', '$ref', 'definitions', '$defs'], // pointers
  ...['$recursiveRef', '$recursiveAnchor', '$dynamicAnchor', '$dynamicRef'],
  ...['type', 'required', 'default'], // generic
  ...['enum', 'const'], // constant values
  ...['not', 'allOf', 'anyOf', 'oneOf', 'if', 'then', 'else'], // logical checks
  ...['maximum', 'minimum', 'exclusiveMaximum', 'exclusiveMinimum', 'multipleOf', 'divisibleBy'], // numbers
  ...['items', 'maxItems', 'minItems', 'additionalItems', 'prefixItems'], // arrays, basic
  ...['contains', 'minContains', 'maxContains', 'uniqueItems'], // arrays, complex
  ...['maxLength', 'minLength', 'format', 'pattern'], // strings
  ...['contentEncoding', 'contentMediaType', 'contentSchema'], // strings content
  ...['properties', 'maxProperties', 'minProperties', 'additionalProperties', 'patternProperties'], // objects
  ...['propertyNames'], // objects
  ...['dependencies', 'dependentRequired', 'dependentSchemas', 'propertyDependencies'], // objects (dependencies)
  ...['unevaluatedProperties', 'unevaluatedItems'], // see-through
  // Unused meta keywords not affecting validation (annotations and comments)
  // https://json-schema.org/understanding-json-schema/reference/generic.html
  // https://json-schema.org/draft/2019-09/json-schema-validation.html#rfc.section.9
  ...['title', 'description', 'deprecated', 'readOnly', 'writeOnly', 'examples', '$comment'], // unused meta
  ...['example'], // unused meta, OpenAPI
  'discriminator', // optimization hint and error filtering only, does not affect validation result
  'removeAdditional', // optional keyword for { removeAdditional: 'keyword' } config, to target specific objects
]

// Order is important, newer first!
const schemaDrafts = [
  ...['draft/next'], // not recommended to use, might change / break in an unexpected way
  ...['draft/2020-12', 'draft/2019-09'], // new
  ...['draft-07', 'draft-06', 'draft-04', 'draft-03'], // historic
]
const schemaVersions = schemaDrafts.map((draft) => `https://json-schema.org/${draft}/schema`)

const vocab2019 = ['core', 'applicator', 'validation', 'meta-data', 'format', 'content']
const vocab2020 = [
  ...['core', 'applicator', 'unevaluated', 'validation'],
  ...['meta-data', 'format-annotation', 'format-assertion', 'content'],
]
const knownVocabularies = [
  ...vocab2019.map((v) => `https://json-schema.org/draft/2019-09/vocab/${v}`),
  ...vocab2020.map((v) => `https://json-schema.org/draft/2020-12/vocab/${v}`),
]

module.exports = { knownKeywords, schemaVersions, knownVocabularies }

},{}],11:[function(require,module,exports){
'use strict'

const { knownKeywords } = require('./known-keywords')

/*
 * JSON pointer collection/resolution logic
 */

function safeSet(map, key, value, comment = 'keys') {
  if (!map.has(key)) return map.set(key, value)
  if (map.get(key) !== value) throw new Error(`Conflicting duplicate ${comment}: ${key}`)
}

function untilde(string) {
  if (!string.includes('~')) return string
  return string.replace(/~[01]/g, (match) => {
    switch (match) {
      case '~1':
        return '/'
      case '~0':
        return '~'
    }
    /* c8 ignore next */
    throw new Error('Unreachable')
  })
}

function get(obj, pointer, objpath) {
  if (typeof obj !== 'object') throw new Error('Invalid input object')
  if (typeof pointer !== 'string') throw new Error('Invalid JSON pointer')
  const parts = pointer.split('/')
  if (!['', '#'].includes(parts.shift())) throw new Error('Invalid JSON pointer')
  if (parts.length === 0) return obj

  let curr = obj
  for (const part of parts) {
    if (typeof part !== 'string') throw new Error('Invalid JSON pointer')
    if (objpath) objpath.push(curr) // does not include target itself, but includes head
    const prop = untilde(part)
    if (typeof curr !== 'object') return undefined
    if (!Object.prototype.hasOwnProperty.call(curr, prop)) return undefined
    curr = curr[prop]
  }
  return curr
}

const protocolRegex = /^https?:\/\//

function joinPath(baseFull, sub) {
  if (typeof baseFull !== 'string' || typeof sub !== 'string') throw new Error('Unexpected path!')
  if (sub.length === 0) return baseFull
  const base = baseFull.replace(/#.*/, '')
  if (sub.startsWith('#')) return `${base}${sub}`
  if (!base.includes('/') || protocolRegex.test(sub)) return sub
  if (protocolRegex.test(base)) return `${new URL(sub, base)}`
  if (sub.startsWith('/')) return sub
  return [...base.split('/').slice(0, -1), sub].join('/')
}

function objpath2path(objpath) {
  const ids = objpath.map((obj) => (obj && (obj.$id || obj.id)) || '')
  return ids.filter((id) => id && typeof id === 'string').reduce(joinPath, '')
}

const withSpecialChilds = ['properties', 'patternProperties', '$defs', 'definitions']
const skipChilds = ['const', 'enum', 'examples', 'example', 'comment']
const sSkip = Symbol('skip')

function traverse(schema, work) {
  const visit = (sub, specialChilds = false) => {
    if (!sub || typeof sub !== 'object') return
    const res = work(sub)
    if (res !== undefined) return res === sSkip ? undefined : res
    for (const k of Object.keys(sub)) {
      if (!specialChilds && !Array.isArray(sub) && !knownKeywords.includes(k)) continue
      if (!specialChilds && skipChilds.includes(k)) continue
      const kres = visit(sub[k], !specialChilds && withSpecialChilds.includes(k))
      if (kres !== undefined) return kres
    }
  }
  return visit(schema)
}

// Returns a list of resolved entries, in a form: [schema, root, basePath]
// basePath doesn't contain the target object $id itself
function resolveReference(root, schemas, ref, base = '') {
  const ptr = joinPath(base, ref)
  const results = []

  const [main, hash = ''] = ptr.split('#')
  const local = decodeURI(hash)

  // Find in self by id path
  const visit = (sub, oldPath, specialChilds = false, dynamic = false) => {
    if (!sub || typeof sub !== 'object') return

    const id = sub.$id || sub.id
    let path = oldPath
    if (id && typeof id === 'string') {
      path = joinPath(path, id)
      if (path === ptr || (path === main && local === '')) {
        results.push([sub, root, oldPath])
      } else if (path === main && local[0] === '/') {
        const objpath = []
        const res = get(sub, local, objpath)
        if (res !== undefined) results.push([res, root, joinPath(oldPath, objpath2path(objpath))])
      }
    }
    const anchor = dynamic ? sub.$dynamicAnchor : sub.$anchor
    if (anchor && typeof anchor === 'string') {
      if (anchor.includes('#')) throw new Error("$anchor can't include '#'")
      if (anchor.startsWith('/')) throw new Error("$anchor can't start with '/'")
      path = joinPath(path, `#${anchor}`)
      if (path === ptr) results.push([sub, root, oldPath])
    }

    for (const k of Object.keys(sub)) {
      if (!specialChilds && !Array.isArray(sub) && !knownKeywords.includes(k)) continue
      if (!specialChilds && skipChilds.includes(k)) continue
      visit(sub[k], path, !specialChilds && withSpecialChilds.includes(k))
    }
    if (!dynamic && sub.$dynamicAnchor) visit(sub, oldPath, specialChilds, true)
  }
  visit(root, main)

  // Find in self by pointer
  if (main === base.replace(/#$/, '') && (local[0] === '/' || local === '')) {
    const objpath = []
    const res = get(root, local, objpath)
    if (res !== undefined) results.push([res, root, objpath2path(objpath)])
  }

  // Find in additional schemas
  if (schemas.has(main) && schemas.get(main) !== root) {
    const additional = resolveReference(schemas.get(main), schemas, `#${hash}`, main)
    results.push(...additional.map(([res, rRoot, rPath]) => [res, rRoot, joinPath(main, rPath)]))
  }

  // Full refs to additional schemas
  if (schemas.has(ptr)) results.push([schemas.get(ptr), schemas.get(ptr), ptr])

  return results
}

function getDynamicAnchors(schema) {
  const results = new Map()
  traverse(schema, (sub) => {
    if (sub !== schema && (sub.$id || sub.id)) return sSkip // base changed, no longer in the same resource
    const anchor = sub.$dynamicAnchor
    if (anchor && typeof anchor === 'string') {
      if (anchor.includes('#')) throw new Error("$dynamicAnchor can't include '#'")
      if (!/^[a-zA-Z0-9_-]+$/.test(anchor)) throw new Error(`Unsupported $dynamicAnchor: ${anchor}`)
      safeSet(results, anchor, sub, '$dynamicAnchor')
    }
  })
  return results
}

const hasKeywords = (schema, keywords) =>
  traverse(schema, (s) => Object.keys(s).some((k) => keywords.includes(k)) || undefined) || false

const addSchemasArrayToMap = (schemas, input, optional = false) => {
  if (!Array.isArray(input)) throw new Error('Expected an array of schemas')
  // schema ids are extracted from the schemas themselves
  for (const schema of input) {
    traverse(schema, (sub) => {
      const idRaw = sub.$id || sub.id
      const id = idRaw && typeof idRaw === 'string' ? idRaw.replace(/#$/, '') : null // # is allowed only as the last symbol here
      if (id && id.includes('://') && !id.includes('#')) {
        safeSet(schemas, id, sub, "schema $id in 'schemas'")
      } else if (sub === schema && !optional) {
        throw new Error("Schema with missing or invalid $id in 'schemas'")
      }
    })
  }
  return schemas
}

const buildSchemas = (input, extra) => {
  if (extra) return addSchemasArrayToMap(buildSchemas(input), extra, true)
  if (input) {
    switch (Object.getPrototypeOf(input)) {
      case Object.prototype:
        return new Map(Object.entries(input))
      case Map.prototype:
        return new Map(input)
      case Array.prototype:
        return addSchemasArrayToMap(new Map(), input)
    }
  }
  throw new Error("Unexpected value for 'schemas' option")
}

module.exports = { get, joinPath, resolveReference, getDynamicAnchors, hasKeywords, buildSchemas }

},{"./known-keywords":10}],12:[function(require,module,exports){
'use strict'

class SafeString extends String {} // used for instanceof checks

const compares = new Set(['<', '>', '<=', '>='])
const escapeCode = (code) => `\\u${code.toString(16).padStart(4, '0')}`

// Supports simple js variables only, i.e. constants and JSON-stringifiable
// Converts a variable to be safe for inclusion in JS context
// This works on top of JSON.stringify with minor fixes to negate the JS/JSON parsing differences
const jsval = (val) => {
  if ([Infinity, -Infinity, NaN, undefined, null].includes(val)) return `${val}`
  const primitive = ['string', 'boolean', 'number'].includes(typeof val)
  if (!primitive) {
    if (typeof val !== 'object') throw new Error('Unexpected value type')
    const proto = Object.getPrototypeOf(val)
    const ok = (proto === Array.prototype && Array.isArray(val)) || proto === Object.prototype
    if (!ok) throw new Error('Unexpected object given as value')
  }
  return (
    JSON.stringify(val)
      // JSON context and JS eval context have different handling of __proto__ property name
      // Refs: https://www.ecma-international.org/ecma-262/#sec-json.parse
      // Refs: https://www.ecma-international.org/ecma-262/#sec-__proto__-property-names-in-object-initializers
      // Replacement is safe because it's the only way that encodes __proto__ property in JSON and
      // it can't occur inside strings or other properties, due to the leading `"` and traling `":`
      .replace(/([{,])"__proto__":/g, '$1["__proto__"]:')
      // The above line should cover all `"__proto__":` occurances except for `"...\"__proto__":`
      .replace(/[^\\]"__proto__":/g, () => {
        /* c8 ignore next */
        throw new Error('Unreachable')
      })
      // https://v8.dev/features/subsume-json#security, e.g. {'\u2028':0} on Node.js 8
      .replace(/[\u2028\u2029]/g, (char) => escapeCode(char.charCodeAt(0)))
  )
}

const format = (fmt, ...args) => {
  const res = fmt.replace(/%[%drscjw]/g, (match) => {
    if (match === '%%') return '%'
    if (args.length === 0) throw new Error('Unexpected arguments count')
    const val = args.shift()
    switch (match) {
      case '%d':
        if (typeof val === 'number') return val
        throw new Error('Expected a number')
      case '%r':
        // String(regex) is not ok on Node.js 10 and below: console.log(String(new RegExp('\n')))
        if (val instanceof RegExp) return format('new RegExp(%j, %j)', val.source, val.flags)
        throw new Error('Expected a RegExp instance')
      case '%s':
        if (val instanceof SafeString) return val
        throw new Error('Expected a safe string')
      case '%c':
        if (compares.has(val)) return val
        throw new Error('Expected a compare op')
      case '%j':
        return jsval(val)
      case '%w':
        if (Number.isInteger(val) && val >= 0) return ' '.repeat(val)
        throw new Error('Expected a non-negative integer for indentation')
    }
    /* c8 ignore next */
    throw new Error('Unreachable')
  })
  if (args.length !== 0) throw new Error('Unexpected arguments count')
  return new SafeString(res)
}

const safe = (string) => {
  if (!/^[a-z][a-z0-9_]*$/i.test(string)) throw new Error('Does not look like a safe id')
  return new SafeString(string)
}

// too dangereous to export, use with care
const safewrap = (fun) => (...args) => {
  if (!args.every((arg) => arg instanceof SafeString)) throw new Error('Unsafe arguments')
  return new SafeString(fun(...args))
}

const safepriority = (arg) =>
  // simple expression and single brackets can not break priority
  /^[a-z][a-z0-9_().]*$/i.test(arg) || /^\([^()]+\)$/i.test(arg) ? arg : format('(%s)', arg)
const safeor = safewrap(
  (...args) => (args.some((arg) => `${arg}` === 'true') ? 'true' : args.join(' || ') || 'false')
)
const safeand = safewrap(
  (...args) => (args.some((arg) => `${arg}` === 'false') ? 'false' : args.join(' && ') || 'true')
)
const safenot = (arg) => {
  if (`${arg}` === 'true') return safe('false')
  if (`${arg}` === 'false') return safe('true')
  return format('!%s', safepriority(arg))
}
// this function is priority-safe, unlike safeor, hence it's exported and safeor is not atm
const safenotor = (...args) => safenot(safeor(...args))

module.exports = { format, safe, safeand, safenot, safenotor }

},{}],13:[function(require,module,exports){
(function (Buffer){(function (){
'use strict'

// for correct Unicode code points processing
// https://mathiasbynens.be/notes/javascript-unicode#accounting-for-astral-symbols
const stringLength = (string) =>
  /[\uD800-\uDFFF]/.test(string) ? [...string].length : string.length

// A isMultipleOf B: shortest decimal denoted as A % shortest decimal denoted as B === 0
// Optimized, coherence checks and precomputation are outside of this method
// If we get an Infinity when we multiply by the factor (which is always a power of 10), we just undo that instead of always returning false
const isMultipleOf = (value, divisor, factor, factorMultiple) => {
  if (value % divisor === 0) return true
  let multiple = value * factor
  if (multiple === Infinity || multiple === -Infinity) multiple = value
  if (multiple % factorMultiple === 0) return true
  const normal = Math.floor(multiple + 0.5)
  return normal / factor === value && normal % factorMultiple === 0
}

// supports only JSON-stringifyable objects, defaults to false for unsupported
// also uses ===, not Object.is, i.e. 0 === -0, NaN !== NaN
// symbols and non-enumerable properties are ignored!
const deepEqual = (obj, obj2) => {
  if (obj === obj2) return true
  if (!obj || !obj2 || typeof obj !== typeof obj2) return false
  if (obj !== obj2 && typeof obj !== 'object') return false

  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.getPrototypeOf(obj2)) return false

  if (proto === Array.prototype) {
    if (!Array.isArray(obj) || !Array.isArray(obj2)) return false
    if (obj.length !== obj2.length) return false
    return obj.every((x, i) => deepEqual(x, obj2[i]))
  } else if (proto === Object.prototype) {
    const [keys, keys2] = [Object.keys(obj), Object.keys(obj2)]
    if (keys.length !== keys2.length) return false
    const keyset2 = new Set([...keys, ...keys2])
    return keyset2.size === keys.length && keys.every((key) => deepEqual(obj[key], obj2[key]))
  }
  return false
}

const unique = (array) => {
  if (array.length < 2) return true
  if (array.length === 2) return !deepEqual(array[0], array[1])
  const objects = []
  const primitives = array.length > 20 ? new Set() : null
  let primitivesCount = 0
  let pos = 0
  for (const item of array) {
    if (typeof item === 'object') {
      objects.push(item)
    } else if (primitives) {
      primitives.add(item)
      if (primitives.size !== ++primitivesCount) return false
    } else {
      if (array.indexOf(item, pos + 1) !== -1) return false
    }
    pos++
  }
  for (let i = 1; i < objects.length; i++)
    for (let j = 0; j < i; j++) if (deepEqual(objects[i], objects[j])) return false
  return true
}

const deBase64 = (string) => {
  if (typeof Buffer !== 'undefined') return Buffer.from(string, 'base64').toString('utf-8')
  const b = atob(string)
  return new TextDecoder('utf-8').decode(new Uint8Array(b.length).map((_, i) => b.charCodeAt(i)))
}

const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)
// special handling for stringification
hasOwn[Symbol.for('toJayString')] = 'Function.prototype.call.bind(Object.prototype.hasOwnProperty)'

// Used for error generation. Affects error performance, optimized
const pointerPart = (s) => (/~\//.test(s) ? `${s}`.replace(/~/g, '~0').replace(/\//g, '~1') : s)
const toPointer = (path) => (path.length === 0 ? '#' : `#/${path.map(pointerPart).join('/')}`)

const errorMerge = ({ keywordLocation, instanceLocation }, schemaBase, dataBase) => ({
  keywordLocation: `${schemaBase}${keywordLocation.slice(1)}`,
  instanceLocation: `${dataBase}${instanceLocation.slice(1)}`,
})

const propertyIn = (key, [properties, patterns]) =>
  properties.includes(true) ||
  properties.some((prop) => prop === key) ||
  patterns.some((pattern) => new RegExp(pattern, 'u').test(key))

// id is verified to start with '#' at compile time, hence using plain objects is safe
const dynamicResolve = (anchors, id) => (anchors.filter((x) => x[id])[0] || {})[id]

const extraUtils = { toPointer, pointerPart, errorMerge, propertyIn, dynamicResolve }
module.exports = { stringLength, isMultipleOf, deepEqual, unique, deBase64, hasOwn, ...extraUtils }

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2}],14:[function(require,module,exports){
'use strict'

const { safe } = require('./safe-format')

const caches = new WeakMap()

// Given a scope object, generates new symbol/loop/pattern/format/ref variable names,
// also stores in-scope format/ref mapping to variable names

const scopeMethods = (scope) => {
  // cache meta info for known scope variables, per meta type
  if (!caches.has(scope))
    caches.set(scope, { sym: new Map(), ref: new Map(), format: new Map(), pattern: new Map() })
  const cache = caches.get(scope)

  // Generic variable names, requires a base name aka prefix
  const gensym = (name) => {
    if (!cache.sym.get(name)) cache.sym.set(name, 0)
    const index = cache.sym.get(name)
    cache.sym.set(name, index + 1)
    return safe(`${name}${index}`)
  }

  // Regexp pattern names
  const genpattern = (p) => {
    if (cache.pattern.has(p)) return cache.pattern.get(p)
    const n = gensym('pattern')
    scope[n] = new RegExp(p, 'u')
    cache.pattern.set(p, n)
    return n
  }

  // Loop variable names
  if (!cache.loop) cache.loop = 'ijklmnopqrstuvxyz'.split('')
  const genloop = () => {
    const v = cache.loop.shift()
    cache.loop.push(`${v}${v[0]}`)
    return safe(v)
  }

  // Reference (validator function) names
  const getref = (sub) => cache.ref.get(sub)
  const genref = (sub) => {
    const n = gensym('ref')
    cache.ref.set(sub, n)
    return n
  }

  // Format validation function names
  const genformat = (impl) => {
    let n = cache.format.get(impl)
    if (!n) {
      n = gensym('format')
      scope[n] = impl
      cache.format.set(impl, n)
    }
    return n
  }

  return { gensym, genpattern, genloop, getref, genref, genformat }
}

module.exports = { scopeMethods }

},{"./safe-format":12}],15:[function(require,module,exports){
'use strict'

/* This file implements operations for static tracing of evaluated items/properties, which is also
 * used to determine whether dynamic evaluated tracing is required or the schema can be compiled
 * with only statical checks.
 *
 * That is done by keeping track of evaluated and potentially evaluated and accounting to that
 * while doing merges and intersections.
 *
 * isDynamic() checks that all potentially evaluated are also definitely evaluated, seperately
 * for items and properties, for use with unevaluatedItems and unevaluatedProperties.
 *
 * WARNING: it is important that this doesn't produce invalid information. i.e.:
 *  * Extra properties or patterns, too high items
 *  * Missing dyn.properties or dyn.patterns, too low dyn.items
 *  * Extra fullstring flag or required entries
 *  * Missing types, if type is present
 *  * Missing unknown or dyn.item
 *
 * The other way around is non-optimal but safe.
 *
 * null means any type (i.e. any type is possible, not validated)
 * true in properties means any property (i.e. all properties were evaluated)
 * fullstring means that the object is not an unvalidated string (i.e. is either validated or not a string)
 * unknown means that there could be evaluated items or properties unknown to both top-level or dyn
 * dyn.item (bool) means there could be possible specific evaluated items, e.g. from "contains".
 *
 * For normalization:
 *   1. If type is applicable:
 *     * dyn.items >= items,
 *     * dyn.properties includes properties
 *     * dyn.patterns includes patterns.
 *   2. If type is not applicable, the following rules apply:
 *     * `fullstring = true` if `string` type is not applicable
 *     * `items = Infinity`, `dyn.item = false`, `dyn.items = 0` if `array` type is not applicable
 *     * `properties = [true]`, `dyn.properties = []` if `object` type is not applicable
 *     * `patterns = dyn.patterns = []` if `object` type is not applicable
 *     * `required = []` if `object` type is not applicable
 *
 * That allows to simplify the `or` operation.
 */

const merge = (a, b) => [...new Set([...a, ...b])].sort()
const intersect = (a, b) => a.filter((x) => b.includes(x))
const wrapArgs = (f) => (...args) => f(...args.map(normalize))
const wrapFull = (f) => (...args) => normalize(f(...args.map(normalize)))
const typeIsNot = (type, t) => type && !type.includes(t) // type=null means any and includes anything

const normalize = ({ type = null, dyn: d = {}, ...A }) => ({
  type: type ? [...type].sort() : type,
  items: typeIsNot(type, 'array') ? Infinity : A.items || 0,
  properties: typeIsNot(type, 'object') ? [true] : [...(A.properties || [])].sort(),
  patterns: typeIsNot(type, 'object') ? [] : [...(A.patterns || [])].sort(),
  required: typeIsNot(type, 'object') ? [] : [...(A.required || [])].sort(),
  fullstring: typeIsNot(type, 'string') || A.fullstring || false,
  dyn: {
    item: typeIsNot(type, 'array') ? false : d.item || false,
    items: typeIsNot(type, 'array') ? 0 : Math.max(A.items || 0, d.items || 0),
    properties: typeIsNot(type, 'object') ? [] : merge(A.properties || [], d.properties || []),
    patterns: typeIsNot(type, 'object') ? [] : merge(A.patterns || [], d.patterns || []),
  },
  unknown: (A.unknown && !(typeIsNot(type, 'object') && typeIsNot(type, 'array'))) || false,
})

const initTracing = () => normalize({})

// Result means that both sets A and B are correct
// type is intersected, lists of known properties are merged
const andDelta = wrapFull((A, B) => ({
  type: A.type && B.type ? intersect(A.type, B.type) : A.type || B.type || null,
  items: Math.max(A.items, B.items),
  properties: merge(A.properties, B.properties),
  patterns: merge(A.patterns, B.patterns),
  required: merge(A.required, B.required),
  fullstring: A.fullstring || B.fullstring,
  dyn: {
    item: A.dyn.item || B.dyn.item,
    items: Math.max(A.dyn.items, B.dyn.items),
    properties: merge(A.dyn.properties, B.dyn.properties),
    patterns: merge(A.dyn.patterns, B.dyn.patterns),
  },
  unknown: A.unknown || B.unknown,
}))

const regtest = (pattern, value) => value !== true && new RegExp(pattern, 'u').test(value)

const intersectProps = ({ properties: a, patterns: rega }, { properties: b, patterns: regb }) => {
  // properties
  const af = a.filter((x) => b.includes(x) || b.includes(true) || regb.some((p) => regtest(p, x)))
  const bf = b.filter((x) => a.includes(x) || a.includes(true) || rega.some((p) => regtest(p, x)))
  // patterns
  const ar = rega.filter((x) => regb.includes(x) || b.includes(true))
  const br = regb.filter((x) => rega.includes(x) || a.includes(true))
  return { properties: merge(af, bf), patterns: merge(ar, br) }
}

const inProperties = ({ properties: a, patterns: rega }, { properties: b, patterns: regb }) =>
  b.every((x) => a.includes(x) || a.includes(true) || rega.some((p) => regtest(p, x))) &&
  regb.every((x) => rega.includes(x) || a.includes(true))

// Result means that at least one of sets A and B is correct
// type is merged, lists of known properties are intersected, lists of dynamic properties are merged
const orDelta = wrapFull((A, B) => ({
  type: A.type && B.type ? merge(A.type, B.type) : null,
  items: Math.min(A.items, B.items),
  ...intersectProps(A, B),
  required:
    (typeIsNot(A.type, 'object') && B.required) ||
    (typeIsNot(B.type, 'object') && A.required) ||
    intersect(A.required, B.required),
  fullstring: A.fullstring && B.fullstring,
  dyn: {
    item: A.dyn.item || B.dyn.item,
    items: Math.max(A.dyn.items, B.dyn.items),
    properties: merge(A.dyn.properties, B.dyn.properties),
    patterns: merge(A.dyn.patterns, B.dyn.patterns),
  },
  unknown: A.unknown || B.unknown,
}))

const applyDelta = (stat, delta) => Object.assign(stat, andDelta(stat, delta))

const isDynamic = wrapArgs(({ unknown, items, dyn, ...stat }) => ({
  items: items !== Infinity && (unknown || dyn.items > items || dyn.item),
  properties: !stat.properties.includes(true) && (unknown || !inProperties(stat, dyn)),
}))

module.exports = { initTracing, andDelta, orDelta, applyDelta, isDynamic, inProperties }

},{}]},{},[4])(4)
});
