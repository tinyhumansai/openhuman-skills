/* Bundled skill with esbuild */
var __skill_bundle = (() => {
 var __defProp = Object.defineProperty;
 var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
 var __getOwnPropNames = Object.getOwnPropertyNames;
 var __hasOwnProp = Object.prototype.hasOwnProperty;
 var __export = (target, all) => {
  for (var name in all)
   __defProp(target, name, { get: all[name], enumerable: true });
 };
 var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
   for (let key of __getOwnPropNames(from))
    if (!__hasOwnProp.call(to, key) && key !== except)
     __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
 };
 var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

 // skills-ts-out/helpers/index.js
 var index_exports = {};
 __export(index_exports, {
  isSensitiveText: () => isSensitiveText
 });

 // scripts/polyfills/buffer.js
 var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
 var BASE64_URL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
 function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (v && typeof v === "object") {
   if (typeof v.toJSNumber === "function") {
    return v.toJSNumber();
   }
   if (typeof v.value === "bigint") {
    return Number(v.value);
   }
   if (typeof v.valueOf === "function") {
    const val = v.valueOf();
    if (typeof val === "bigint") return Number(val);
    if (typeof val === "number") return val;
   }
  }
  return Number(v);
 }
 function base64Encode(bytes, urlSafe = false) {
  const chars = urlSafe ? BASE64_URL_CHARS : BASE64_CHARS;
  let result = "";
  const len = bytes.length;
  let i = 0;
  while (i < len) {
   const a = bytes[i++];
   const b = i < len ? bytes[i++] : 0;
   const c = i < len ? bytes[i++] : 0;
   const triplet = a << 16 | b << 8 | c;
   result += chars[triplet >> 18 & 63];
   result += chars[triplet >> 12 & 63];
   result += i > len + 1 ? urlSafe ? "" : "=" : chars[triplet >> 6 & 63];
   result += i > len ? urlSafe ? "" : "=" : chars[triplet & 63];
  }
  return result;
 }
 function base64Decode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const chars = BASE64_CHARS;
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
   lookup[chars.charCodeAt(i)] = i;
  }
  const len = str.length;
  let bufferLength = len * 3 / 4;
  if (str[len - 1] === "=") bufferLength--;
  if (str[len - 2] === "=") bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
   const encoded1 = lookup[str.charCodeAt(i)];
   const encoded2 = lookup[str.charCodeAt(i + 1)];
   const encoded3 = lookup[str.charCodeAt(i + 2)];
   const encoded4 = lookup[str.charCodeAt(i + 3)];
   bytes[p++] = encoded1 << 2 | encoded2 >> 4;
   if (p < bufferLength) bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
   if (p < bufferLength) bytes[p++] = (encoded3 & 3) << 6 | encoded4;
  }
  return bytes;
 }
 var Buffer2 = class _Buffer extends Uint8Array {
  /**
  * Create a new Buffer. Handles BigInt and big-integer library objects.
  */
  constructor(arg1, arg2, arg3) {
   if (typeof arg1 === "bigint" || arg1 && typeof arg1 === "object" && typeof arg1.toJSNumber === "function") {
    super(toNumber(arg1));
   } else if (typeof arg1 === "number") {
    super(arg1);
   } else if (arg1 instanceof ArrayBuffer) {
    const offset = toNumber(arg2) || 0;
    const length = arg3 !== void 0 ? toNumber(arg3) : void 0;
    if (length !== void 0) {
     super(arg1, offset, length);
    } else {
     super(arg1, offset);
    }
   } else if (ArrayBuffer.isView(arg1)) {
    super(arg1);
   } else if (Array.isArray(arg1)) {
    const numArr = arg1.map(toNumber);
    super(numArr);
   } else if (arg1 && typeof arg1.length === "number") {
    const arr = Array.from(arg1, toNumber);
    super(arr);
   } else {
    super(arg1);
   }
  }
  /**
  * Create a Buffer from various input types.
  */
  static from(data, encodingOrOffset, length) {
   if (typeof data === "bigint" || data && typeof data === "object" && typeof data.toJSNumber === "function") {
    let bigVal = typeof data === "bigint" ? data : data.value;
    if (typeof bigVal !== "bigint") bigVal = BigInt(data.valueOf());
    const isNegative = bigVal < 0n;
    if (isNegative) bigVal = -bigVal;
    const bytes = [];
    while (bigVal > 0n) {
     bytes.push(Number(bigVal & 0xffn));
     bigVal >>= 8n;
    }
    if (bytes.length === 0) bytes.push(0);
    if (isNegative) {
     let carry = 1;
     for (let i = 0; i < bytes.length; i++) {
      const val = (~bytes[i] & 255) + carry;
      bytes[i] = val & 255;
      carry = val >> 8;
     }
     if ((bytes[bytes.length - 1] & 128) === 0) {
      bytes.push(255);
     }
    } else {
     if ((bytes[bytes.length - 1] & 128) !== 0) {
      bytes.push(0);
     }
    }
    return new _Buffer(bytes);
   }
   if (data instanceof ArrayBuffer) {
    return new _Buffer(data, encodingOrOffset || 0, length);
   }
   if (ArrayBuffer.isView(data)) {
    return new _Buffer(data.buffer, data.byteOffset, data.byteLength);
   }
   if (typeof data === "string") {
    const encoding = encodingOrOffset || "utf8";
    return _Buffer.fromString(data, encoding);
   }
   if (Array.isArray(data)) {
    const numData = data.map(toNumber);
    return new _Buffer(numData);
   }
   if (typeof data === "object" && data !== null && typeof data.length === "number") {
    const arr = Array.from(data, toNumber);
    return new _Buffer(arr);
   }
   throw new TypeError(
    "First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object"
   );
  }
  static fromString(str, encoding) {
   encoding = (encoding || "utf8").toLowerCase();
   switch (encoding) {
    case "utf8":
    case "utf-8":
     return new _Buffer(new TextEncoder().encode(str));
    case "hex":
     return _Buffer.fromHex(str);
    case "base64":
     return new _Buffer(base64Decode(str));
    case "base64url":
     return new _Buffer(base64Decode(str));
    case "binary":
    case "latin1":
     const bytes = new Uint8Array(str.length);
     for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 255;
     }
     return new _Buffer(bytes);
    default:
     throw new Error(`Unknown encoding: ${encoding}`);
   }
  }
  static fromHex(hex) {
   hex = hex.replace(/\s/g, "");
   if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
   }
   const bytes = new Uint8Array(hex.length / 2);
   for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
   }
   return new _Buffer(bytes);
  }
  static alloc(size, fill = 0, encoding) {
   const numSize = typeof size === "bigint" ? Number(size) : size;
   const buf = new _Buffer(numSize);
   if (fill !== 0) {
    if (typeof fill === "string") {
     const fillBuf = _Buffer.from(fill, encoding);
     for (let i = 0; i < numSize; i++) {
      buf[i] = fillBuf[i % fillBuf.length];
     }
    } else if (typeof fill === "number") {
     buf.fill(fill);
    }
   }
   return buf;
  }
  static allocUnsafe(size) {
   const numSize = typeof size === "bigint" ? Number(size) : size;
   return new _Buffer(numSize);
  }
  static allocUnsafeSlow(size) {
   const numSize = typeof size === "bigint" ? Number(size) : size;
   return new _Buffer(numSize);
  }
  static concat(list, totalLength) {
   if (!Array.isArray(list)) {
    throw new TypeError("list argument must be an array");
   }
   if (list.length === 0) {
    return _Buffer.alloc(0);
   }
   if (totalLength === void 0) {
    totalLength = list.reduce((sum, buf) => sum + buf.length, 0);
   }
   const result = _Buffer.alloc(totalLength);
   let offset = 0;
   for (const buf of list) {
    const len = Math.min(buf.length, totalLength - offset);
    result.set(buf.subarray(0, len), offset);
    offset += len;
    if (offset >= totalLength) break;
   }
   return result;
  }
  static isBuffer(obj) {
   return obj instanceof _Buffer || obj instanceof Uint8Array;
  }
  static isEncoding(encoding) {
   return ["utf8", "utf-8", "hex", "base64", "base64url", "binary", "latin1"].includes(
    (encoding || "").toLowerCase()
   );
  }
  static byteLength(string, encoding = "utf8") {
   if (typeof string !== "string") {
    return string.length;
   }
   return _Buffer.from(string, encoding).length;
  }
  static compare(a, b) {
   if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    throw new TypeError("Arguments must be Buffers");
   }
   const len = Math.min(a.length, b.length);
   for (let i = 0; i < len; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
   }
   if (a.length < b.length) return -1;
   if (a.length > b.length) return 1;
   return 0;
  }
  toString(encoding = "utf8", start = 0, end = this.length) {
   encoding = encoding.toLowerCase();
   const slice = this.subarray(start, end);
   switch (encoding) {
    case "utf8":
    case "utf-8":
     return new TextDecoder().decode(slice);
    case "hex":
     return Array.from(slice).map((b) => b.toString(16).padStart(2, "0")).join("");
    case "base64":
     return base64Encode(slice, false);
    case "base64url":
     return base64Encode(slice, true);
    case "binary":
    case "latin1":
     return Array.from(slice).map((b) => String.fromCharCode(b)).join("");
    default:
     throw new Error(`Unknown encoding: ${encoding}`);
   }
  }
  toJSON() {
   return { type: "Buffer", data: Array.from(this) };
  }
  equals(other) {
   if (!(other instanceof Uint8Array)) return false;
   if (this.length !== other.length) return false;
   for (let i = 0; i < this.length; i++) {
    if (this[i] !== other[i]) return false;
   }
   return true;
  }
  compare(target, targetStart = 0, targetEnd = target.length, sourceStart = 0, sourceEnd = this.length) {
   const source = this.subarray(sourceStart, sourceEnd);
   const targetSlice = target.subarray(targetStart, targetEnd);
   return _Buffer.compare(source, targetSlice);
  }
  copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
   const source = this.subarray(sourceStart, sourceEnd);
   target.set(source, targetStart);
   return source.length;
  }
  slice(start, end) {
   return new _Buffer(
    this.buffer,
    this.byteOffset + (start || 0),
    (end || this.length) - (start || 0)
   );
  }
  subarray(start, end) {
   const sub = super.subarray(start, end);
   return new _Buffer(sub.buffer, sub.byteOffset, sub.byteLength);
  }
  write(string, offset = 0, length = this.length - offset, encoding = "utf8") {
   const buf = _Buffer.from(string, encoding);
   const len = Math.min(buf.length, length);
   this.set(buf.subarray(0, len), offset);
   return len;
  }
  // Read methods
  readUInt8(offset = 0) {
   return this[offset];
  }
  readUInt16LE(offset = 0) {
   return this[offset] | this[offset + 1] << 8;
  }
  readUInt16BE(offset = 0) {
   return this[offset] << 8 | this[offset + 1];
  }
  readUInt32LE(offset = 0) {
   return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24) >>> 0;
  }
  readUInt32BE(offset = 0) {
   return (this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]) >>> 0;
  }
  readInt8(offset = 0) {
   const val = this[offset];
   return val & 128 ? val - 256 : val;
  }
  readInt16LE(offset = 0) {
   const val = this[offset] | this[offset + 1] << 8;
   return val & 32768 ? val - 65536 : val;
  }
  readInt16BE(offset = 0) {
   const val = this[offset] << 8 | this[offset + 1];
   return val & 32768 ? val - 65536 : val;
  }
  readInt32LE(offset = 0) {
   return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  }
  readInt32BE(offset = 0) {
   return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  }
  readBigInt64LE(offset = 0) {
   const lo = this.readUInt32LE(offset);
   const hi = this.readInt32LE(offset + 4);
   return BigInt(lo) | BigInt(hi) << 32n;
  }
  readBigInt64BE(offset = 0) {
   const hi = this.readInt32BE(offset);
   const lo = this.readUInt32BE(offset + 4);
   return BigInt(lo) | BigInt(hi) << 32n;
  }
  readBigUInt64LE(offset = 0) {
   const lo = this.readUInt32LE(offset);
   const hi = this.readUInt32LE(offset + 4);
   return BigInt(lo) | BigInt(hi) << 32n;
  }
  readBigUInt64BE(offset = 0) {
   const hi = this.readUInt32BE(offset);
   const lo = this.readUInt32BE(offset + 4);
   return BigInt(lo) | BigInt(hi) << 32n;
  }
  readFloatLE(offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 4);
   return view.getFloat32(0, true);
  }
  readFloatBE(offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 4);
   return view.getFloat32(0, false);
  }
  readDoubleLE(offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 8);
   return view.getFloat64(0, true);
  }
  readDoubleBE(offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 8);
   return view.getFloat64(0, false);
  }
  // Write methods
  writeUInt8(value, offset = 0) {
   this[offset] = value & 255;
   return offset + 1;
  }
  writeUInt16LE(value, offset = 0) {
   this[offset] = value & 255;
   this[offset + 1] = value >> 8 & 255;
   return offset + 2;
  }
  writeUInt16BE(value, offset = 0) {
   this[offset] = value >> 8 & 255;
   this[offset + 1] = value & 255;
   return offset + 2;
  }
  writeUInt32LE(value, offset = 0) {
   this[offset] = value & 255;
   this[offset + 1] = value >> 8 & 255;
   this[offset + 2] = value >> 16 & 255;
   this[offset + 3] = value >> 24 & 255;
   return offset + 4;
  }
  writeUInt32BE(value, offset = 0) {
   this[offset] = value >> 24 & 255;
   this[offset + 1] = value >> 16 & 255;
   this[offset + 2] = value >> 8 & 255;
   this[offset + 3] = value & 255;
   return offset + 4;
  }
  writeInt8(value, offset = 0) {
   if (value < 0) value = 256 + value;
   this[offset] = value & 255;
   return offset + 1;
  }
  writeInt16LE(value, offset = 0) {
   this[offset] = value & 255;
   this[offset + 1] = value >> 8 & 255;
   return offset + 2;
  }
  writeInt16BE(value, offset = 0) {
   this[offset] = value >> 8 & 255;
   this[offset + 1] = value & 255;
   return offset + 2;
  }
  writeInt32LE(value, offset = 0) {
   this[offset] = value & 255;
   this[offset + 1] = value >> 8 & 255;
   this[offset + 2] = value >> 16 & 255;
   this[offset + 3] = value >> 24 & 255;
   return offset + 4;
  }
  writeInt32BE(value, offset = 0) {
   this[offset] = value >> 24 & 255;
   this[offset + 1] = value >> 16 & 255;
   this[offset + 2] = value >> 8 & 255;
   this[offset + 3] = value & 255;
   return offset + 4;
  }
  writeBigInt64LE(value, offset = 0) {
   const lo = Number(value & 0xffffffffn);
   const hi = Number(value >> 32n & 0xffffffffn);
   this.writeUInt32LE(lo, offset);
   this.writeInt32LE(hi, offset + 4);
   return offset + 8;
  }
  writeBigInt64BE(value, offset = 0) {
   const lo = Number(value & 0xffffffffn);
   const hi = Number(value >> 32n & 0xffffffffn);
   this.writeInt32BE(hi, offset);
   this.writeUInt32BE(lo, offset + 4);
   return offset + 8;
  }
  writeBigUInt64LE(value, offset = 0) {
   const lo = Number(value & 0xffffffffn);
   const hi = Number(value >> 32n & 0xffffffffn);
   this.writeUInt32LE(lo, offset);
   this.writeUInt32LE(hi, offset + 4);
   return offset + 8;
  }
  writeBigUInt64BE(value, offset = 0) {
   const lo = Number(value & 0xffffffffn);
   const hi = Number(value >> 32n & 0xffffffffn);
   this.writeUInt32BE(hi, offset);
   this.writeUInt32BE(lo, offset + 4);
   return offset + 8;
  }
  writeFloatLE(value, offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 4);
   view.setFloat32(0, value, true);
   return offset + 4;
  }
  writeFloatBE(value, offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 4);
   view.setFloat32(0, value, false);
   return offset + 4;
  }
  writeDoubleLE(value, offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 8);
   view.setFloat64(0, value, true);
   return offset + 8;
  }
  writeDoubleBE(value, offset = 0) {
   const view = new DataView(this.buffer, this.byteOffset + offset, 8);
   view.setFloat64(0, value, false);
   return offset + 8;
  }
  // Swap methods
  swap16() {
   for (let i = 0; i < this.length; i += 2) {
    const a = this[i];
    this[i] = this[i + 1];
    this[i + 1] = a;
   }
   return this;
  }
  swap32() {
   for (let i = 0; i < this.length; i += 4) {
    const a = this[i];
    const b = this[i + 1];
    this[i] = this[i + 3];
    this[i + 1] = this[i + 2];
    this[i + 2] = b;
    this[i + 3] = a;
   }
   return this;
  }
  swap64() {
   for (let i = 0; i < this.length; i += 8) {
    for (let j = 0; j < 4; j++) {
     const a = this[i + j];
     this[i + j] = this[i + 7 - j];
     this[i + 7 - j] = a;
    }
   }
   return this;
  }
  indexOf(value, byteOffset = 0, encoding = "utf8") {
   if (typeof value === "string") {
    value = _Buffer.from(value, encoding);
   } else if (typeof value === "number") {
    for (let i = byteOffset; i < this.length; i++) {
     if (this[i] === value) return i;
    }
    return -1;
   }
   outer: for (let i = byteOffset; i <= this.length - value.length; i++) {
    for (let j = 0; j < value.length; j++) {
     if (this[i + j] !== value[j]) continue outer;
    }
    return i;
   }
   return -1;
  }
  includes(value, byteOffset = 0, encoding = "utf8") {
   return this.indexOf(value, byteOffset, encoding) !== -1;
  }
 };

 // scripts/polyfills/buffer-inject.js
 if (typeof globalThis !== "undefined") {
  globalThis.Buffer = Buffer2;
 }
 if (typeof window !== "undefined") {
  window.Buffer = Buffer2;
 }
 if (typeof global !== "undefined") {
  global.Buffer = Buffer2;
 }

 // skills-ts-out/helpers/sensitive-filter.js
 var SENSITIVE_PHRASES = [
  // Password reset / change
  "password reset",
  "reset your password",
  "forgot password",
  "change your password",
  "reset password link",
  "set your password",
  "new password",
  "password change",
  "reset password request",
  "unlock your account",
  // OTP / verification codes
  "verification code",
  "one-time",
  "one time password",
  "your code is",
  "confirm your email",
  "security code",
  "confirmation code",
  "activation code",
  "pin code",
  "one-time code",
  "temporary code",
  "verification link",
  // 2FA / MFA
  "two-factor",
  "2fa",
  "two factor",
  "authenticator",
  "backup code",
  "two-step verification",
  "multi-factor",
  "mfa",
  "security key",
  "recovery code",
  // Login / magic links
  "log in to",
  "sign in with this link",
  "magic link",
  "click to sign in",
  "verify your email",
  "login link",
  "sign in link",
  "secure sign in",
  "one-time link",
  "temporary link",
  "access link",
  "secure link",
  // Account / identity
  "verify your identity",
  "unusual sign-in",
  "suspicious activity",
  "account recovery",
  "recover your account",
  // Financial / card
  "transaction verification",
  "payment verification",
  "card verification",
  "cvv",
  "card number",
  // Warnings
  "do not share",
  "never share this",
  "this code expires"
 ];
 var SENSITIVE_STANDALONE_WORDS = ["otp"];
 function isSensitiveText(text) {
  if (typeof text !== "string")
   return false;
  const normalized = text.trim().toLowerCase();
  if (normalized.length === 0)
   return false;
  for (const phrase of SENSITIVE_PHRASES) {
   if (normalized.includes(phrase))
    return true;
  }
  for (const word of SENSITIVE_STANDALONE_WORDS) {
   const re = new RegExp("\\b" + escapeRegex(word) + "\\b", "i");
   if (re.test(normalized))
    return true;
  }
  return false;
 }
 function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 }
 return __toCommonJS(index_exports);
})();

// Expose skill bundle to globalThis for runtime access.
(function() {
 var skill = null;
 if (typeof __skill_bundle === 'object' && __skill_bundle !== null) {
  skill = __skill_bundle.default || __skill_bundle;
 }

 // Attach tools: prefer skill.tools, then globalThis.tools (set by bare assignment in IIFE)
 if (skill && !skill.tools && globalThis.tools) {
  skill.tools = globalThis.tools;
 }

 console.log('skill', skill);
 globalThis.__skill = { default: skill };
})();
