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

 // skills-ts-out/core/notion/index.js
 var index_exports = {};
 __export(index_exports, {
  default: () => index_default
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
    const isNegative = bigVal < /* @__PURE__ */ BigInt("0");
    if (isNegative) bigVal = -bigVal;
    const bytes = [];
    while (bigVal > /* @__PURE__ */ BigInt("0")) {
     bytes.push(Number(bigVal & /* @__PURE__ */ BigInt("0xff")));
     bigVal >>= /* @__PURE__ */ BigInt("8");
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
  toString(encoding = "utf8", start2 = 0, end = this.length) {
   encoding = encoding.toLowerCase();
   const slice = this.subarray(start2, end);
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
  slice(start2, end) {
   return new _Buffer(
    this.buffer,
    this.byteOffset + (start2 || 0),
    (end || this.length) - (start2 || 0)
   );
  }
  subarray(start2, end) {
   const sub = super.subarray(start2, end);
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
   return BigInt(lo) | BigInt(hi) << /* @__PURE__ */ BigInt("32");
  }
  readBigInt64BE(offset = 0) {
   const hi = this.readInt32BE(offset);
   const lo = this.readUInt32BE(offset + 4);
   return BigInt(lo) | BigInt(hi) << /* @__PURE__ */ BigInt("32");
  }
  readBigUInt64LE(offset = 0) {
   const lo = this.readUInt32LE(offset);
   const hi = this.readUInt32LE(offset + 4);
   return BigInt(lo) | BigInt(hi) << /* @__PURE__ */ BigInt("32");
  }
  readBigUInt64BE(offset = 0) {
   const hi = this.readUInt32BE(offset);
   const lo = this.readUInt32BE(offset + 4);
   return BigInt(lo) | BigInt(hi) << /* @__PURE__ */ BigInt("32");
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
   const lo = Number(value & /* @__PURE__ */ BigInt("0xffffffff"));
   const hi = Number(value >> /* @__PURE__ */ BigInt("32") & /* @__PURE__ */ BigInt("0xffffffff"));
   this.writeUInt32LE(lo, offset);
   this.writeInt32LE(hi, offset + 4);
   return offset + 8;
  }
  writeBigInt64BE(value, offset = 0) {
   const lo = Number(value & /* @__PURE__ */ BigInt("0xffffffff"));
   const hi = Number(value >> /* @__PURE__ */ BigInt("32") & /* @__PURE__ */ BigInt("0xffffffff"));
   this.writeInt32BE(hi, offset);
   this.writeUInt32BE(lo, offset + 4);
   return offset + 8;
  }
  writeBigUInt64LE(value, offset = 0) {
   const lo = Number(value & /* @__PURE__ */ BigInt("0xffffffff"));
   const hi = Number(value >> /* @__PURE__ */ BigInt("32") & /* @__PURE__ */ BigInt("0xffffffff"));
   this.writeUInt32LE(lo, offset);
   this.writeUInt32LE(hi, offset + 4);
   return offset + 8;
  }
  writeBigUInt64BE(value, offset = 0) {
   const lo = Number(value & /* @__PURE__ */ BigInt("0xffffffff"));
   const hi = Number(value >> /* @__PURE__ */ BigInt("32") & /* @__PURE__ */ BigInt("0xffffffff"));
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

 // skills-ts-out/core/notion/helpers.js
 var MAX_RETRIES = 3;
 var DEFAULT_BACKOFF_MS = 5e3;
 var CLOUDFLARE_RETRYABLE = /* @__PURE__ */ new Set([520, 521, 522, 523, 524, 525, 526, 527]);
 var NOTION_API_VERSION = "2026-03-11";
 function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
  }
 }
 function getNotionAuth() {
  const authCred = auth.getCredential();
  if (authCred && authCred.mode !== "managed") {
   const creds = authCred.credentials;
   const token = creds.api_token || creds.content || creds.access_token;
   if (token) {
    return { type: "token", token };
   }
  }
  const oauthCred = oauth.getCredential();
  if (oauthCred) {
   return { type: "proxy" };
  }
  return null;
 }
 function isNotionConnected() {
  return getNotionAuth() !== null;
 }
 function notionFetch(endpoint, options = {}) {
  const notionAuth = getNotionAuth();
  if (!notionAuth)
   throw new Error("Notion not connected. Please complete setup first.");
  const method = options.method || "GET";
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiVersion = NOTION_API_VERSION;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
   let response;
   const t0 = Date.now();
   if (notionAuth.type === "token") {
    const url = `https://api.notion.com/v1${path}`;
    console.log(`[notion][fetch] ${method} ${url} (direct, attempt ${attempt})`);
    response = net.fetch(url, {
     method,
     headers: {
      Authorization: `Bearer ${notionAuth.token}`,
      "Content-Type": "application/json",
      "Notion-Version": apiVersion
     },
     body: options.body ? JSON.stringify(options.body) : void 0,
     timeout: 30
    });
   } else {
    console.log(`[notion][fetch] ${method} ${path} (oauth.fetch proxy, attempt ${attempt})`);
    response = oauth.fetch(path, {
     method,
     headers: { "Content-Type": "application/json", "Notion-Version": apiVersion },
     body: options.body ? JSON.stringify(options.body) : void 0,
     timeout: 30
    });
   }
   const elapsed = Date.now() - t0;
   const bodyLen = response.body ? response.body.length : 0;
   console.log(`[notion][fetch] ${method} ${path} status=${response.status} (${elapsed}ms, ${bodyLen}b)`);
   if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = response.headers["retry-after"];
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1e3 : DEFAULT_BACKOFF_MS * (attempt + 1);
    console.warn(`[notion][helpers] 429 rate-limited \u2014 waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
    sleep(waitMs);
    continue;
   }
   if (CLOUDFLARE_RETRYABLE.has(response.status) && attempt < MAX_RETRIES) {
    const waitMs = DEFAULT_BACKOFF_MS * Math.pow(2, attempt);
    console.warn(`[notion][helpers] Cloudflare ${response.status} (transient) \u2014 waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
    sleep(waitMs);
    continue;
   }
   if (response.status >= 400) {
    const errorBody = response.body || "";
    const message = `Notion API error: ${response.status} \u2014 ${errorBody.slice(0, 300)}`;
    console.error("[notion][helpers] notionFetch error body:", errorBody);
    throw new Error(message);
   }
   const parsed = JSON.parse(response.body);
   return parsed;
  }
  throw new Error("Notion API error: request failed after maximum retries (rate limit or upstream timeout)");
 }
 function formatApiError(error) {
  const message = String(error);
  if (message.includes("401")) {
   return "Unauthorized. Check that your integration token is valid.";
  }
  if (message.includes("404")) {
   return "Not found. Make sure the page/database is shared with your integration.";
  }
  if (message.includes("429")) {
   return "Rate limited. Please try again in a moment.";
  }
  if (/52[0-7]/.test(message)) {
   return "Notion is temporarily unreachable (Cloudflare gateway error). The request will be retried automatically.";
  }
  if (message.includes("403")) {
   return "Forbidden. The integration may not have access to this resource.";
  }
  if (message.includes("invalid_version")) {
   return "API version not supported. The skill will automatically retry with a compatible version.";
  }
  if (message.includes("data_source")) {
   return "Database access issue. This may be due to API version compatibility. The skill will attempt to resolve this automatically.";
  }
  if (message.toLowerCase().includes("insufficient permissions") || message.toLowerCase().includes("insert comment")) {
   return 'Insufficient permissions: the Notion integration must have "Insert comment" (and optionally "Read comment") capability. Enable it in Notion: Settings & members \u2192 Connections \u2192 your integration \u2192 Capabilities.';
  }
  return message;
 }
 function formatRichText(richText) {
  if (!Array.isArray(richText))
   return "";
  return richText.map((rt) => {
   const item = rt;
   return item.plain_text || "";
  }).join("");
 }
 function formatPageTitle(page) {
  const props = page.properties;
  if (!props)
   return page.id;
  for (const key of Object.keys(props)) {
   const prop = props[key];
   if (prop.type === "title" && Array.isArray(prop.title)) {
    const title = formatRichText(prop.title);
    if (title)
     return title;
   }
  }
  return page.id;
 }
 function formatPageSummary(page) {
  return {
   id: page.id,
   title: formatPageTitle(page),
   url: page.url,
   created_time: page.created_time,
   last_edited_time: page.last_edited_time,
   archived: page.archived,
   parent_type: page.parent ? page.parent.type : void 0
  };
 }
 function formatDatabaseSummary(db2) {
  const title = Array.isArray(db2.title) ? formatRichText(db2.title) : "";
  return {
   id: db2.id,
   title: title || "(Untitled)",
   url: db2.url,
   created_time: db2.created_time,
   last_edited_time: db2.last_edited_time,
   property_count: Object.keys(db2.properties || {}).length
  };
 }
 function formatBlockContent(block) {
  const type = block.type;
  const content = block[type];
  if (!content)
   return `[${type}]`;
  if (content.rich_text && Array.isArray(content.rich_text)) {
   const text = formatRichText(content.rich_text);
   return text || `[empty ${type}]`;
  }
  if (content.children) {
   return `[${type} with children]`;
  }
  return `[${type}]`;
 }
 function formatBlockSummary(block) {
  return {
   id: block.id,
   type: block.type,
   has_children: block.has_children,
   content: formatBlockContent(block)
  };
 }
 function formatUserSummary(user) {
  let id = user.id;
  let name = user.name;
  let email;
  let avatarUrl = user.avatar_url;
  let userType = user.type;
  if (userType === "bot") {
   const bot = user.bot;
   const owner = bot ? bot.owner : void 0;
   const ownerUser = owner ? owner.user : void 0;
   const ownerPerson = ownerUser ? ownerUser.person : void 0;
   if (ownerUser) {
    id = ownerUser.id || id;
    name = ownerUser.name || name;
    avatarUrl = ownerUser.avatar_url || avatarUrl;
    userType = ownerUser.type || userType;
   }
   if (ownerPerson) {
    email = ownerPerson.email || email;
   }
  } else {
   const person = user.person;
   email = (person ? person.email : void 0) || user.email;
  }
  return {
   id,
   name: name !== null && name !== void 0 ? name : null,
   email: email !== null && email !== void 0 ? email : null,
   type: userType !== null && userType !== void 0 ? userType : null,
   avatar_url: avatarUrl !== null && avatarUrl !== void 0 ? avatarUrl : null
  };
 }
 function buildRichText(text) {
  return [{ type: "text", text: { content: text } }];
 }
 function buildParagraphBlock(text) {
  return { type: "paragraph", paragraph: { rich_text: buildRichText(text) } };
 }
 function fetchBlockTreeText(blockId, maxDepth = 2) {
  if (maxDepth < 0)
   return "";
  const lines = [];
  let startCursor;
  let hasMore = true;
  while (hasMore) {
   const endpoint = `/blocks/${blockId}/children?page_size=100${startCursor ? `&start_cursor=${startCursor}` : ""}`;
   let result;
   try {
    result = notionFetch(endpoint);
   } catch {
    break;
   }
   for (const block of result.results) {
    const text = formatBlockContent(block);
    if (text && !text.startsWith("[") && !text.endsWith("]")) {
     lines.push(text);
    } else if (text && text !== `[${block.type}]`) {
     const cleaned = text.replace(/^\[empty .*\]$/, "").trim();
     if (cleaned)
      lines.push(cleaned);
    }
    if (block.has_children && maxDepth > 0) {
     const childText = fetchBlockTreeText(block.id, maxDepth - 1);
     if (childText)
      lines.push(childText);
    }
   }
   hasMore = result.has_more;
   startCursor = result.next_cursor;
  }
  return lines.join("\n");
 }
 function resolveDataSourceId(databaseId) {
  try {
   const response = notionFetch(`/databases/${databaseId}`);
   if (response.data_sources && response.data_sources.length > 0) {
    const dataSourceId = response.data_sources[0].id;
    console.log(`[notion][helpers] Resolved database ${databaseId} to data source ${dataSourceId}`);
    return dataSourceId;
   }
   return databaseId;
  } catch (error) {
   console.log(`[notion][helpers] Error resolving data source for ${databaseId}, using original ID:`, error);
   return databaseId;
  }
 }
 function getQueryEndpoint(databaseId) {
  const dataSourceId = resolveDataSourceId(databaseId);
  return `/data_sources/${dataSourceId}/query`;
 }

 // skills-ts-out/core/notion/api/client.js
 function apiFetch(endpoint, options) {
  return notionFetch(endpoint, options);
 }

 // skills-ts-out/core/notion/api/blocks.js
 function getBlock(blockId) {
  return apiFetch(`/blocks/${blockId}`);
 }
 function getBlockChildren(blockId, pageSize = 50) {
  return apiFetch(`/blocks/${blockId}/children?page_size=${pageSize}`);
 }
 function appendBlockChildren(blockId, children) {
  return apiFetch(`/blocks/${blockId}/children`, {
   method: "PATCH",
   body: { children }
  });
 }
 function updateBlock(blockId, body) {
  return apiFetch(`/blocks/${blockId}`, { method: "PATCH", body });
 }
 function deleteBlock(blockId) {
  return apiFetch(`/blocks/${blockId}`, { method: "DELETE" });
 }

 // skills-ts-out/core/notion/api/comments.js
 function createComment(body) {
  return apiFetch("/comments", { method: "POST", body });
 }
 function listComments(blockId, pageSize = 20) {
  return apiFetch(`/comments?block_id=${blockId}&page_size=${pageSize}`);
 }

 // skills-ts-out/core/notion/api/databases.js
 function getDatabase(databaseId) {
  return apiFetch(`/databases/${databaseId}`);
 }
 function resolveDataSourceIdCompat(databaseId) {
  try {
   return resolveDataSourceId(databaseId);
  } catch (error) {
   throw new Error(`Database has no data sources or is not accessible. Share the database with your integration. ${formatApiError(error)}`);
  }
 }
 function getDataSource(dataSourceId) {
  return apiFetch(`/data_sources/${dataSourceId}`);
 }
 function queryDataSource(databaseId, body) {
  const endpoint = getQueryEndpoint(databaseId);
  const requestBody = body || {};
  console.log(`[notion][databases] Querying ${endpoint}`);
  return apiFetch(endpoint, { method: "POST", body: requestBody });
 }
 function createDatabase(body) {
  return apiFetch("/databases", { method: "POST", body });
 }
 function updateDatabase(databaseId, body) {
  return apiFetch(`/databases/${databaseId}`, { method: "PATCH", body });
 }
 function listAllDatabases(pageSize = 20) {
  const filter = { property: "object", value: "data_source" };
  return apiFetch("/search", {
   method: "POST",
   body: { filter, page_size: pageSize }
  });
 }

 // skills-ts-out/core/notion/api/pages.js
 function getPage(pageId) {
  return apiFetch(`/pages/${pageId}`);
 }
 function createPage(body) {
  return apiFetch("/pages", { method: "POST", body });
 }
 function updatePage(pageId, body) {
  return apiFetch(`/pages/${pageId}`, { method: "PATCH", body });
 }
 function archivePage(pageId) {
  return apiFetch(`/pages/${pageId}`, {
   method: "PATCH",
   body: { archived: true }
  });
 }
 function getPageContent(pageId, pageSize = 50) {
  return apiFetch(`/blocks/${pageId}/children?page_size=${pageSize}`);
 }

 // skills-ts-out/core/notion/api/search.js
 function search(body) {
  return apiFetch("/search", { method: "POST", body });
 }

 // skills-ts-out/core/notion/api/users.js
 function getUser(userId) {
  return apiFetch(`/users/${userId}`);
 }
 function listUsers(pageSize = 20, startCursor) {
  let endpoint = `/users?page_size=${pageSize}`;
  if (startCursor)
   endpoint += `&start_cursor=${startCursor}`;
  return apiFetch(endpoint);
 }

 // skills-ts-out/core/notion/api/index.js
 var notionApi = {
  // pages
  getPage,
  createPage,
  updatePage,
  archivePage,
  getPageContent,
  // databases
  getDatabase,
  resolveDataSourceId: resolveDataSourceIdCompat,
  getDataSource,
  queryDataSource,
  createDatabase,
  updateDatabase,
  listAllDatabases,
  // blocks
  getBlock,
  getBlockChildren,
  appendBlockChildren,
  updateBlock,
  deleteBlock,
  // users
  getUser,
  listUsers,
  // comments
  createComment,
  listComments,
  // search
  search
 };

 // skills-ts-out/core/notion/state.js
 function initNotionSkillState() {
  const s = {
   config: {
    credentialId: "",
    workspaceName: "",
    syncIntervalMinutes: 20,
    contentSyncEnabled: true,
    maxPagesPerContentSync: 500
   },
   syncStatus: {
    syncInProgress: false,
    lastSyncTime: 0,
    nextSyncTime: 0,
    totalPages: 0,
    totalDatabases: 0,
    totalDatabaseRows: 0,
    pagesWithContent: 0,
    pagesWithSummary: 0,
    summariesTotal: 0,
    summariesPending: 0,
    lastSyncError: null,
    lastSyncDurationMs: 0,
    syncPhase: null,
    syncProgress: 0,
    syncMessage: null
   },
   activeSessions: []
  };
  globalThis.__notionSkillState = s;
  return s;
 }
 initNotionSkillState();
 globalThis.getNotionSkillState = function getNotionSkillState() {
  const s = globalThis.__notionSkillState;
  if (!s) {
   throw new Error("[notion] Skill state not initialized");
  }
  return s;
 };
 function getNotionSkillState2() {
  const s = globalThis.__notionSkillState;
  if (!s)
   throw new Error("[notion] Skill state not initialized");
  return s;
 }

 // skills-ts-out/core/notion/db/helpers.js
 function credId() {
  return getNotionSkillState2().config.credentialId;
 }
 function extractIcon(icon) {
  if (!icon)
   return null;
  const iconObj = icon;
  if (iconObj.type === "emoji")
   return iconObj.emoji;
  if (iconObj.type === "external") {
   const ext = iconObj.external;
   return (ext ? ext.url : null) || null;
  }
  if (iconObj.type === "file") {
   const file = iconObj.file;
   return (file ? file.url : null) || null;
  }
  return null;
 }
 function extractParent(parent) {
  if (!parent)
   return { type: "workspace", id: null };
  const p = parent;
  if (p.type === "page_id")
   return { type: "page_id", id: p.page_id };
  if (p.type === "database_id")
   return { type: "database_id", id: p.database_id };
  if (p.type === "workspace")
   return { type: "workspace", id: null };
  return { type: String(p.type || "workspace"), id: null };
 }
 function extractPageEntities(page) {
  const entities = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (id, type, name, role, property) => {
   const key = `${id}:${role}`;
   if (seen.has(key))
    return;
   seen.add(key);
   entities.push({ id, type, name: name || void 0, role, property });
  };
  const createdBy = page.created_by;
  if (createdBy && createdBy.id) {
   add(createdBy.id, "person", createdBy.name, "creator");
  }
  const lastEditedBy = page.last_edited_by;
  if (lastEditedBy && lastEditedBy.id) {
   add(lastEditedBy.id, "person", lastEditedBy.name, "last_editor");
  }
  const props = page.properties;
  if (props) {
   for (const [propName, propVal] of Object.entries(props)) {
    const prop = propVal;
    const propType = prop.type;
    if (propType === "people" && Array.isArray(prop.people)) {
     for (const person of prop.people) {
      if (person.id) {
       add(person.id, "person", person.name, "assignee", propName);
      }
     }
    } else if (propType === "relation" && Array.isArray(prop.relation)) {
     for (const rel of prop.relation) {
      if (rel.id) {
       add(rel.id, "page", void 0, "linked", propName);
      }
     }
    } else if (propType === "created_by" && prop.created_by) {
     const cb = prop.created_by;
     if (cb.id) {
      add(cb.id, "person", cb.name, "creator", propName);
     }
    } else if (propType === "last_edited_by" && prop.last_edited_by) {
     const leb = prop.last_edited_by;
     if (leb.id) {
      add(leb.id, "person", leb.name, "last_editor", propName);
     }
    }
   }
  }
  return entities;
 }
 function upsertPage(page) {
  const cid = credId();
  const now = Date.now();
  let title = page.id;
  const props = page.properties;
  if (props) {
   for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title" && Array.isArray(prop.title)) {
     const texts = prop.title;
     const t = texts.map((rt) => rt.plain_text || "").join("");
     if (t) {
      title = t;
      break;
     }
    }
   }
  }
  const iconStr = extractIcon(page.icon);
  const parent = extractParent(page.parent);
  const createdBy = page.created_by;
  const lastEditedBy = page.last_edited_by;
  const pageEntities = extractPageEntities(page);
  const pageEntitiesJson = pageEntities.length > 0 ? JSON.stringify(pageEntities) : null;
  db.exec(`INSERT INTO pages (
   id, credential_id, title, url, icon, parent_type, parent_id,
   created_by_id, last_edited_by_id,
   created_time, last_edited_time, archived, page_entities, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(credential_id, id) DO UPDATE SET
   title = excluded.title,
   url = excluded.url,
   icon = excluded.icon,
   parent_type = excluded.parent_type,
   parent_id = excluded.parent_id,
   created_by_id = excluded.created_by_id,
   last_edited_by_id = excluded.last_edited_by_id,
   created_time = excluded.created_time,
   last_edited_time = excluded.last_edited_time,
   archived = excluded.archived,
   page_entities = excluded.page_entities,
   ingested = 0,
   synced_at = excluded.synced_at`, [
   page.id,
   cid,
   title,
   page.url || null,
   iconStr,
   parent.type,
   parent.id,
   (createdBy ? createdBy.id : null) || null,
   (lastEditedBy ? lastEditedBy.id : null) || null,
   page.created_time,
   page.last_edited_time,
   page.archived ? 1 : 0,
   pageEntitiesJson,
   now
  ]);
 }
 function updatePageContent(pageId, contentText) {
  const cid = credId();
  db.exec("UPDATE pages SET content_text = ?, content_synced_at = ?, ingested = 0 WHERE credential_id = ? AND id = ?", [contentText, Date.now(), cid, pageId]);
 }
 function getPageById(pageId) {
  const cid = credId();
  return db.get("SELECT * FROM pages WHERE credential_id = ? AND id = ?", [
   cid,
   pageId
  ]);
 }
 function getLocalPages(options = {}) {
  const cid = credId();
  let sql = "SELECT * FROM pages WHERE credential_id = ?";
  const params = [cid];
  if (!options.includeArchived) {
   sql += " AND archived = 0";
  }
  if (options.query) {
   sql += " AND (title LIKE ? OR content_text LIKE ?)";
   const term = `%${options.query}%`;
   params.push(term, term);
  }
  sql += " ORDER BY last_edited_time DESC";
  const limit = options.limit || 50;
  sql += " LIMIT ?";
  params.push(limit);
  return db.all(sql, params);
 }
 function getLocalSummaries(limit) {
  const cid = credId();
  return db.all("SELECT * FROM summaries WHERE credential_id = ? ORDER BY created_at DESC LIMIT ?", [cid, limit]);
 }
 function upsertDatabase(database) {
  const cid = credId();
  const now = Date.now();
  let title = "(Untitled)";
  if (Array.isArray(database.title)) {
   const texts = database.title;
   const t = texts.map((rt) => rt.plain_text || "").join("");
   if (t)
    title = t;
  }
  let description = null;
  if (Array.isArray(database.description)) {
   const texts = database.description;
   const d = texts.map((rt) => rt.plain_text || "").join("");
   if (d)
    description = d;
  }
  const iconStr = extractIcon(database.icon);
  const propertyCount = Object.keys(database.properties || {}).length;
  db.exec(`INSERT INTO databases (
   id, credential_id, title, description, url, icon, property_count,
   created_time, last_edited_time, archived, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(credential_id, id) DO UPDATE SET
   title = excluded.title,
   description = excluded.description,
   url = excluded.url,
   icon = excluded.icon,
   property_count = excluded.property_count,
   created_time = excluded.created_time,
   last_edited_time = excluded.last_edited_time,
   archived = excluded.archived,
   ingested = 0,
   synced_at = excluded.synced_at`, [
   database.id,
   cid,
   title,
   description,
   database.url || null,
   iconStr,
   propertyCount,
   database.created_time,
   database.last_edited_time,
   database.archived ? 1 : 0,
   now
  ]);
 }
 function getDatabaseById(databaseId) {
  const cid = credId();
  return db.get("SELECT * FROM databases WHERE credential_id = ? AND id = ?", [
   cid,
   databaseId
  ]);
 }
 function getLocalDatabases(options = {}) {
  const cid = credId();
  let sql = "SELECT * FROM databases WHERE credential_id = ? AND archived = 0";
  const params = [cid];
  if (options.query) {
   sql += " AND (title LIKE ? OR description LIKE ?)";
   const term = `%${options.query}%`;
   params.push(term, term);
  }
  sql += " ORDER BY last_edited_time DESC";
  const limit = options.limit || 50;
  sql += " LIMIT ?";
  params.push(limit);
  return db.all(sql, params);
 }
 function extractPropertiesText(properties) {
  const parts = [];
  for (const [, propVal] of Object.entries(properties)) {
   const prop = propVal;
   const propType = prop.type;
   switch (propType) {
    case "title":
    case "rich_text": {
     const texts = prop[propType];
     if (Array.isArray(texts)) {
      const t = texts.map((rt) => rt.plain_text || "").join("");
      if (t)
       parts.push(t);
     }
     break;
    }
    case "number": {
     const num = prop.number;
     if (num != null)
      parts.push(String(num));
     break;
    }
    case "select": {
     const sel = prop.select;
     if (sel && sel.name)
      parts.push(sel.name);
     break;
    }
    case "multi_select": {
     const ms = prop.multi_select;
     if (Array.isArray(ms)) {
      for (const item of ms) {
       if (item.name)
        parts.push(item.name);
      }
     }
     break;
    }
    case "status": {
     const st = prop.status;
     if (st && st.name)
      parts.push(st.name);
     break;
    }
    case "date": {
     const dt = prop.date;
     if (dt && dt.start)
      parts.push(dt.start);
     if (dt && dt.end)
      parts.push(dt.end);
     break;
    }
    case "email": {
     const email = prop.email;
     if (email)
      parts.push(email);
     break;
    }
    case "phone_number": {
     const phone = prop.phone_number;
     if (phone)
      parts.push(phone);
     break;
    }
    case "url": {
     const url = prop.url;
     if (url)
      parts.push(url);
     break;
    }
    case "checkbox": {
     parts.push(prop.checkbox ? "true" : "false");
     break;
    }
    case "people": {
     const people = prop.people;
     if (Array.isArray(people)) {
      for (const person of people) {
       if (person.name)
        parts.push(person.name);
      }
     }
     break;
    }
    case "formula": {
     const formula = prop.formula;
     if (formula) {
      const fType = formula.type;
      const val = formula[fType];
      if (val != null)
       parts.push(String(val));
     }
     break;
    }
    case "rollup": {
     const rollup = prop.rollup;
     if (rollup) {
      const rType = rollup.type;
      const val = rollup[rType];
      if (val != null && !Array.isArray(val))
       parts.push(String(val));
     }
     break;
    }
   }
  }
  return parts.join(" ");
 }
 function upsertDatabaseRow(row, databaseId) {
  const cid = credId();
  const now = Date.now();
  let title = row.id;
  const props = row.properties;
  if (props) {
   for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title" && Array.isArray(prop.title)) {
     const texts = prop.title;
     const t = texts.map((rt) => rt.plain_text || "").join("");
     if (t) {
      title = t;
      break;
     }
    }
   }
  }
  const iconStr = extractIcon(row.icon);
  const createdBy = row.created_by;
  const lastEditedBy = row.last_edited_by;
  const propertiesJson = props ? JSON.stringify(props) : null;
  const propertiesText = props ? extractPropertiesText(props) : null;
  db.exec(`INSERT INTO database_rows (
   id, credential_id, database_id, title, url, icon, properties_json, properties_text,
   created_by_id, last_edited_by_id,
   created_time, last_edited_time, archived, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(credential_id, id) DO UPDATE SET
   database_id = excluded.database_id,
   title = excluded.title,
   url = excluded.url,
   icon = excluded.icon,
   properties_json = excluded.properties_json,
   properties_text = excluded.properties_text,
   created_by_id = excluded.created_by_id,
   last_edited_by_id = excluded.last_edited_by_id,
   created_time = excluded.created_time,
   last_edited_time = excluded.last_edited_time,
   archived = excluded.archived,
   ingested = 0,
   synced_at = excluded.synced_at`, [
   row.id,
   cid,
   databaseId,
   title,
   row.url || null,
   iconStr,
   propertiesJson,
   propertiesText,
   (createdBy ? createdBy.id : null) || null,
   (lastEditedBy ? lastEditedBy.id : null) || null,
   row.created_time,
   row.last_edited_time,
   row.archived ? 1 : 0,
   now
  ]);
 }
 function getDatabaseRowById(rowId) {
  const cid = credId();
  return db.get("SELECT * FROM database_rows WHERE credential_id = ? AND id = ?", [
   cid,
   rowId
  ]);
 }
 function upsertUser(user) {
  const cid = credId();
  const now = Date.now();
  const person = user.person;
  db.exec(`INSERT OR REPLACE INTO users (
   id, credential_id, name, user_type, email, avatar_url, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
   user.id,
   cid,
   user.name || "(Unknown)",
   user.type || "person",
   (person ? person.email : null) || null,
   user.avatar_url || null,
   now
  ]);
 }
 function getLocalUsers() {
  const cid = credId();
  return db.all("SELECT * FROM users WHERE credential_id = ? ORDER BY name", [
   cid
  ]);
 }
 function getUningestedPages(limit = 500) {
  const cid = credId();
  return db.all(`SELECT * FROM pages
  WHERE credential_id = ? AND ingested = 0 AND archived = 0
   AND content_text IS NOT NULL
  ORDER BY last_edited_time ASC LIMIT ?`, [cid, limit]);
 }
 function getUningestedRows(limit = 500) {
  const cid = credId();
  return db.all(`SELECT * FROM database_rows
  WHERE credential_id = ? AND ingested = 0 AND archived = 0
   AND properties_text IS NOT NULL AND properties_text != ''
  ORDER BY last_edited_time ASC LIMIT ?`, [cid, limit]);
 }
 function markPagesIngested(ids) {
  if (ids.length === 0)
   return;
  const cid = credId();
  for (let i = 0; i < ids.length; i += 99) {
   const batch = ids.slice(i, i + 99);
   const placeholders = batch.map(() => "?").join(",");
   db.exec(`UPDATE pages SET ingested = 1 WHERE credential_id = ? AND id IN (${placeholders})`, [
    cid,
    ...batch
   ]);
  }
 }
 function markRowsIngested(ids) {
  if (ids.length === 0)
   return;
  const cid = credId();
  for (let i = 0; i < ids.length; i += 99) {
   const batch = ids.slice(i, i + 99);
   const placeholders = batch.map(() => "?").join(",");
   db.exec(`UPDATE database_rows SET ingested = 1 WHERE credential_id = ? AND id IN (${placeholders})`, [cid, ...batch]);
  }
 }
 if (typeof globalThis !== "undefined") {
  const g2 = globalThis;
  g2.getUningestedPages = getUningestedPages;
  g2.getUningestedRows = getUningestedRows;
  g2.markPagesIngested = markPagesIngested;
  g2.markRowsIngested = markRowsIngested;
 }
 function getEntityCounts() {
  const cid = credId();
  const pages = db.get("SELECT COUNT(*) as cnt FROM pages WHERE credential_id = ?", [cid]);
  const databases = db.get("SELECT COUNT(*) as cnt FROM databases WHERE credential_id = ?", [
   cid
  ]);
  const databaseRows = db.get("SELECT COUNT(*) as cnt FROM database_rows WHERE credential_id = ?", [
   cid
  ]);
  const pagesWithContent = db.get("SELECT COUNT(*) as cnt FROM pages WHERE credential_id = ? AND content_text IS NOT NULL", [cid]);
  const pagesWithSummary = db.get("SELECT COUNT(DISTINCT page_id) as cnt FROM summaries WHERE credential_id = ?", [cid]);
  const summariesTotal = db.get("SELECT COUNT(*) as cnt FROM summaries WHERE credential_id = ?", [
   cid
  ]);
  const summariesPending = db.get("SELECT COUNT(*) as cnt FROM summaries WHERE credential_id = ? AND synced = 0", [cid]);
  return {
   pages: (pages ? pages.cnt : 0) || 0,
   databases: (databases ? databases.cnt : 0) || 0,
   databaseRows: (databaseRows ? databaseRows.cnt : 0) || 0,
   pagesWithContent: (pagesWithContent ? pagesWithContent.cnt : 0) || 0,
   pagesWithSummary: (pagesWithSummary ? pagesWithSummary.cnt : 0) || 0,
   summariesTotal: (summariesTotal ? summariesTotal.cnt : 0) || 0,
   summariesPending: (summariesPending ? summariesPending.cnt : 0) || 0
  };
 }

 // skills-ts-out/core/notion/db/schema.js
 function initializeNotionSchema() {
  console.log("[notion] Initializing database schema...");
  db.exec(`CREATE TABLE IF NOT EXISTS pages (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   title TEXT NOT NULL,
   url TEXT,
   icon TEXT,
   parent_type TEXT NOT NULL,
   parent_id TEXT,
   created_by_id TEXT,
   last_edited_by_id TEXT,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   content_text TEXT,
   content_synced_at INTEGER,
   page_entities TEXT,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS databases (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   title TEXT NOT NULL,
   description TEXT,
   url TEXT,
   icon TEXT,
   property_count INTEGER NOT NULL DEFAULT 0,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS users (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   name TEXT NOT NULL,
   user_type TEXT NOT NULL,
   email TEXT,
   avatar_url TEXT,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS database_rows (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   database_id TEXT NOT NULL,
   title TEXT NOT NULL,
   url TEXT,
   icon TEXT,
   properties_json TEXT,
   properties_text TEXT,
   created_by_id TEXT,
   last_edited_by_id TEXT,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id),
   FOREIGN KEY (credential_id, database_id) REFERENCES databases(credential_id, id)
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS summaries (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   credential_id TEXT NOT NULL DEFAULT '',
   page_id TEXT NOT NULL,
   url TEXT,
   summary TEXT NOT NULL,
   category TEXT,
   sentiment TEXT,
   entities TEXT,
   topics TEXT,
   metadata TEXT,
   source_created_at TEXT NOT NULL,
   source_updated_at TEXT NOT NULL,
   created_at INTEGER NOT NULL,
   synced INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER
  )`, []);
  migrateAddColumn("pages", "credential_id", "TEXT NOT NULL DEFAULT ''");
  migrateAddColumn("databases", "credential_id", "TEXT NOT NULL DEFAULT ''");
  migrateAddColumn("users", "credential_id", "TEXT NOT NULL DEFAULT ''");
  migrateAddColumn("database_rows", "credential_id", "TEXT NOT NULL DEFAULT ''");
  migrateAddColumn("summaries", "credential_id", "TEXT NOT NULL DEFAULT ''");
  migrateAddColumn("pages", "ingested", "INTEGER NOT NULL DEFAULT 0");
  migrateAddColumn("databases", "ingested", "INTEGER NOT NULL DEFAULT 0");
  migrateAddColumn("database_rows", "ingested", "INTEGER NOT NULL DEFAULT 0");
  migrateAddColumn("pages", "page_entities", "TEXT");
  migrateAddColumn("summaries", "url", "TEXT");
  migrateCompositePrimaryKey("pages", `CREATE TABLE pages_new (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   title TEXT NOT NULL,
   url TEXT,
   icon TEXT,
   parent_type TEXT NOT NULL,
   parent_id TEXT,
   created_by_id TEXT,
   last_edited_by_id TEXT,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   content_text TEXT,
   content_synced_at INTEGER,
   page_entities TEXT,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`);
  migrateCompositePrimaryKey("databases", `CREATE TABLE databases_new (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   title TEXT NOT NULL,
   description TEXT,
   url TEXT,
   icon TEXT,
   property_count INTEGER NOT NULL DEFAULT 0,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`);
  migrateCompositePrimaryKey("users", `CREATE TABLE users_new (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   name TEXT NOT NULL,
   user_type TEXT NOT NULL,
   email TEXT,
   avatar_url TEXT,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id)
  )`);
  migrateCompositePrimaryKey("database_rows", `CREATE TABLE database_rows_new (
   id TEXT NOT NULL,
   credential_id TEXT NOT NULL DEFAULT '',
   database_id TEXT NOT NULL,
   title TEXT NOT NULL,
   url TEXT,
   icon TEXT,
   properties_json TEXT,
   properties_text TEXT,
   created_by_id TEXT,
   last_edited_by_id TEXT,
   created_time TEXT NOT NULL,
   last_edited_time TEXT NOT NULL,
   archived INTEGER NOT NULL DEFAULT 0,
   ingested INTEGER NOT NULL DEFAULT 0,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (credential_id, id),
   FOREIGN KEY (credential_id, database_id) REFERENCES databases(credential_id, id)
  )`);
  db.exec("CREATE INDEX IF NOT EXISTS idx_pages_cred ON pages(credential_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_databases_cred ON databases(credential_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_users_cred ON users(credential_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_db_rows_cred ON database_rows(credential_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_summaries_cred ON summaries(credential_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_pages_ingested ON pages(credential_id, ingested)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_databases_ingested ON databases(credential_id, ingested)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_db_rows_ingested ON database_rows(credential_id, ingested)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_pages_last_edited ON pages(credential_id, last_edited_time DESC)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(credential_id, parent_type, parent_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_pages_archived ON pages(credential_id, archived)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_databases_last_edited ON databases(credential_id, last_edited_time DESC)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_db_rows_database_id ON database_rows(credential_id, database_id)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_db_rows_last_edited ON database_rows(credential_id, last_edited_time DESC)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_summaries_synced ON summaries(credential_id, synced)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_summaries_page_id ON summaries(credential_id, page_id)", []);
  console.log("[notion] Database schema initialized successfully");
 }
 function migrateAddColumn(table, column, type) {
  try {
   db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, []);
   console.log(`[notion] Added ${column} column to ${table} table`);
  } catch {
  }
 }
 function migrateCompositePrimaryKey(tableName, createNewTableSql) {
  try {
   const row = db.get("SELECT sql FROM sqlite_master WHERE type = ? AND name = ?", [
    "table",
    tableName
   ]);
   if (!row || !row.sql || row.sql.includes("PRIMARY KEY (credential_id, id)"))
    return;
   const newTableName = `${tableName}_new`;
   db.exec(createNewTableSql, []);
   const columns = db.all(`PRAGMA table_info(${tableName})`, []);
   const columnList = columns.sort((a, b) => a.cid - b.cid).map((c) => c.name).join(", ");
   db.exec(`INSERT INTO ${newTableName} (${columnList}) SELECT ${columnList} FROM ${tableName}`, []);
   db.exec(`DROP TABLE ${tableName}`, []);
   db.exec(`ALTER TABLE ${newTableName} RENAME TO ${tableName}`, []);
   console.log(`[notion] Migrated ${tableName} to composite primary key (credential_id, id)`);
  } catch (e) {
   console.warn(`[notion] migrateCompositePrimaryKey(${tableName}):`, e);
  }
 }

 // skills-ts-out/shared/integration-metadata.js
 function syncIntegrationMetadata(params) {
  try {
   const memoryBridge = globalThis.memory;
   if (typeof (memoryBridge == null ? void 0 : memoryBridge.insert) !== "function")
    return;
   memoryBridge.insert(params);
  } catch (error) {
   console.warn("[integration-metadata] sync failed:", error);
  }
 }

 // skills-ts-out/core/notion/sync.js
 var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
 var MIN_CONTENT_LENGTH = 50;
 function syncProgress(phase, progress, message) {
  const s = getNotionSkillState2();
  s.syncStatus.syncPhase = phase;
  s.syncStatus.syncProgress = Math.round(Math.min(100, Math.max(0, progress)));
  s.syncStatus.syncMessage = message;
  console.log(`[notion][sync] [${phase}] ${progress.toFixed(0)}% \u2014 ${message}`);
  publishSyncState();
 }
 function performSync() {
  const s = getNotionSkillState2();
  if (s.syncStatus.syncInProgress) {
   console.log("[notion] Sync already in progress, skipping");
   return;
  }
  if (!isNotionConnected()) {
   console.log("[notion] No credential, skipping sync");
   return;
  }
  const startTime = Date.now();
  s.syncStatus.syncInProgress = true;
  s.syncStatus.lastSyncError = null;
  syncProgress("starting", 0, "Starting sync...");
  try {
   syncProgress("users", 0, "Fetching workspace users...");
   syncUsers();
   syncProgress("users", 5, "Users synced");
   syncProgress("sync", 5, "Discovering and syncing pages...");
   syncPipeline();
   syncProgress("databases", 90, "Syncing databases (data_sources)...");
   syncDataSources();
   insertNotionMemorySnapshot();
   const durationMs = Date.now() - startTime;
   const nowMs = Date.now();
   s.syncStatus.nextSyncTime = nowMs + s.config.syncIntervalMinutes * 60 * 1e3;
   s.syncStatus.lastSyncDurationMs = durationMs;
   const counts = getEntityCounts();
   s.syncStatus.lastSyncTime = nowMs;
   s.syncStatus.totalPages = counts.pages;
   s.syncStatus.totalDatabases = counts.databases;
   s.syncStatus.pagesWithContent = counts.pagesWithContent;
   s.syncStatus.pagesWithSummary = counts.pagesWithSummary;
   s.syncStatus.summariesTotal = counts.summariesTotal;
   s.syncStatus.summariesPending = counts.summariesPending;
   s.syncStatus.totalDatabaseRows = counts.databaseRows;
   const secs = (durationMs / 1e3).toFixed(1);
   syncProgress("done", 100, `Sync complete in ${secs}s \u2014 ${counts.pages} pages, ${counts.databases} dbs, ${counts.pagesWithContent} with content`);
  } catch (error) {
   const errorMsg = error instanceof Error ? error.message : String(error);
   s.syncStatus.lastSyncError = errorMsg;
   s.syncStatus.lastSyncDurationMs = Date.now() - startTime;
   syncProgress("error", 0, `Sync failed: ${errorMsg}`);
  } finally {
   s.syncStatus.syncInProgress = false;
   s.syncStatus.syncPhase = null;
   s.syncStatus.syncProgress = 0;
   publishSyncState();
  }
 }
 function syncUsers() {
  let startCursor;
  let hasMore = true;
  let count = 0;
  while (hasMore) {
   const result = notionApi.listUsers(100, startCursor);
   for (const user of result.results) {
    try {
     upsertUser(user);
     count++;
    } catch (e) {
     console.error(`[notion] Failed to upsert user ${user.id}: ${e}`);
    }
   }
   hasMore = result.has_more;
   startCursor = result.next_cursor || void 0;
   syncProgress("users", Math.min(4, 1 + count), `Fetched ${count} users...`);
  }
  syncProgress("users", 5, `Synced ${count} users`);
 }
 function syncPipeline() {
  const s = getNotionSkillState2();
  const lastSyncTime = s.syncStatus.lastSyncTime;
  const isFirstSync = lastSyncTime === 0;
  const cutoffMs = Date.now() - THIRTY_DAYS_MS;
  const contentEnabled = s.config.contentSyncEnabled;
  let startCursor;
  let hasMore = true;
  let pageCount = 0;
  let pageSkipped = 0;
  let dbCount = 0;
  let contentSynced = 0;
  let ingested = 0;
  let errorCount = 0;
  let reachedOldItems = false;
  let batchNum = 0;
  while (hasMore && !reachedOldItems) {
   batchNum++;
   const body = {
    page_size: 100,
    sort: { direction: "descending", timestamp: "last_edited_time" }
   };
   if (startCursor)
    body.start_cursor = startCursor;
   const result = notionApi.search(body);
   for (const item of result.results) {
    const rec = item;
    const lastEdited = rec.last_edited_time;
    if (!lastEdited)
     continue;
    const editedMs = new Date(lastEdited).getTime();
    if (editedMs < cutoffMs) {
     reachedOldItems = true;
     break;
    }
    if (!isFirstSync && editedMs <= lastSyncTime) {
     reachedOldItems = true;
     break;
    }
    const objectType = rec.object;
    if (objectType === "page") {
     const existing = getPageById(rec.id);
     if (existing && existing.last_edited_time === lastEdited && existing.ingested === 1 && existing.content_text) {
      pageSkipped++;
      continue;
     }
     const pageTitle = formatPageTitle(rec);
     try {
      upsertPage(rec);
      pageCount++;
     } catch (e) {
      console.error(`[notion][sync] FAIL upsert page "${pageTitle}" (${rec.id}): ${e}`);
      errorCount++;
      continue;
     }
     if (contentEnabled) {
      const pageT0 = Date.now();
      try {
       const text = fetchBlockTreeText(rec.id, 2);
       updatePageContent(rec.id, text);
       contentSynced++;
       const trimmed = text.trim();
       const fetchMs = Date.now() - pageT0;
       if (trimmed.length >= MIN_CONTENT_LENGTH) {
        try {
         memory.insert({
          title: pageTitle || `Notion page ${rec.id}`,
          content: trimmed,
          sourceType: "doc",
          documentId: `${rec.last_edited_time ? new Date(rec.last_edited_time).getTime() : Date.now()}-notion-page-${rec.id}`,
          metadata: {
           source: "notion",
           type: "page",
           pageId: rec.id,
           url: rec.url,
           parentType: rec.parent ? rec.parent.type : null,
           createdTime: rec.created_time,
           lastEditedTime: rec.last_edited_time
          },
          createdAt: rec.created_time ? new Date(rec.created_time).getTime() / 1e3 : void 0,
          updatedAt: rec.last_edited_time ? new Date(rec.last_edited_time).getTime() / 1e3 : void 0
         });
         markPagesIngested([rec.id]);
         ingested++;
         console.log(`[notion][sync] \u2713 page #${pageCount} "${pageTitle}" \u2014 ${trimmed.length}ch, ingested (${fetchMs}ms)`);
        } catch (e) {
         console.error(`[notion][sync] FAIL ingest page "${pageTitle}" (${rec.id}): ${e}`);
         markPagesIngested([rec.id]);
        }
       } else {
        markPagesIngested([rec.id]);
        console.log(`[notion][sync] \u2713 page #${pageCount} "${pageTitle}" \u2014 ${trimmed.length}ch (too short, skipped ingest) (${fetchMs}ms)`);
       }
      } catch (e) {
       console.error(`[notion][sync] FAIL content page "${pageTitle}" (${rec.id}): ${e}`);
      }
     } else {
      console.log(`[notion][sync] \u2713 page #${pageCount} "${pageTitle}" \u2014 metadata only`);
     }
    } else if (objectType === "data_source" || objectType === "database") {
     const existing = getDatabaseById ? getDatabaseById(rec.id) : null;
     if (existing && existing.last_edited_time === lastEdited) {
      continue;
     }
     try {
      upsertDatabase(rec);
      dbCount++;
     } catch (e) {
      console.error(`[notion] Failed to upsert database ${rec.id}: ${e}`);
      errorCount++;
     }
    }
   }
   hasMore = result.has_more;
   startCursor = result.next_cursor || void 0;
   const batchCounts = getEntityCounts();
   s.syncStatus.totalPages = batchCounts.pages;
   s.syncStatus.totalDatabases = batchCounts.databases;
   s.syncStatus.pagesWithContent = batchCounts.pagesWithContent;
   const pct = 5 + Math.min(85, batchNum / 50 * 85);
   const total = pageCount + pageSkipped;
   syncProgress("sync", pct, `batch ${batchNum}: ${total} pages (${pageCount} new, ${contentSynced} content, ${ingested} ingested), ${dbCount} dbs`);
  }
  state.set("last_search_sync", Date.now());
  const counts = getEntityCounts();
  s.syncStatus.totalPages = counts.pages;
  s.syncStatus.totalDatabases = counts.databases;
  s.syncStatus.pagesWithContent = counts.pagesWithContent;
  syncProgress("sync", 90, `Pipeline done: ${pageCount} pages synced, ${contentSynced} content fetched, ${ingested} ingested, ${dbCount} dbs` + (pageSkipped > 0 ? ` (${pageSkipped} unchanged)` : "") + (errorCount > 0 ? `, ${errorCount} errors` : ""));
 }
 function syncDataSources() {
  const s = getNotionSkillState2();
  const lastSyncTime = s.syncStatus.lastSyncTime;
  const isFirstSync = lastSyncTime === 0;
  const cutoffMs = Date.now() - THIRTY_DAYS_MS;
  let startCursor;
  let hasMore = true;
  let dbCount = 0;
  let skipped = 0;
  let rowCount = 0;
  let rowIngested = 0;
  let reachedOldItems = false;
  const syncedDbIds = [];
  while (hasMore && !reachedOldItems) {
   const searchBody = {
    page_size: 100,
    sort: { direction: "descending", timestamp: "last_edited_time" },
    filter: { property: "object", value: "data_source" }
   };
   if (startCursor)
    searchBody.start_cursor = startCursor;
   const result = notionApi.search(searchBody);
   for (const item of result.results) {
    const rec = item;
    const lastEdited = rec.last_edited_time;
    if (!lastEdited)
     continue;
    const editedMs = new Date(lastEdited).getTime();
    if (editedMs < cutoffMs) {
     reachedOldItems = true;
     break;
    }
    if (!isFirstSync && editedMs <= lastSyncTime) {
     reachedOldItems = true;
     break;
    }
    const existing = getDatabaseById ? getDatabaseById(rec.id) : null;
    if (existing && existing.last_edited_time === lastEdited) {
     skipped++;
    } else {
     try {
      upsertDatabase(rec);
      dbCount++;
      syncedDbIds.push(rec.id);
     } catch (e) {
      console.error(`[notion] Failed to upsert data_source ${rec.id}: ${e}`);
     }
    }
   }
   hasMore = result.has_more;
   startCursor = result.next_cursor || void 0;
   syncProgress("databases", 91, `Data sources: ${dbCount} synced, ${skipped} unchanged...`);
  }
  syncProgress("databases", 92, `Data sources: ${dbCount} synced${skipped > 0 ? `, ${skipped} unchanged` : ""}. Fetching rows...`);
  for (let i = 0; i < syncedDbIds.length; i++) {
   const dbId = syncedDbIds[i];
   const dbInfo = getDatabaseById(dbId);
   const dbTitle = dbInfo ? dbInfo.title : dbId;
   let dbRowCount = 0;
   try {
    let rowCursor;
    let rowHasMore = true;
    while (rowHasMore) {
     const queryBody = { page_size: 100 };
     if (rowCursor)
      queryBody.start_cursor = rowCursor;
     const rowResult = notionApi.queryDataSource(dbId, queryBody);
     for (const row of rowResult.results) {
      const rowRec = row;
      const rowLastEdited = rowRec.last_edited_time;
      const existingRow = getDatabaseRowById(rowRec.id);
      if (existingRow && existingRow.last_edited_time === rowLastEdited && existingRow.ingested === 1) {
       continue;
      }
      try {
       upsertDatabaseRow(rowRec, dbId);
       rowCount++;
       dbRowCount++;
       const content = buildRowContent(rowRec).trim();
       const rowTitle = extractRowTitle(rowRec).trim();
       if (content.length >= MIN_CONTENT_LENGTH) {
        try {
         memory.insert({
          title: rowTitle + " (" + dbTitle + ")",
          content,
          sourceType: "doc",
          documentId: (rowLastEdited ? new Date(rowLastEdited).getTime() : Date.now()) + "-notion-dbrow-" + rowRec.id,
          metadata: {
           source: "notion",
           type: "database_row",
           databaseId: dbId,
           databaseTitle: dbTitle,
           rowId: rowRec.id,
           url: rowRec.url,
           createdTime: rowRec.created_time,
           lastEditedTime: rowRec.last_edited_time
          },
          createdAt: rowRec.created_time ? new Date(rowRec.created_time).getTime() / 1e3 : void 0,
          updatedAt: rowRec.last_edited_time ? new Date(rowRec.last_edited_time).getTime() / 1e3 : void 0
         });
         markRowsIngested([rowRec.id]);
         rowIngested++;
        } catch (e) {
         console.error(`[notion][sync] FAIL ingest row "${rowTitle}" (${rowRec.id}) in db "${dbTitle}": ${e}`);
        }
       } else {
        markRowsIngested([rowRec.id]);
       }
      } catch (e) {
       console.error(`[notion][sync] FAIL upsert row ${rowRec.id} in db ${dbId}: ${e}`);
      }
     }
     rowHasMore = rowResult.has_more;
     rowCursor = rowResult.next_cursor || void 0;
    }
    console.log(`[notion][sync] \u2713 db "${dbTitle}" \u2014 ${dbRowCount} rows fetched, ${rowIngested} ingested`);
   } catch (e) {
    console.error(`[notion][sync] FAIL query db "${dbTitle}" (${dbId}): ${e}`);
   }
   const pct = 92 + Math.min(3, (i + 1) / syncedDbIds.length * 3);
   syncProgress("databases", pct, `DB ${i + 1}/${syncedDbIds.length}: ${rowCount} rows total`);
  }
  syncProgress("databases", 95, `Data sources done: ${dbCount} dbs, ${rowCount} rows (${rowIngested} ingested)${skipped > 0 ? `, ${skipped} unchanged` : ""}`);
 }
 function extractRowTitle(rowRec) {
  const props = rowRec.properties;
  if (props) {
   for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title" && Array.isArray(prop.title)) {
     const texts = prop.title;
     const t = texts.map((rt) => rt.plain_text || "").join("");
     if (t)
      return t;
    }
   }
  }
  return rowRec.id || "";
 }
 function buildRowContent(rowRec) {
  const props = rowRec.properties;
  if (!props)
   return "";
  const parts = [];
  for (const [key, propVal] of Object.entries(props)) {
   const prop = propVal;
   const propType = prop.type;
   if (propType === "title" || propType === "rich_text") {
    const arr = prop[propType];
    if (Array.isArray(arr)) {
     const t = arr.map((rt) => rt.plain_text || "").join("");
     if (t)
      parts.push(key + ": " + t);
    }
   } else if (propType === "number" && prop.number != null) {
    parts.push(key + ": " + prop.number);
   } else if (propType === "select") {
    const sel = prop.select;
    if (sel && sel.name)
     parts.push(key + ": " + sel.name);
   } else if (propType === "multi_select" && Array.isArray(prop.multi_select)) {
    const names = prop.multi_select.map((ms) => ms.name).filter(Boolean);
    if (names.length)
     parts.push(key + ": " + names.join(", "));
   } else if (propType === "date") {
    const dt = prop.date;
    if (dt && dt.start)
     parts.push(key + ": " + dt.start);
   } else if (propType === "checkbox") {
    parts.push(key + ": " + (prop.checkbox ? "yes" : "no"));
   } else if (propType === "url" && prop.url) {
    parts.push(key + ": " + prop.url);
   } else if (propType === "email" && prop.email) {
    parts.push(key + ": " + prop.email);
   } else if (propType === "phone_number" && prop.phone_number) {
    parts.push(key + ": " + prop.phone_number);
   } else if (propType === "status") {
    const st = prop.status;
    if (st && st.name)
     parts.push(key + ": " + st.name);
   } else if (propType === "people" && Array.isArray(prop.people)) {
    const names = prop.people.map((p) => p.name || "").filter(Boolean);
    if (names.length)
     parts.push(key + ": " + names.join(", "));
   }
  }
  return parts.join("\n");
 }
 function insertNotionMemorySnapshot() {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const s = getNotionSkillState2();
  const profile = state.get("profile") || null;
  if (!profile || !profile.id)
   return;
  const pages = getLocalPages({ limit: 100 }).map((p) => ({
   id: p.id,
   title: p.title,
   url: p.url,
   icon: p.icon,
   parent_type: p.parent_type,
   parent_id: p.parent_id,
   created_by_id: p.created_by_id,
   last_edited_by_id: p.last_edited_by_id,
   created_time: p.created_time,
   last_edited_time: p.last_edited_time,
   content_synced_at: p.content_synced_at,
   archived: p.archived === 1,
   synced_at: p.synced_at,
   has_content: !!p.content_text,
   content_length: p.content_text ? p.content_text.length : 0
   // content_text omitted — too large for metadata snapshot
  }));
  const summaries = getLocalSummaries(100).map((summary) => ({
   id: summary.id,
   pageId: summary.page_id,
   url: summary.url,
   summary: summary.summary,
   category: summary.category,
   sentiment: summary.sentiment || "neutral",
   entities: (() => {
    if (!summary.entities)
     return [];
    try {
     const parsed = JSON.parse(summary.entities);
     return Array.isArray(parsed) ? parsed : [];
    } catch {
     return [];
    }
   })(),
   topics: (() => {
    if (!summary.topics)
     return [];
    try {
     const parsed = JSON.parse(summary.topics);
     return Array.isArray(parsed) ? parsed : [];
    } catch {
     return [];
    }
   })(),
   metadata: (() => {
    if (!summary.metadata)
     return {};
    try {
     const parsed = JSON.parse(summary.metadata);
     return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
     return {};
    }
   })(),
   sourceCreatedAt: summary.source_created_at,
   sourceUpdatedAt: summary.source_updated_at,
   createdAt: summary.created_at,
   synced: summary.synced === 1,
   syncedAt: summary.synced_at
  }));
  const metadata = {
   snapshot_version: "notion-sync-v2",
   captured_at: nowIso,
   id: profile.id,
   name: profile.name || null,
   email: profile.email || null,
   type: profile.type || null,
   avatar_url: profile.avatar_url || null,
   workspace_name: s.config.workspaceName || null,
   sync: {
    in_progress: s.syncStatus.syncInProgress,
    last_sync_time: s.syncStatus.lastSyncTime || null,
    next_sync_time: s.syncStatus.nextSyncTime || null,
    last_sync_duration_ms: s.syncStatus.lastSyncDurationMs || null,
    total_pages: s.syncStatus.totalPages,
    total_databases: s.syncStatus.totalDatabases,
    total_database_rows: s.syncStatus.totalDatabaseRows,
    pages_with_content: s.syncStatus.pagesWithContent,
    pages_with_summary: s.syncStatus.pagesWithSummary,
    summaries_total: s.syncStatus.summariesTotal,
    summaries_pending: s.syncStatus.summariesPending,
    last_sync_error: s.syncStatus.lastSyncError || null
   },
   pages,
   pages_total: pages.length,
   summaries,
   summaries_total: summaries.length
  };
  syncIntegrationMetadata({
   title: `Notion metadata sync \u2014 ${nowIso}`,
   content: JSON.stringify(metadata),
   sourceType: "doc",
   metadata,
   createdAt: now / 1e3,
   updatedAt: now / 1e3
  });
 }
 function publishSyncState() {
  const s = getNotionSkillState2();
  const isConnected = isNotionConnected();
  state.setPartial({
   connection_status: isConnected ? "connected" : "disconnected",
   auth_status: isConnected ? "authenticated" : "not_authenticated",
   connection_error: s.syncStatus.lastSyncError || null,
   auth_error: null,
   is_initialized: isConnected,
   workspaceName: s.config.workspaceName || null,
   syncInProgress: s.syncStatus.syncInProgress,
   lastSyncTime: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null,
   nextSyncTime: s.syncStatus.nextSyncTime ? new Date(s.syncStatus.nextSyncTime).toISOString() : null,
   totalPages: s.syncStatus.totalPages,
   totalDatabases: s.syncStatus.totalDatabases,
   totalDatabaseRows: s.syncStatus.totalDatabaseRows,
   pagesWithContent: s.syncStatus.pagesWithContent,
   pagesWithSummary: s.syncStatus.pagesWithSummary,
   summariesTotal: s.syncStatus.summariesTotal,
   summariesPending: s.syncStatus.summariesPending,
   lastSyncError: s.syncStatus.lastSyncError,
   lastSyncDurationMs: s.syncStatus.lastSyncDurationMs,
   syncPhase: s.syncStatus.syncPhase,
   syncProgress: s.syncStatus.syncProgress,
   syncMessage: s.syncStatus.syncMessage
  });
 }

 // skills-ts-out/core/notion/tools/append-blocks.js
 var appendBlocksTool = {
  name: "append-blocks",
  description: "Append child blocks to a page or block. Supports various block types.",
  input_schema: {
   type: "object",
   properties: {
    block_id: { type: "string", description: "The parent page or block ID" },
    blocks: {
     type: "string",
     description: 'JSON string of blocks array. Example: [{"type":"paragraph","paragraph":{"rich_text":[{"text":{"content":"Hello"}}]}}]'
    }
   },
   required: ["block_id", "blocks"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    const blocksJson = args.blocks || "";
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    if (!blocksJson) {
     return JSON.stringify({ error: "blocks is required" });
    }
    let children;
    try {
     children = JSON.parse(blocksJson);
    } catch {
     return JSON.stringify({ error: "Invalid blocks JSON" });
    }
    if (!Array.isArray(children) || children.length === 0) {
     return JSON.stringify({ error: "blocks must be a non-empty array" });
    }
    const result = notionApi.appendBlockChildren(blockId, children);
    return JSON.stringify({
     success: true,
     blocks_added: result.results.length,
     blocks: result.results.map((b) => formatBlockSummary(b))
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/append-text.js
 var appendTextTool = {
  name: "append-text",
  description: "Append text content to a page or block. Use the page id (or block_id) from list-all-pages or get-page. Creates paragraph blocks with the given text.",
  input_schema: {
   type: "object",
   properties: {
    block_id: {
     type: "string",
     description: "The page or block ID to append to (use page id from list-all-pages)"
    },
    page_id: {
     type: "string",
     description: "Alias for block_id when appending to a page (same as block_id)"
    },
    text: {
     type: "string",
     description: "The text to append (required). Pass the exact content to add to the page."
    },
    content: {
     type: "string",
     description: "Alias for text \u2014 the content to append to the page"
    }
   },
   required: ["text"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || args.page_id || "";
    const _textVal = args.text !== void 0 && args.text !== null ? args.text : args.content !== void 0 && args.content !== null ? args.content : "";
    const text = String(_textVal).trim();
    if (!blockId) {
     return JSON.stringify({
      success: false,
      error: "block_id or page_id is required. Use the page id from list-all-pages or get-page."
     });
    }
    if (!text) {
     return JSON.stringify({
      success: false,
      error: 'text (or content) is required and cannot be empty. Pass the string to append, e.g. { "block_id": "<page-id>", "text": "Your content here" }.'
     });
    }
    const paragraphs = text.split("\n").filter((p) => p.trim());
    const children = paragraphs.map(buildParagraphBlock);
    const result = notionApi.appendBlockChildren(blockId, children);
    return JSON.stringify({
     success: true,
     blocks_added: result.results.length,
     blocks: result.results.map((b) => formatBlockSummary(b))
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/create-comment.js
 var createCommentTool = {
  name: "create-comment",
  description: "Create a comment on a page or block, or reply to a discussion. Provide either page_id (new comment on page) or discussion_id (reply). Requires Notion integration to have insert comment capability.",
  input_schema: {
   type: "object",
   properties: {
    page_id: { type: "string", description: "Page ID to create a comment on (new discussion)" },
    block_id: {
     type: "string",
     description: "Block ID to comment on (optional, use instead of page_id)"
    },
    discussion_id: {
     type: "string",
     description: "Discussion ID to reply to an existing thread (use instead of page_id)"
    },
    text: { type: "string", description: "Comment text content" }
   },
   required: ["text"]
  },
  execute(args) {
   try {
    const pageId = args.page_id;
    const blockId = args.block_id;
    const discussionId = args.discussion_id;
    const text = args.text || "";
    const hasParent = !!(pageId || blockId);
    if (!hasParent && !discussionId) {
     return JSON.stringify({ error: "Provide one of: page_id, block_id, or discussion_id" });
    }
    if (hasParent && discussionId) {
     return JSON.stringify({
      error: "Provide only one: page_id/block_id OR discussion_id (not both). See https://developers.notion.com/reference/create-a-comment"
     });
    }
    if (!text) {
     return JSON.stringify({ error: "text is required" });
    }
    const body = { rich_text: buildRichText(text) };
    if (discussionId) {
     body.discussion_id = discussionId;
    } else if (blockId) {
     body.parent = { type: "block_id", block_id: blockId };
    } else {
     body.parent = { type: "page_id", page_id: pageId };
    }
    const comment = notionApi.createComment(body);
    const rec = comment;
    return JSON.stringify({ object: rec.object || "comment", id: rec.id });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/create-database.js
 var createDatabaseTool = {
  name: "create-database",
  description: "Create a new database in Notion. Specify parent page_id and title. Optionally provide properties schema as JSON.",
  input_schema: {
   type: "object",
   properties: {
    parent_page_id: {
     type: "string",
     description: "Parent page ID where the database will be created"
    },
    title: { type: "string", description: "Database title" },
    properties: {
     type: "string",
     description: 'JSON string of properties schema. Example: {"Name":{"title":{}},"Status":{"select":{"options":[{"name":"Todo"},{"name":"Done"}]}}}'
    }
   },
   required: ["parent_page_id", "title"]
  },
  execute(args) {
   try {
    const parentId = args.parent_page_id || "";
    const title = args.title || "";
    const propsJson = args.properties;
    if (!parentId) {
     return JSON.stringify({ error: "parent_page_id is required" });
    }
    if (!title) {
     return JSON.stringify({ error: "title is required" });
    }
    let properties = { Name: { title: {} } };
    if (propsJson) {
     try {
      properties = JSON.parse(propsJson);
     } catch {
      return JSON.stringify({ error: "Invalid properties JSON" });
     }
    }
    const body = {
     parent: { type: "page_id", page_id: parentId },
     title: buildRichText(title),
     properties
    };
    const dbResult = notionApi.createDatabase(body);
    const rec = dbResult;
    return JSON.stringify({ object: rec.object || "database", id: rec.id });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/create-page.js
 var createPageTool = {
  name: "create-page",
  description: "Create a new page in Notion. Parent can be another page or a database. For database parents, properties must match the database schema.",
  input_schema: {
   type: "object",
   properties: {
    parent_id: { type: "string", description: "Parent page ID or database ID" },
    parent_type: {
     type: "string",
     enum: ["page_id", "database_id"],
     description: "Type of parent (default: page_id)"
    },
    title: { type: "string", description: "Page title" },
    content: { type: "string", description: "Initial text content (creates a paragraph block)" },
    properties: {
     type: "string",
     description: "JSON string of additional properties (for database pages)"
    }
   },
   required: ["parent_id", "title"]
  },
  execute(args) {
   try {
    const parentId = args.parent_id || "";
    const parentType = args.parent_type || "page_id";
    const title = args.title || "";
    const content = args.content;
    const propsJson = args.properties;
    if (!parentId) {
     return JSON.stringify({ error: "parent_id is required" });
    }
    if (!title) {
     return JSON.stringify({ error: "title is required" });
    }
    let parentPayload;
    if (parentType === "database_id") {
     const dataSourceId = notionApi.resolveDataSourceId(parentId);
     parentPayload = { data_source_id: dataSourceId };
    } else {
     parentPayload = { [parentType]: parentId };
    }
    const body = { parent: parentPayload };
    if (parentType === "database_id") {
     let props = { Name: { title: buildRichText(title) } };
     if (propsJson) {
      try {
       const additional = JSON.parse(propsJson);
       props = { ...props, ...additional };
      } catch {
       return JSON.stringify({ error: "Invalid properties JSON" });
      }
     }
     body.properties = props;
    } else {
     body.properties = { title: { title: buildRichText(title) } };
    }
    const appendContentAfterCreate = parentType === "database_id" && !!content;
    if (content && !appendContentAfterCreate) {
     body.children = [buildParagraphBlock(content)];
    }
    const page = notionApi.createPage(body);
    const pageId = page.id;
    if (appendContentAfterCreate && content) {
     notionApi.appendBlockChildren(pageId, [buildParagraphBlock(content)]);
    }
    return JSON.stringify({
     success: true,
     page: formatPageSummary(page)
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/delete-block.js
 var deleteBlockTool = {
  name: "delete-block",
  description: "Delete a block. Permanently removes the block from Notion.",
  input_schema: {
   type: "object",
   properties: { block_id: { type: "string", description: "The block ID to delete" } },
   required: ["block_id"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    const result = notionApi.deleteBlock(blockId);
    const rec = result;
    return JSON.stringify({ object: rec.object || "block", id: rec.id });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/delete-page.js
 var deletePageTool = {
  name: "delete-page",
  description: "Delete (archive) a page. Archived pages can be restored from Notion's trash.",
  input_schema: {
   type: "object",
   properties: { page_id: { type: "string", description: "The page ID to delete/archive" } },
   required: ["page_id"]
  },
  execute(args) {
   try {
    const pageId = args.page_id || "";
    if (!pageId) {
     return JSON.stringify({ error: "page_id is required" });
    }
    const page = notionApi.archivePage(pageId);
    return JSON.stringify({
     success: true,
     message: "Page archived",
     page: formatPageSummary(page)
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-block.js
 var getBlockTool = {
  name: "get-block",
  description: "Get a block by its ID. Returns the block's type and content.",
  input_schema: {
   type: "object",
   properties: { block_id: { type: "string", description: "The block ID" } },
   required: ["block_id"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    const block = notionApi.getBlock(blockId);
    return JSON.stringify({
     ...formatBlockSummary(block),
     raw: block
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-block-children.js
 var getBlockChildrenTool = {
  name: "get-block-children",
  description: "Get the children blocks of a block or page.",
  input_schema: {
   type: "object",
   properties: {
    block_id: { type: "string", description: "The parent block or page ID" },
    page_size: { type: "number", description: "Number of blocks (default 50, max 100)" }
   },
   required: ["block_id"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    const pageSize = Math.min(args.page_size || 50, 100);
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    const result = notionApi.getBlockChildren(blockId, pageSize);
    return JSON.stringify({
     parent_id: blockId,
     count: result.results.length,
     has_more: result.has_more,
     children: result.results.map((b) => formatBlockSummary(b))
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-database.js
 var getDatabaseTool = {
  name: "get-database",
  description: "Get a database's schema and metadata. Shows all properties and their types.",
  input_schema: {
   type: "object",
   properties: { database_id: { type: "string", description: "The database ID" } },
   required: ["database_id"]
  },
  execute(args) {
   try {
    const databaseId = args.database_id || "";
    if (!databaseId) {
     return JSON.stringify({ error: "database_id is required" });
    }
    const dataSourceId = notionApi.resolveDataSourceId(databaseId);
    const dsResult = notionApi.getDataSource(dataSourceId);
    const dsRec = dsResult;
    const props = dsRec.properties;
    const schema = {};
    if (props) {
     for (const [name, prop] of Object.entries(props)) {
      const propData = prop;
      schema[name] = { type: propData.type, id: propData.id };
     }
    }
    return JSON.stringify({ ...formatDatabaseSummary(dsRec), schema });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-page.js
 var getPageTool = {
  name: "get-page",
  description: "Get a page's metadata and properties by its ID. Use notion-get-page-content to get the actual content/blocks.",
  input_schema: {
   type: "object",
   properties: {
    page_id: { type: "string", description: "The page ID (UUID format, with or without dashes)" }
   },
   required: ["page_id"]
  },
  execute(args) {
   try {
    const pageId = args.page_id || "";
    if (!pageId) {
     return JSON.stringify({ error: "page_id is required" });
    }
    const page = notionApi.getPage(pageId);
    return JSON.stringify({
     ...formatPageSummary(page),
     properties: page.properties
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-page-content.js
 var getPageContentTool = {
  name: "get-page-content",
  description: "Get the content blocks of a page. Returns the text and structure of the page. Use recursive=true to also get nested blocks.",
  input_schema: {
   type: "object",
   properties: {
    page_id: { type: "string", description: "The page ID to get content from" },
    recursive: {
     type: "string",
     enum: ["true", "false"],
     description: "Whether to fetch nested blocks (default: false)"
    },
    page_size: {
     type: "number",
     description: "Number of blocks to return (default 50, max 100)"
    }
   },
   required: ["page_id"]
  },
  execute(args) {
   try {
    const pageId = args.page_id || "";
    const recursive = args.recursive === "true";
    const pageSize = Math.min(args.page_size || 50, 100);
    if (!pageId) {
     return JSON.stringify({ error: "page_id is required" });
    }
    const result = notionApi.getPageContent(pageId, pageSize);
    const blocks = [];
    for (const block of result.results) {
     const summary = formatBlockSummary(block);
     let children = [];
     if (recursive && block.object === "block") {
      const childrenResult = notionApi.getBlockChildren(block.id, 50);
      children = childrenResult.results.map((c) => formatBlockSummary(c));
     }
     blocks.push({ ...summary, children: children.length > 0 ? children : void 0 });
    }
    return JSON.stringify({
     page_id: pageId,
     block_count: blocks.length,
     has_more: result.has_more,
     blocks
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/get-user.js
 var getUserTool = {
  name: "get-user",
  description: "Get a user by their ID.",
  input_schema: {
   type: "object",
   properties: { user_id: { type: "string", description: "The user ID" } },
   required: ["user_id"]
  },
  execute(args) {
   try {
    const userId = args.user_id || "";
    if (!userId) {
     return JSON.stringify({ error: "user_id is required" });
    }
    const user = notionApi.getUser(userId);
    const summary = formatUserSummary(user);
    return JSON.stringify(summary);
   } catch (e) {
    console.error("[notion][tool:get-user] Error while fetching user:", e);
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/cache.js
 var CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1e3;
 function isCacheFresh() {
  const s = getNotionSkillState2();
  const lastSync = s.syncStatus.lastSyncTime;
  if (!lastSync)
   return false;
  return Date.now() - lastSync < CACHE_MAX_AGE_MS;
 }

 // skills-ts-out/core/notion/tools/list-all-databases.js
 var listDatabasesTool = {
  name: "list-databases",
  description: "List databases in the workspace. Returns one page of results. Set tryCache=true to use locally synced databases when available (faster).",
  input_schema: {
   type: "object",
   properties: {
    page_size: { type: "number", description: "Number of results (default 20, max 100)" },
    tryCache: {
     type: "boolean",
     description: "If true, return locally cached databases when cache is fresh (synced within 3 hours)"
    }
   }
  },
  execute(args) {
   try {
    const pageSize = Math.min(args.page_size || 20, 100);
    const tryCache = args.tryCache === true;
    if (tryCache && isCacheFresh()) {
     const localDbs = getLocalDatabases({ limit: pageSize });
     if (localDbs.length > 0) {
      const databases2 = localDbs.map((d) => ({
       id: d.id,
       title: d.title,
       url: d.url,
       created_time: d.created_time,
       last_edited_time: d.last_edited_time,
       property_count: d.property_count
      }));
      return JSON.stringify({
       count: databases2.length,
       has_more: localDbs.length >= pageSize,
       databases: databases2,
       source: "cache"
      });
     }
    }
    const result = notionApi.listAllDatabases(pageSize);
    const databases = result.results.map((item) => formatDatabaseSummary(item));
    return JSON.stringify({
     count: databases.length,
     has_more: result.has_more,
     databases,
     source: "api"
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/list-all-pages.js
 var listPagesTool = {
  name: "list-pages",
  description: "List pages in the workspace. Returns one page of results. Set tryCache=true to use locally synced pages when available (faster).",
  input_schema: {
   type: "object",
   properties: {
    page_size: {
     type: "number",
     description: "Number of results to return (default 20, max 100)"
    },
    tryCache: {
     type: "boolean",
     description: "If true, return locally cached pages when cache is fresh (synced within 3 hours)"
    }
   }
  },
  execute(args) {
   try {
    const pageSize = Math.min(args.page_size || 20, 100);
    const tryCache = args.tryCache === true;
    if (tryCache && isCacheFresh()) {
     const localPages = getLocalPages({ limit: pageSize, includeArchived: false });
     if (localPages.length > 0) {
      const pages2 = localPages.map((p) => ({
       id: p.id,
       title: p.title,
       url: p.url,
       created_time: p.created_time,
       last_edited_time: p.last_edited_time,
       archived: !!p.archived,
       parent_type: p.parent_type
      }));
      return JSON.stringify({
       count: pages2.length,
       has_more: localPages.length >= pageSize,
       pages: pages2,
       source: "cache"
      });
     }
    }
    const result = notionApi.search({
     filter: { property: "object", value: "page" },
     sort: { direction: "descending", timestamp: "last_edited_time" },
     page_size: pageSize
    });
    const pages = result.results.map(formatPageSummary);
    return JSON.stringify({
     count: pages.length,
     has_more: result.has_more,
     pages,
     source: "api"
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/list-comments.js
 var listCommentsTool = {
  name: "list-comments",
  description: "List comments on a block or page.",
  input_schema: {
   type: "object",
   properties: {
    block_id: { type: "string", description: "Block or page ID to get comments for" },
    page_size: { type: "number", description: "Number of results (default 20, max 100)" }
   },
   required: ["block_id"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    const pageSize = Math.min(args.page_size || 20, 100);
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    const result = notionApi.listComments(blockId, pageSize);
    const comments = result.results.map((comment) => {
     const commentRec = comment;
     return {
      id: commentRec.id,
      discussion_id: commentRec.discussion_id,
      created_time: commentRec.created_time,
      created_by: commentRec.created_by,
      text: formatRichText(commentRec.rich_text)
     };
    });
    return JSON.stringify({ count: comments.length, has_more: result.has_more, comments });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/list-users.js
 var listUsersTool = {
  name: "list-users",
  description: "List users in the workspace. Returns one page of results (up to 100). Set tryCache=true to use locally synced users when available (faster).",
  input_schema: {
   type: "object",
   properties: {
    page_size: { type: "number", description: "Number of results (default 100, max 100)" },
    tryCache: {
     type: "boolean",
     description: "If true, return locally cached users when cache is fresh (synced within 3 hours)"
    }
   }
  },
  execute(args) {
   try {
    const pageSize = Math.min(args.page_size || 100, 100);
    const tryCache = args.tryCache === true;
    if (tryCache && isCacheFresh()) {
     const localUsers = getLocalUsers();
     if (localUsers.length > 0) {
      const users2 = localUsers.map((u) => ({
       id: u.id,
       name: u.name,
       email: u.email,
       type: u.user_type,
       avatar_url: u.avatar_url
      }));
      return JSON.stringify({ count: users2.length, users: users2, source: "cache" });
     }
    }
    const result = notionApi.listUsers(pageSize);
    const users = result.results.map((u) => formatUserSummary(u));
    return JSON.stringify({
     count: users.length,
     has_more: result.has_more,
     users,
     source: "api"
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/query-database.js
 var queryDatabaseTool = {
  name: "query-database",
  description: "Query a database with optional filters and sorts. Returns database rows/pages.",
  input_schema: {
   type: "object",
   properties: {
    database_id: { type: "string", description: "The database ID to query" },
    filter: {
     type: "string",
     description: "JSON string of filter object (Notion filter syntax)"
    },
    sorts: { type: "string", description: "JSON string of sorts array (Notion sort syntax)" },
    page_size: { type: "number", description: "Number of results (default 20, max 100)" }
   },
   required: ["database_id"]
  },
  execute(args) {
   try {
    const databaseId = args.database_id || "";
    const filterJson = args.filter;
    const sortsJson = args.sorts;
    const pageSize = Math.min(args.page_size || 20, 100);
    if (!databaseId) {
     return JSON.stringify({ error: "database_id is required" });
    }
    const body = { page_size: pageSize };
    if (filterJson) {
     try {
      body.filter = JSON.parse(filterJson);
     } catch {
      return JSON.stringify({ error: "Invalid filter JSON" });
     }
    }
    if (sortsJson) {
     try {
      body.sorts = JSON.parse(sortsJson);
     } catch {
      return JSON.stringify({ error: "Invalid sorts JSON" });
     }
    }
    const result = notionApi.queryDataSource(databaseId, body);
    const rows = result.results.map((page) => {
     return { ...formatPageSummary(page), properties: page.properties };
    });
    return JSON.stringify({ count: rows.length, has_more: result.has_more, rows });
   } catch (e) {
    const error = formatApiError(e);
    console.error(`[notion][query-database] Error querying database ${args.database_id}:`, e);
    return JSON.stringify({ error, database_id: args.database_id });
   }
  }
 };

 // skills-ts-out/core/notion/tools/search.js
 function toSearchResultItem(item) {
  const inTrashVal = item.in_trash !== void 0 && item.in_trash !== null ? item.in_trash : item.archived !== void 0 && item.archived !== null ? item.archived : false;
  const base = {
   object: item.object,
   id: item.id,
   created_time: item.created_time,
   last_edited_time: item.last_edited_time,
   in_trash: inTrashVal,
   is_locked: item.is_locked !== void 0 && item.is_locked !== null ? item.is_locked : false,
   url: item.url !== void 0 && item.url !== null ? item.url : null,
   public_url: item.public_url !== void 0 && item.public_url !== null ? item.public_url : null,
   parent: item.parent !== void 0 && item.parent !== null ? item.parent : null,
   properties: item.properties !== void 0 && item.properties !== null ? item.properties : {},
   icon: item.icon !== void 0 && item.icon !== null ? item.icon : null,
   cover: item.cover !== void 0 && item.cover !== null ? item.cover : null,
   created_by: item.created_by !== void 0 && item.created_by !== null ? item.created_by : null,
   last_edited_by: item.last_edited_by !== void 0 && item.last_edited_by !== null ? item.last_edited_by : null
  };
  if (item.object === "page") {
   return { ...base, title: formatPageTitle(item) };
  }
  if (item.object === "database" || item.object === "data_source") {
   const title = Array.isArray(item.title) && item.title.length ? item.title.map((t) => t.plain_text || "").join("") : "(Untitled)";
   return { ...base, title };
  }
  return base;
 }
 var searchTool = {
  name: "search",
  description: "Search for pages and databases in your Notion workspace. Supports query, filter by object type (page or database), and sort by last_edited_time.",
  input_schema: {
   type: "object",
   properties: {
    query: { type: "string", description: "Search query (optional, returns recent if empty)" },
    filter: {
     type: "string",
     enum: ["page", "database", "data_source"],
     description: "Filter results by type: page or database (data_source)"
    },
    sort_direction: {
     type: "string",
     enum: ["ascending", "descending"],
     description: "Sort direction (default: descending by last_edited_time)"
    },
    page_size: {
     type: "number",
     description: "Number of results to return (default 20, max 100)"
    }
   }
  },
  execute(args) {
   try {
    const query = (args.query || "").trim();
    const filter = args.filter;
    const sortDirection = args.sort_direction || "descending";
    const pageSize = Math.min(args.page_size || 20, 100);
    const body = { page_size: pageSize };
    if (query)
     body.query = query;
    if (filter) {
     const filterValue = filter === "database" || filter === "data_source" ? "data_source" : "page";
     body.filter = { property: "object", value: filterValue };
    }
    body.sort = {
     direction: sortDirection === "ascending" ? "ascending" : "descending",
     timestamp: "last_edited_time"
    };
    const result = notionApi.search(body);
    const results = result.results.map(toSearchResultItem);
    const resultRec = result;
    return JSON.stringify({
     object: resultRec.object !== void 0 && resultRec.object !== null ? resultRec.object : "list",
     next_cursor: resultRec.next_cursor !== void 0 && resultRec.next_cursor !== null ? resultRec.next_cursor : null,
     has_more: result.has_more !== void 0 && result.has_more !== null ? result.has_more : false,
     results
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/update-block.js
 var updateBlockTool = {
  name: "update-block",
  description: "Update a block's content. The structure depends on the block type.",
  input_schema: {
   type: "object",
   properties: {
    block_id: { type: "string", description: "The block ID to update" },
    content: {
     type: "string",
     description: 'JSON string of the block type content. Example for paragraph: {"paragraph":{"rich_text":[{"text":{"content":"Updated text"}}]}}'
    },
    archived: {
     type: "string",
     enum: ["true", "false"],
     description: "Set to true to archive the block"
    }
   },
   required: ["block_id"]
  },
  execute(args) {
   try {
    const blockId = args.block_id || "";
    const contentJson = args.content;
    const archived = args.archived;
    if (!blockId) {
     return JSON.stringify({ error: "block_id is required" });
    }
    const body = {};
    if (contentJson) {
     try {
      const content = JSON.parse(contentJson);
      Object.assign(body, content);
     } catch {
      return JSON.stringify({ error: "Invalid content JSON" });
     }
    }
    if (archived !== void 0) {
     body.archived = archived === "true";
    }
    if (Object.keys(body).length === 0) {
     return JSON.stringify({ error: "No updates specified" });
    }
    const block = notionApi.updateBlock(blockId, body);
    return JSON.stringify({
     success: true,
     block: formatBlockSummary(block)
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/update-database.js
 var updateDatabaseTool = {
  name: "update-database",
  description: "Update a database's title or properties schema.",
  input_schema: {
   type: "object",
   properties: {
    database_id: { type: "string", description: "The database ID to update" },
    title: { type: "string", description: "New title (optional)" },
    properties: { type: "string", description: "JSON string of properties to add or update" }
   },
   required: ["database_id"]
  },
  execute(args) {
   try {
    const databaseId = args.database_id || "";
    const title = args.title;
    const propsJson = args.properties;
    if (!databaseId) {
     return JSON.stringify({ error: "database_id is required" });
    }
    const body = {};
    if (title) {
     body.title = buildRichText(title);
    }
    if (propsJson) {
     try {
      body.properties = JSON.parse(propsJson);
     } catch {
      return JSON.stringify({ error: "Invalid properties JSON" });
     }
    }
    if (Object.keys(body).length === 0) {
     return JSON.stringify({ error: "No updates specified" });
    }
    const dbResult = notionApi.updateDatabase(databaseId, body);
    return JSON.stringify({
     success: true,
     database: formatDatabaseSummary(dbResult)
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/update-page.js
 var updatePageTool = {
  name: "update-page",
  description: "Update a page's properties. Can update title and other properties. Use notion-append-text to add content blocks.",
  input_schema: {
   type: "object",
   properties: {
    page_id: { type: "string", description: "The page ID to update" },
    title: { type: "string", description: "New title (optional)" },
    properties: { type: "string", description: "JSON string of properties to update" },
    archived: {
     type: "string",
     enum: ["true", "false"],
     description: "Set to true to archive the page"
    }
   },
   required: ["page_id"]
  },
  execute(args) {
   try {
    const pageId = args.page_id || "";
    const title = args.title;
    const propsJson = args.properties;
    const archived = args.archived;
    if (!pageId) {
     return JSON.stringify({ error: "page_id is required" });
    }
    const body = {};
    if (title) {
     body.properties = { title: { title: buildRichText(title) } };
    }
    if (propsJson) {
     try {
      const props = JSON.parse(propsJson);
      const existingProps = body.properties || {};
      body.properties = { ...existingProps, ...props };
     } catch {
      return JSON.stringify({ error: "Invalid properties JSON" });
     }
    }
    if (archived !== void 0) {
     body.archived = archived === "true";
    }
    if (Object.keys(body).length === 0) {
     return JSON.stringify({ error: "No updates specified" });
    }
    const page = notionApi.updatePage(pageId, body);
    return JSON.stringify({
     success: true,
     page: formatPageSummary(page)
    });
   } catch (e) {
    return JSON.stringify({ error: formatApiError(e) });
   }
  }
 };

 // skills-ts-out/core/notion/tools/index.js
 function withLogging(tool) {
  const originalExecute = tool.execute;
  const toolName = tool.name;
  return {
   ...tool,
   execute(args) {
    const argKeys = Object.keys(args || {});
    const argSummary = argKeys.length > 0 ? argKeys.map((k) => {
     const v = args[k];
     if (typeof v === "string")
      return `${k}=<${v.length} chars>`;
     if (Array.isArray(v))
      return `${k}=<array ${v.length}>`;
     if (v && typeof v === "object")
      return `${k}=<object>`;
     return `${k}=${JSON.stringify(v)}`;
    }).join(", ") : "(none)";
    console.log(`[notion][tool:${toolName}] called with ${argSummary}`);
    const t0 = Date.now();
    try {
     const text = originalExecute.call(this, args);
     const ms = Date.now() - t0;
     const len = text ? text.length : 0;
     let errMsg = "";
     try {
      const parsed = JSON.parse(text);
      if (parsed.error)
       errMsg = ` error="${String(parsed.error).slice(0, 100)}"`;
     } catch {
     }
     console.log(`[notion][tool:${toolName}] OK ${ms}ms (${len}b)${errMsg}`);
     return text;
    } catch (e) {
     const ms = Date.now() - t0;
     const msg = e instanceof Error ? e.message : String(e);
     console.error(`[notion][tool:${toolName}] FAILED ${ms}ms: ${msg}`);
     throw e;
    }
   }
  };
 }
 var rawTools = [
  appendBlocksTool,
  appendTextTool,
  createCommentTool,
  createDatabaseTool,
  createPageTool,
  deleteBlockTool,
  deletePageTool,
  getBlockTool,
  getBlockChildrenTool,
  getDatabaseTool,
  getPageTool,
  getPageContentTool,
  getUserTool,
  listDatabasesTool,
  listPagesTool,
  listCommentsTool,
  listUsersTool,
  queryDatabaseTool,
  searchTool,
  updateBlockTool,
  updateDatabaseTool,
  updatePageTool
 ];
 var tools = rawTools.map(withLogging);
 var tools_default = tools;

 // skills-ts-out/core/notion/index.js
 function init() {
  console.log("[notion] Initializing");
  const s = getNotionSkillState2();
  initializeNotionSchema();
  const saved = state.get("config");
  if (saved) {
   s.config.credentialId = saved.credentialId || s.config.credentialId;
   s.config.workspaceName = saved.workspaceName || s.config.workspaceName;
   s.config.syncIntervalMinutes = saved.syncIntervalMinutes || s.config.syncIntervalMinutes;
   s.config.contentSyncEnabled = saved.contentSyncEnabled !== void 0 && saved.contentSyncEnabled !== null ? saved.contentSyncEnabled : s.config.contentSyncEnabled;
   s.config.maxPagesPerContentSync = saved.maxPagesPerContentSync || s.config.maxPagesPerContentSync;
  }
  const lastSync = state.get("lastSyncTime");
  if (lastSync) {
   s.syncStatus.lastSyncTime = typeof lastSync === "number" ? lastSync : new Date(lastSync).getTime();
  }
  const counts = getEntityCounts();
  s.syncStatus.totalPages = counts.pages;
  s.syncStatus.totalDatabases = counts.databases;
  s.syncStatus.totalDatabaseRows = counts.databaseRows;
  s.syncStatus.pagesWithContent = counts.pagesWithContent;
  s.syncStatus.pagesWithSummary = counts.pagesWithSummary;
  const oauthCred = oauth.getCredential();
  if (oauthCred) {
   s.config.credentialId = oauthCred.credentialId;
   console.log(`[notion] Connected via OAuth to workspace: ${s.config.workspaceName || "(unnamed)"}`);
  } else if (isNotionConnected()) {
   console.log(`[notion] Connected via auth credential to workspace: ${s.config.workspaceName || "(unnamed)"}`);
  } else {
   console.log("[notion] No credential \u2014 waiting for setup");
  }
  publishState();
 }
 function start() {
  const s = getNotionSkillState2();
  if (!isNotionConnected()) {
   console.log("[notion] No credential \u2014 skill inactive until auth completes");
   return;
  }
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register("notion-sync", cronExpr);
  console.log(`[notion] Scheduled sync every ${s.config.syncIntervalMinutes} minutes`);
 }
 function stop() {
  console.log("[notion] Stopping");
  const s = getNotionSkillState2();
  cron.unregister("notion-sync");
  state.set("config", s.config);
  state.set("status", "stopped");
  console.log("[notion] Stopped");
 }
 function onCronTrigger(scheduleId) {
  console.log(`[notion] Cron triggered: ${scheduleId}`);
  if (scheduleId === "notion-sync") {
   performSync();
  }
 }
 function onSessionStart(args) {
  const s = getNotionSkillState2();
  s.activeSessions.push(args.sessionId);
 }
 function onSessionEnd(args) {
  const s = getNotionSkillState2();
  const index = s.activeSessions.indexOf(args.sessionId);
  if (index > -1) {
   s.activeSessions.splice(index, 1);
  }
 }
 function onOAuthComplete(args) {
  const s = getNotionSkillState2();
  s.config.credentialId = args.credentialId;
  console.log(`[notion] OAuth complete \u2014 credential: ${args.credentialId}, account: ${args.accountLabel || "(unknown)"}`);
  if (args.accountLabel) {
   s.config.workspaceName = args.accountLabel;
  }
  state.set("config", s.config);
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register("notion-sync", cronExpr);
  publishState();
 }
 function onOAuthRevoked(args) {
  console.log(`[notion] OAuth revoked \u2014 reason: ${args.reason}`);
  const s = getNotionSkillState2();
  s.config.credentialId = "";
  s.config.workspaceName = "";
  state.delete("config");
  cron.unregister("notion-sync");
  publishState();
 }
 function onDisconnect() {
  console.log("[notion] Disconnecting");
  const s = getNotionSkillState2();
  oauth.revoke();
  s.config.credentialId = "";
  s.config.workspaceName = "";
  state.delete("config");
  cron.unregister("notion-sync");
  publishState();
 }
 function onAuthComplete(args) {
  console.log(`[notion] onAuthComplete \u2014 mode: ${args.mode}`);
  const s = getNotionSkillState2();
  if (args.mode === "managed") {
   return { status: "complete" };
  }
  const token = args.credentials.api_token || args.credentials.content || args.credentials.access_token;
  if (!token) {
   return { status: "error", errors: [{ field: "api_token", message: "API token is required." }] };
  }
  try {
   const response = net.fetch("https://api.notion.com/v1/users/me", {
    method: "GET",
    headers: {
     Authorization: `Bearer ${token}`,
     "Content-Type": "application/json",
     "Notion-Version": "2026-03-11"
    },
    timeout: 15
   });
   if (response.status === 401 || response.status === 403) {
    return {
     status: "error",
     errors: [
      {
       field: "api_token",
       message: "Invalid token. Check that your integration token is correct."
      }
     ]
    };
   }
   if (response.status >= 400) {
    return {
     status: "error",
     errors: [
      {
       field: "api_token",
       message: `Notion API returned error ${response.status}. Please check your token.`
      }
     ]
    };
   }
   try {
    const data = JSON.parse(response.body);
    const botUser = data.results ? data.results.find((u) => u.type === "bot") : void 0;
    if (botUser && botUser.name) {
     s.config.workspaceName = botUser.name;
    }
   } catch {
   }
  } catch (err) {
   return {
    status: "error",
    errors: [{ field: "api_token", message: `Could not reach Notion API: ${String(err)}` }]
   };
  }
  state.set("config", s.config);
  const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
  cron.register("notion-sync", cronExpr);
  publishState();
  return { status: "complete", message: "Connected to Notion!" };
 }
 function onAuthRevoked(args) {
  console.log(`[notion] Auth revoked \u2014 mode: ${args.mode || "unknown"}`);
  const s = getNotionSkillState2();
  s.config.credentialId = "";
  s.config.workspaceName = "";
  state.setPartial({ profile: null });
  state.delete("config");
  cron.unregister("notion-sync");
  publishState();
 }
 function onSetupStart() {
  return {
   step: {
    id: "auth_done",
    title: "Setup Complete",
    description: "Authentication is configured. Click Continue to finish.",
    fields: []
   }
  };
 }
 function onSetupSubmit(_args) {
  return { status: "complete" };
 }
 function onSync() {
  console.log("[notion] Syncing");
  try {
   const user = notionApi.getUser("me");
   const profile = formatUserSummary(user);
   state.setPartial({ profile });
  } catch (e) {
   console.error("[notion] Failed to fetch profile on OAuth complete:", e);
  }
  publishState();
  performSync();
 }
 function onListOptions() {
  const s = getNotionSkillState2();
  return {
   options: [
    {
     name: "syncInterval",
     type: "select",
     label: "Sync Interval",
     value: s.config.syncIntervalMinutes.toString(),
     options: [
      { label: "Every 10 minutes", value: "10" },
      { label: "Every 20 minutes", value: "20" },
      { label: "Every 30 minutes", value: "30" },
      { label: "Every hour", value: "60" }
     ]
    },
    {
     name: "contentSyncEnabled",
     type: "boolean",
     label: "Sync Page Content",
     value: s.config.contentSyncEnabled
    },
    {
     name: "maxPagesPerContentSync",
     type: "select",
     label: "Pages Per Content Sync",
     value: s.config.maxPagesPerContentSync.toString(),
     options: [
      { label: "25 pages", value: "25" },
      { label: "50 pages", value: "50" },
      { label: "100 pages", value: "100" }
     ]
    }
   ]
  };
 }
 function onSetOption(args) {
  const s = getNotionSkillState2();
  switch (args.name) {
   case "syncInterval":
    s.config.syncIntervalMinutes = parseInt(args.value, 10);
    if (isNotionConnected()) {
     cron.unregister("notion-sync");
     const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
     cron.register("notion-sync", cronExpr);
    }
    break;
   case "contentSyncEnabled":
    s.config.contentSyncEnabled = Boolean(args.value);
    break;
   case "maxPagesPerContentSync":
    s.config.maxPagesPerContentSync = parseInt(args.value, 10);
    break;
  }
  state.set("config", s.config);
  publishState();
 }
 function publishState() {
  const s = getNotionSkillState2();
  const isConnected = isNotionConnected();
  let pages = [];
  if (isConnected) {
   try {
    const localPages = getLocalPages({ limit: 100 });
    pages = localPages.map((p) => ({
     id: p.id,
     title: p.title,
     url: p.url,
     last_edited_time: p.last_edited_time
    }));
   } catch (e) {
    console.error("[notion] publishState: failed to load local pages:", e);
   }
  }
  state.setPartial({
   // Standard SkillHostConnectionState fields
   connection_status: isConnected ? "connected" : "disconnected",
   auth_status: isConnected ? "authenticated" : "not_authenticated",
   connection_error: s.syncStatus.lastSyncError || null,
   auth_error: null,
   is_initialized: isConnected,
   // Skill-specific fields
   workspaceName: s.config.workspaceName || null,
   syncInProgress: s.syncStatus.syncInProgress,
   lastSyncTime: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null,
   totalPages: s.syncStatus.totalPages,
   totalDatabases: s.syncStatus.totalDatabases,
   totalDatabaseRows: s.syncStatus.totalDatabaseRows,
   pagesWithContent: s.syncStatus.pagesWithContent,
   pagesWithSummary: s.syncStatus.pagesWithSummary,
   lastSyncError: s.syncStatus.lastSyncError,
   pages
  });
 }
 function onPing() {
  if (!isNotionConnected()) {
   return { ok: false, errorType: "auth", errorMessage: "No credential" };
  }
  console.log("[notion] onPing: ok (credential present)");
  return { ok: true };
 }
 var skill = {
  info: {
   id: "notion",
   name: "Notion",
   version: "2.1.0",
   // Bumped for persistent storage
   description: "Notion integration with persistent storage",
   auto_start: false,
   setup: { required: true, label: "Configure Notion" }
  },
  tools: tools_default,
  init,
  start,
  stop,
  onCronTrigger,
  onSessionStart,
  onSessionEnd,
  onOAuthComplete,
  onOAuthRevoked,
  onAuthComplete,
  onAuthRevoked,
  onSetupStart,
  onSetupSubmit,
  onDisconnect,
  onSync,
  onListOptions,
  onSetOption,
  publishState,
  onPing
 };
 var g = globalThis;
 if (typeof g.__skill === "undefined") {
  g.__skill = { default: skill };
 }
 var index_default = skill;
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
