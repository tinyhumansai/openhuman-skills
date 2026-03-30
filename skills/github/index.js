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

 // skills-ts-out/github/index.js
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
  static from(data2, encodingOrOffset, length) {
   if (typeof data2 === "bigint" || data2 && typeof data2 === "object" && typeof data2.toJSNumber === "function") {
    let bigVal = typeof data2 === "bigint" ? data2 : data2.value;
    if (typeof bigVal !== "bigint") bigVal = BigInt(data2.valueOf());
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
   if (data2 instanceof ArrayBuffer) {
    return new _Buffer(data2, encodingOrOffset || 0, length);
   }
   if (ArrayBuffer.isView(data2)) {
    return new _Buffer(data2.buffer, data2.byteOffset, data2.byteLength);
   }
   if (typeof data2 === "string") {
    const encoding = encodingOrOffset || "utf8";
    return _Buffer.fromString(data2, encoding);
   }
   if (Array.isArray(data2)) {
    const numData = data2.map(toNumber);
    return new _Buffer(numData);
   }
   if (typeof data2 === "object" && data2 !== null && typeof data2.length === "number") {
    const arr = Array.from(data2, toNumber);
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

 // skills-ts-out/github/state.js
 function initGitHubSkillState() {
  const stateObj = {
   config: {
    token: "",
    username: "",
    refreshToken: "",
    tokenExpiresAt: 0,
    refreshTokenExpiresAt: 0,
    clientId: "",
    enableRepoTools: true,
    enableIssueTools: true,
    enablePrTools: true,
    enableSearchTools: true,
    enableCodeTools: true,
    enableReleaseTools: false,
    enableGistTools: true,
    enableWorkflowTools: false,
    enableNotificationTools: false
   },
   authenticated: false,
   activeSessions: []
  };
  globalThis.__githubSkillState = stateObj;
  return stateObj;
 }
 initGitHubSkillState();
 globalThis.getGitHubSkillState = function getGitHubSkillState() {
  const s = globalThis.__githubSkillState;
  if (!s) {
   throw new Error("[github] Skill state not initialized");
  }
  return s;
 };
 function getGitHubSkillState2() {
  const s = globalThis.__githubSkillState;
  if (!s)
   throw new Error("[github] Skill state not initialized");
  return s;
 }

 // skills-ts-out/github/api/oauth.js
 var GITHUB_OAUTH_BASE = "https://github.com";
 async function requestDeviceCode(clientId) {
  const response = await net.fetch(`${GITHUB_OAUTH_BASE}/login/device/code`, {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({ client_id: clientId }),
   timeout: 15e3
  });
  if (response.status !== 200) {
   throw new Error(`Failed to request device code: HTTP ${response.status} \u2014 ${response.body}`);
  }
  const data2 = JSON.parse(response.body);
  if (!data2.device_code || !data2.user_code) {
   throw new Error('Invalid device code response from GitHub. Ensure "Enable Device Flow" is checked in your GitHub App settings.');
  }
  return data2;
 }
 async function pollForAccessToken(clientId, deviceCode) {
  const response = await net.fetch(`${GITHUB_OAUTH_BASE}/login/oauth/access_token`, {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    client_id: clientId,
    device_code: deviceCode,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code"
   }),
   timeout: 15e3
  });
  if (response.status !== 200) {
   throw new Error(`Token poll failed: HTTP ${response.status}`);
  }
  const data2 = JSON.parse(response.body);
  if (data2.error) {
   return {
    error: data2.error,
    error_description: data2.error_description,
    error_uri: data2.error_uri,
    interval: data2.interval
   };
  }
  return data2;
 }
 async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const response = await net.fetch(`${GITHUB_OAUTH_BASE}/login/oauth/access_token`, {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken
   }),
   timeout: 15e3
  });
  if (response.status !== 200) {
   throw new Error(`Token refresh failed: HTTP ${response.status}`);
  }
  const data2 = JSON.parse(response.body);
  if (data2.error) {
   throw new Error(`Token refresh error: ${data2.error} \u2014 ${data2.error_description ?? ""}`);
  }
  return data2;
 }
 async function ensureValidToken() {
  const s = getGitHubSkillState2();
  if (!s.config.refreshToken)
   return;
  const now = Date.now();
  const bufferMs = 5 * 60 * 1e3;
  if (s.config.tokenExpiresAt > 0 && now < s.config.tokenExpiresAt - bufferMs) {
   return;
  }
  if (s.config.refreshTokenExpiresAt > 0 && now >= s.config.refreshTokenExpiresAt) {
   console.error("[github] Refresh token expired \u2014 user must re-authorize");
   s.authenticated = false;
   s.config.token = "";
   s.config.refreshToken = "";
   state.set("config", s.config);
   return;
  }
  const clientSecret = platform.env("GITHUB_APP_CLIENT_SECRET") ?? "";
  if (!clientSecret) {
   console.error("[github] Cannot refresh token: GITHUB_APP_CLIENT_SECRET not set");
   return;
  }
  try {
   console.log("[github] Access token expiring, refreshing...");
   const result = await refreshAccessToken(s.config.clientId, clientSecret, s.config.refreshToken);
   s.config.token = result.access_token;
   if (result.refresh_token) {
    s.config.refreshToken = result.refresh_token;
   }
   if (result.expires_in) {
    s.config.tokenExpiresAt = Date.now() + result.expires_in * 1e3;
   }
   if (result.refresh_token_expires_in) {
    s.config.refreshTokenExpiresAt = Date.now() + result.refresh_token_expires_in * 1e3;
   }
   state.set("config", s.config);
   console.log("[github] Token refreshed successfully");
  } catch (e) {
   console.error(`[github] Token refresh failed: ${e}`);
  }
 }
 function storeTokens(clientId, tokenResponse, username) {
  const s = getGitHubSkillState2();
  s.config.token = tokenResponse.access_token;
  s.config.clientId = clientId;
  s.config.username = username;
  if (tokenResponse.refresh_token) {
   s.config.refreshToken = tokenResponse.refresh_token;
  }
  if (tokenResponse.expires_in) {
   s.config.tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1e3;
  }
  if (tokenResponse.refresh_token_expires_in) {
   s.config.refreshTokenExpiresAt = Date.now() + tokenResponse.refresh_token_expires_in * 1e3;
  }
  s.authenticated = true;
  state.set("config", s.config);
 }
 globalThis.githubOAuth = {
  requestDeviceCode,
  pollForAccessToken,
  refreshAccessToken,
  ensureValidToken,
  storeTokens
 };

 // skills-ts-out/github/api/client.js
 var API_BASE = "https://api.github.com";
 function getHeaders() {
  const s = getGitHubSkillState2();
  const token = s.config.token || typeof platform !== "undefined" && platform.env("GITHUB_TOKEN");
  return {
   Authorization: `Bearer ${token || ""}`,
   Accept: "application/vnd.github+json",
   "X-GitHub-Api-Version": "2022-11-28",
   "User-Agent": "OpenHuman-GitHub-Skill/1.0"
  };
 }
 async function ghFetch(endpoint, options) {
  if (globalThis.githubOAuth?.ensureValidToken) {
   await globalThis.githubOAuth.ensureValidToken();
  }
  const method = options?.method ?? "GET";
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const headers = getHeaders();
  if (options?.accept) {
   headers["Accept"] = options.accept;
  }
  const fetchOpts = { method, headers, timeout: 3e4 };
  if (options?.body && (method === "POST" || method === "PUT" || method === "PATCH")) {
   headers["Content-Type"] = "application/json";
   fetchOpts.body = JSON.stringify(options.body);
  }
  const response = await net.fetch(url, fetchOpts);
  let data2 = null;
  if (response.body && response.body.trim()) {
   try {
    data2 = JSON.parse(response.body);
   } catch {
    data2 = response.body;
   }
  }
  if (response.status >= 400) {
   const msg = typeof data2 === "object" && data2 !== null && "message" in data2 ? data2.message : `HTTP ${response.status}`;
   throw new Error(`GitHub API error (${response.status}): ${msg}`);
  }
  return { status: response.status, body: response.body, data: data2 };
 }
 async function ghGet(endpoint) {
  return (await ghFetch(endpoint)).data;
 }
 async function ghPost(endpoint, body) {
  return (await ghFetch(endpoint, { method: "POST", body })).data;
 }
 async function ghPut(endpoint, body) {
  return (await ghFetch(endpoint, { method: "PUT", body })).data;
 }
 async function ghPatch(endpoint, body) {
  return (await ghFetch(endpoint, { method: "PATCH", body })).data;
 }
 async function ghDelete(endpoint) {
  return (await ghFetch(endpoint, { method: "DELETE" })).data;
 }
 async function checkAuth() {
  try {
   const user = await ghGet("/user");
   return { authenticated: true, username: user.login };
  } catch {
   return { authenticated: false, username: "" };
  }
 }

 // skills-ts-out/github/helpers.js
 var USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
 function reqString(args, key) {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) {
   throw new Error(`Missing required parameter: ${key}`);
  }
  return v.trim();
 }
 function optString(args, key) {
  const v = args[key];
  if (typeof v === "string" && v.trim()) {
   return v.trim();
  }
  return null;
 }
 function optNumber(args, key, fallback) {
  const v = args[key];
  if (typeof v === "number")
   return Math.floor(v);
  if (typeof v === "string") {
   const n = parseInt(v, 10);
   if (!isNaN(n))
    return n;
  }
  return fallback;
 }
 function optBoolean(args, key, fallback) {
  const v = args[key];
  return typeof v === "boolean" ? v : fallback;
 }
 function optStringList(args, key) {
  const v = args[key];
  if (Array.isArray(v)) {
   return v.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof v === "string" && v.trim()) {
   return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
 }
 function validateOwnerRepo(args) {
  const owner = reqString(args, "owner");
  const repo = reqString(args, "repo");
  if (!USERNAME_RE.test(owner)) {
   throw new Error(`Invalid owner: '${owner}'`);
  }
  return { owner, repo };
 }
 function validateRepoSpec(args) {
  const { owner, repo } = validateOwnerRepo(args);
  return `${owner}/${repo}`;
 }
 function validateUsername(value) {
  const v = value.trim().replace(/^@/, "");
  if (!v || !USERNAME_RE.test(v)) {
   throw new Error(`Invalid GitHub username: '${v}'`);
  }
  return v;
 }
 function validatePositiveInt(value, paramName) {
  if (typeof value === "number") {
   const iv = Math.floor(value);
   if (iv <= 0)
    throw new Error(`Invalid ${paramName}: must be a positive integer.`);
   return iv;
  }
  if (typeof value === "string") {
   const iv = parseInt(value, 10);
   if (isNaN(iv) || iv <= 0)
    throw new Error(`Invalid ${paramName}: must be a positive integer.`);
   return iv;
  }
  throw new Error(`Invalid ${paramName}: must be a positive integer.`);
 }
 function truncate(text, maxLen = 4e3) {
  if (text.length <= maxLen)
   return text;
  return text.substring(0, maxLen - 20) + "\n... (truncated)";
 }

 // skills-ts-out/github/tools/repo.js
 var listReposTool = {
  name: "list-repos",
  description: "List repositories for the authenticated user or a specific owner",
  input_schema: {
   type: "object",
   properties: {
    owner: {
     type: "string",
     description: "Repository owner (user or org). Defaults to the authenticated user"
    },
    limit: { type: "number", description: "Maximum number of repositories to return" },
    visibility: {
     type: "string",
     description: "Filter by visibility",
     enum: ["all", "public", "private"]
    },
    sort: {
     type: "string",
     description: "Sort field",
     enum: ["created", "updated", "pushed", "full_name"]
    }
   },
   required: []
  },
  async execute(args) {
   try {
    const limit = optNumber(args, "limit", 30);
    const owner = optString(args, "owner");
    const visibility = optString(args, "visibility");
    const sort = optString(args, "sort") || "updated";
    let endpoint;
    if (owner) {
     endpoint = `/users/${owner}/repos?sort=${sort}&per_page=${limit}`;
    } else {
     endpoint = `/user/repos?sort=${sort}&per_page=${limit}`;
     if (visibility)
      endpoint += `&visibility=${visibility}`;
    }
    const repos = await ghGet(endpoint);
    if (!repos || repos.length === 0)
     return JSON.stringify({ message: "No repositories found." });
    const lines = repos.slice(0, limit).map((r) => {
     const vis = r.private ? "private" : "public";
     const desc = r.description || "";
     const lang = r.language || "";
     let line = `${r.full_name} [${vis}] (${r.stargazers_count} stars)`;
     if (lang)
      line += ` [${lang}]`;
     if (desc)
      line += ` - ${desc.substring(0, 80)}`;
     return line;
    });
    return JSON.stringify({ repos: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getRepoTool = {
  name: "get-repo",
  description: "Get detailed information about a specific repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}`);
    const lines = [
     `Repository: ${r.full_name}`,
     `URL: ${r.html_url}`,
     `Visibility: ${r.private ? "private" : "public"}`,
     `Description: ${r.description || "N/A"}`,
     `Stars: ${r.stargazers_count}`,
     `Forks: ${r.forks_count}`,
     `Open Issues: ${r.open_issues_count}`,
     `Language: ${r.language || "N/A"}`,
     `Default Branch: ${r.default_branch}`,
     `License: ${r.license?.name || "N/A"}`,
     `Archived: ${r.archived}`,
     `Fork: ${r.fork}`,
     `Created: ${r.created_at}`,
     `Updated: ${r.updated_at}`
    ];
    if (r.homepage)
     lines.push(`Homepage: ${r.homepage}`);
    if (r.topics?.length)
     lines.push(`Topics: ${r.topics.join(", ")}`);
    return JSON.stringify({ info: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createRepoTool = {
  name: "create-repo",
  description: "Create a new repository for the authenticated user",
  input_schema: {
   type: "object",
   properties: {
    name: { type: "string", description: "Repository name" },
    description: { type: "string", description: "Repository description" },
    visibility: {
     type: "string",
     description: "Repository visibility",
     enum: ["public", "private"]
    },
    auto_init: { type: "boolean", description: "Initialize with a README" }
   },
   required: ["name"]
  },
  async execute(args) {
   try {
    const name = reqString(args, "name");
    const description = optString(args, "description");
    const visibility = optString(args, "visibility") || "private";
    const autoInit = optBoolean(args, "auto_init", false);
    const body = {
     name,
     private: visibility === "private",
     auto_init: autoInit
    };
    if (description)
     body.description = description;
    const r = await ghPost("/user/repos", body);
    return JSON.stringify({ message: `Repository created: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var forkRepoTool = {
  name: "fork-repo",
  description: "Fork a repository to the authenticated user's account",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Owner of the repository to fork" },
    repo: { type: "string", description: "Repository name to fork" },
    fork_name: { type: "string", description: "Custom name for the forked repository" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const forkName = optString(args, "fork_name");
    const body = {};
    if (forkName)
     body.name = forkName;
    const r = await ghPost(`/repos/${spec}/forks`, body);
    return JSON.stringify({ message: `Forked to: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var deleteRepoTool = {
  name: "delete-repo",
  description: "Permanently delete a repository. This action cannot be undone",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    confirm: { type: "boolean", description: "Must be true to confirm deletion" }
   },
   required: ["owner", "repo", "confirm"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const confirm = optBoolean(args, "confirm", false);
    if (!confirm)
     return JSON.stringify({
      error: `Deleting ${spec} is irreversible. Set confirm=true to proceed.`
     });
    await ghDelete(`/repos/${spec}`);
    return JSON.stringify({ message: `Repository ${spec} deleted.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var cloneRepoTool = {
  name: "clone-repo",
  description: "Get clone URLs for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}`);
    return JSON.stringify({
     message: `Clone URL (HTTPS): ${r.clone_url}
Clone URL (SSH): ${r.ssh_url}

Run: git clone ${r.clone_url}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listCollaboratorsTool = {
  name: "list-collaborators",
  description: "List collaborators on a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    limit: { type: "number", description: "Maximum number of collaborators to return" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const limit = optNumber(args, "limit", 30);
    const collabs = await ghGet(`/repos/${spec}/collaborators?per_page=${limit}`);
    if (!collabs || collabs.length === 0)
     return JSON.stringify({ message: "No collaborators found." });
    const lines = collabs.map((c) => {
     const perms = [];
     if (c.permissions?.admin)
      perms.push("admin");
     else if (c.permissions?.maintain)
      perms.push("maintain");
     else if (c.permissions?.push)
      perms.push("push");
     else if (c.permissions?.pull)
      perms.push("pull");
     const permStr = perms.length ? ` [${perms.join(", ")}]` : "";
     return `@${c.login}${permStr}`;
    });
    return JSON.stringify({ collaborators: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var addCollaboratorTool = {
  name: "add-collaborator",
  description: "Add a collaborator to a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    username: { type: "string", description: "GitHub username of the collaborator to add" },
    permission: {
     type: "string",
     description: "Permission level to grant",
     enum: ["pull", "triage", "push", "maintain", "admin"]
    }
   },
   required: ["owner", "repo", "username"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const username = validateUsername(reqString(args, "username"));
    const permission = optString(args, "permission") || "push";
    await ghPut(`/repos/${spec}/collaborators/${username}`, { permission });
    return JSON.stringify({
     message: `Invited @${username} to ${spec} with ${permission} permission.`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var removeCollaboratorTool = {
  name: "remove-collaborator",
  description: "Remove a collaborator from a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    username: { type: "string", description: "GitHub username of the collaborator to remove" }
   },
   required: ["owner", "repo", "username"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const username = validateUsername(reqString(args, "username"));
    await ghDelete(`/repos/${spec}/collaborators/${username}`);
    return JSON.stringify({ message: `Removed @${username} from ${spec}.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listTopicsTool = {
  name: "list-topics",
  description: "List topics (tags) on a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}/topics`);
    const topics = r.names || [];
    if (!topics.length)
     return JSON.stringify({ message: `No topics set on ${spec}.` });
    return JSON.stringify({ topics: topics.join(", ") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var setTopicsTool = {
  name: "set-topics",
  description: "Replace all topics on a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    topics: {
     type: "array",
     items: { type: "string" },
     description: "List of topic names to set"
    }
   },
   required: ["owner", "repo", "topics"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const topics = optStringList(args, "topics");
    if (!topics.length)
     return JSON.stringify({ error: "At least one topic is required." });
    await ghPut(`/repos/${spec}/topics`, { names: topics });
    return JSON.stringify({ message: `Topics set on ${spec}: ${topics.join(", ")}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listLanguagesTool = {
  name: "list-languages",
  description: "List programming languages detected in a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const languages = await ghGet(`/repos/${spec}/languages`);
    if (!languages || Object.keys(languages).length === 0) {
     return JSON.stringify({ message: `No languages detected in ${spec}.` });
    }
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    const lines = Object.entries(languages).sort((a, b) => b[1] - a[1]).map(([lang, bytes]) => `${lang}: ${(bytes / total * 100).toFixed(1)}%`);
    return JSON.stringify({ languages: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var repoTools = [
  listReposTool,
  getRepoTool,
  createRepoTool,
  forkRepoTool,
  deleteRepoTool,
  cloneRepoTool,
  listCollaboratorsTool,
  addCollaboratorTool,
  removeCollaboratorTool,
  listTopicsTool,
  setTopicsTool,
  listLanguagesTool
 ];

 // skills-ts-out/github/tools/issue.js
 var listIssuesTool = {
  name: "list-issues",
  description: "List issues in a repository with optional filters",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    limit: { type: "number", description: "Maximum number of issues to return" },
    state: { type: "string", description: "Filter by state", enum: ["open", "closed", "all"] },
    label: { type: "string", description: "Filter by label name" },
    assignee: { type: "string", description: "Filter by assignee username" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const limit = optNumber(args, "limit", 30);
    const issueState = optString(args, "state") || "open";
    const label = optString(args, "label");
    const assignee = optString(args, "assignee");
    let endpoint = `/repos/${spec}/issues?state=${issueState}&per_page=${limit}`;
    if (label)
     endpoint += `&labels=${encodeURIComponent(label)}`;
    if (assignee)
     endpoint += `&assignee=${encodeURIComponent(assignee)}`;
    const issues = await ghGet(endpoint);
    const filtered = (issues || []).filter((i) => !i.pull_request).slice(0, limit);
    if (!filtered.length)
     return JSON.stringify({ message: `No ${issueState} issues in ${spec}.` });
    const lines = filtered.map((i) => {
     const labels = i.labels?.map((l) => l.name).join(", ") || "";
     const author = i.user?.login || "";
     let line = `#${i.number} [${i.state.toUpperCase()}] ${i.title.substring(0, 80)}`;
     if (author)
      line += ` (by @${author})`;
     if (labels)
      line += ` [${labels}]`;
     return line;
    });
    return JSON.stringify({ issues: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getIssueTool = {
  name: "get-issue",
  description: "Get detailed information about a specific issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const i = await ghGet(`/repos/${spec}/issues/${number}`);
    const labels = i.labels?.map((l) => l.name) || [];
    const assignees = i.assignees?.map((a) => a.login) || [];
    const milestone = i.milestone?.title || "";
    const lines = [
     `Issue #${i.number}: ${i.title}`,
     `State: ${i.state}`,
     i.user ? `Author: @${i.user.login}` : "",
     labels.length ? `Labels: ${labels.join(", ")}` : "",
     assignees.length ? `Assignees: ${assignees.map((a) => "@" + a).join(", ")}` : "",
     milestone ? `Milestone: ${milestone}` : "",
     `Comments: ${i.comments}`,
     `Created: ${i.created_at}`,
     `Updated: ${i.updated_at}`,
     "",
     truncate(i.body || "(no description)", 3e3)
    ].filter((l) => l || l === "");
    return JSON.stringify({ info: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createIssueTool = {
  name: "create-issue",
  description: "Create a new issue in a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    title: { type: "string", description: "Issue title" },
    body: { type: "string", description: "Issue body (Markdown supported)" },
    labels: { type: "array", items: { type: "string" }, description: "Labels to apply" },
    assignees: { type: "array", items: { type: "string" }, description: "Usernames to assign" }
   },
   required: ["owner", "repo", "title"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const title = reqString(args, "title");
    const body = optString(args, "body");
    const labels = optStringList(args, "labels");
    const assignees = optStringList(args, "assignees");
    const payload = { title };
    if (body)
     payload.body = body;
    if (labels.length)
     payload.labels = labels;
    if (assignees.length)
     payload.assignees = assignees;
    const r = await ghPost(`/repos/${spec}/issues`, payload);
    return JSON.stringify({ message: `Issue created: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var closeIssueTool = {
  name: "close-issue",
  description: "Close an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    reason: {
     type: "string",
     description: "Reason for closing",
     enum: ["completed", "not_planned"]
    }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const reason = optString(args, "reason");
    const payload = { state: "closed" };
    if (reason)
     payload.state_reason = reason;
    await ghPatch(`/repos/${spec}/issues/${number}`, payload);
    return JSON.stringify({ message: `Issue #${number} closed.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var reopenIssueTool = {
  name: "reopen-issue",
  description: "Reopen a closed issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    await ghPatch(`/repos/${spec}/issues/${number}`, { state: "open" });
    return JSON.stringify({ message: `Issue #${number} reopened.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var editIssueTool = {
  name: "edit-issue",
  description: "Edit an existing issue's title or body",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    title: { type: "string", description: "New issue title" },
    body: { type: "string", description: "New issue body" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const title = optString(args, "title");
    const body = optString(args, "body");
    if (!title && !body)
     return JSON.stringify({ error: "Provide at least one field to edit (title or body)." });
    const payload = {};
    if (title)
     payload.title = title;
    if (body)
     payload.body = body;
    await ghPatch(`/repos/${spec}/issues/${number}`, payload);
    return JSON.stringify({ message: `Issue #${number} updated.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var commentOnIssueTool = {
  name: "comment-on-issue",
  description: "Add a comment to an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    body: { type: "string", description: "Comment body (Markdown supported)" }
   },
   required: ["owner", "repo", "number", "body"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const body = reqString(args, "body");
    const r = await ghPost(`/repos/${spec}/issues/${number}/comments`, { body });
    return JSON.stringify({ message: `Comment added to issue #${number}: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listIssueCommentsTool = {
  name: "list-issue-comments",
  description: "List comments on an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    limit: { type: "number", description: "Maximum number of comments to return" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const limit = optNumber(args, "limit", 30);
    const comments = await ghGet(`/repos/${spec}/issues/${number}/comments?per_page=${limit}`);
    if (!comments || comments.length === 0)
     return JSON.stringify({ message: `No comments on issue #${number}.` });
    const lines = comments.map((c) => {
     const author = c.user?.login || "unknown";
     const bodyText = (c.body || "").substring(0, 200);
     return `@${author} (${c.created_at}):
${bodyText}
`;
    });
    return JSON.stringify({ comments: truncate(lines.join("\n")) });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var addIssueLabelsTool = {
  name: "add-issue-labels",
  description: "Add labels to an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    labels: { type: "array", items: { type: "string" }, description: "Labels to add" }
   },
   required: ["owner", "repo", "number", "labels"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const labels = optStringList(args, "labels");
    if (!labels.length)
     return JSON.stringify({ error: "At least one label is required." });
    await ghPost(`/repos/${spec}/issues/${number}/labels`, { labels });
    return JSON.stringify({ message: `Labels added to issue #${number}: ${labels.join(", ")}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var removeIssueLabelsTool = {
  name: "remove-issue-labels",
  description: "Remove labels from an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    labels: { type: "array", items: { type: "string" }, description: "Labels to remove" }
   },
   required: ["owner", "repo", "number", "labels"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const labels = optStringList(args, "labels");
    if (!labels.length)
     return JSON.stringify({ error: "At least one label is required." });
    for (const label of labels) {
     await ghDelete(`/repos/${spec}/issues/${number}/labels/${encodeURIComponent(label)}`);
    }
    return JSON.stringify({
     message: `Labels removed from issue #${number}: ${labels.join(", ")}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var addIssueAssigneesTool = {
  name: "add-issue-assignees",
  description: "Add assignees to an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    assignees: { type: "array", items: { type: "string" }, description: "Usernames to assign" }
   },
   required: ["owner", "repo", "number", "assignees"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const assignees = optStringList(args, "assignees");
    if (!assignees.length)
     return JSON.stringify({ error: "At least one assignee is required." });
    await ghPost(`/repos/${spec}/issues/${number}/assignees`, { assignees });
    return JSON.stringify({
     message: `Assignees added to issue #${number}: ${assignees.join(", ")}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var removeIssueAssigneesTool = {
  name: "remove-issue-assignees",
  description: "Remove assignees from an issue",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Issue number" },
    assignees: { type: "array", items: { type: "string" }, description: "Usernames to remove" }
   },
   required: ["owner", "repo", "number", "assignees"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const assignees = optStringList(args, "assignees");
    if (!assignees.length)
     return JSON.stringify({ error: "At least one assignee is required." });
    await ghDelete(`/repos/${spec}/issues/${number}/assignees`);
    return JSON.stringify({
     message: `Assignees removed from issue #${number}: ${assignees.join(", ")}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var issueTools = [
  listIssuesTool,
  getIssueTool,
  createIssueTool,
  closeIssueTool,
  reopenIssueTool,
  editIssueTool,
  commentOnIssueTool,
  listIssueCommentsTool,
  addIssueLabelsTool,
  removeIssueLabelsTool,
  addIssueAssigneesTool,
  removeIssueAssigneesTool
 ];

 // skills-ts-out/github/tools/pr.js
 var listPrsTool = {
  name: "list-prs",
  description: "List pull requests in a repository with optional filters",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    limit: { type: "number", description: "Maximum number of pull requests to return" },
    state: { type: "string", description: "Filter by state", enum: ["open", "closed", "all"] },
    base: { type: "string", description: "Filter by base branch name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const limit = optNumber(args, "limit", 30);
    const prState = optString(args, "state") || "open";
    const base = optString(args, "base");
    let endpoint = `/repos/${spec}/pulls?state=${prState}&per_page=${limit}`;
    if (base)
     endpoint += `&base=${encodeURIComponent(base)}`;
    const pulls = await ghGet(endpoint);
    if (!pulls || pulls.length === 0)
     return JSON.stringify({ message: `No ${prState} pull requests in ${spec}.` });
    const lines = pulls.slice(0, limit).map((p) => {
     const author = p.user?.login || "";
     const draft = p.draft ? " [draft]" : "";
     const labels = p.labels?.map((l) => l.name).join(", ") || "";
     let line = `#${p.number} [${p.state.toUpperCase()}] ${p.title.substring(0, 80)}`;
     if (author)
      line += ` (by @${author})`;
     line += ` (${p.head?.ref} -> ${p.base?.ref})`;
     line += draft;
     if (labels)
      line += ` [${labels}]`;
     return line;
    });
    return JSON.stringify({ prs: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getPrTool = {
  name: "get-pr",
  description: "Get detailed information about a specific pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const pr = await ghGet(`/repos/${spec}/pulls/${number}`);
    const labels = pr.labels?.map((l) => l.name) || [];
    const assignees = pr.assignees?.map((a) => a.login) || [];
    const lines = [
     `PR #${pr.number}: ${pr.title}`,
     `State: ${pr.state}${pr.draft ? " [draft]" : ""}`,
     pr.user ? `Author: @${pr.user.login}` : "",
     `Branch: ${pr.head?.ref} -> ${pr.base?.ref}`,
     `Changes: +${pr.additions} -${pr.deletions} (${pr.changed_files} files)`,
     `Mergeable: ${pr.mergeable}`,
     labels.length ? `Labels: ${labels.join(", ")}` : "",
     assignees.length ? `Assignees: ${assignees.map((a) => "@" + a).join(", ")}` : "",
     `Comments: ${pr.comments}`,
     `Review Comments: ${pr.review_comments}`,
     `Created: ${pr.created_at}`,
     `Updated: ${pr.updated_at}`,
     pr.merged_at ? `Merged: ${pr.merged_at}` : "",
     "",
     truncate(pr.body || "(no description)", 3e3)
    ].filter((l) => l || l === "");
    return JSON.stringify({ info: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createPrTool = {
  name: "create-pr",
  description: "Create a new pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    title: { type: "string", description: "Pull request title" },
    head: {
     type: "string",
     description: "The branch containing the changes (e.g. 'feature-branch' or 'user:feature-branch')"
    },
    base: {
     type: "string",
     description: "The branch to merge into (defaults to repo default branch)"
    },
    body: { type: "string", description: "Pull request body (Markdown supported)" },
    draft: { type: "boolean", description: "Create as a draft pull request" }
   },
   required: ["owner", "repo", "title", "head"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const title = reqString(args, "title");
    const head = reqString(args, "head");
    const base = optString(args, "base") || "main";
    const body = optString(args, "body");
    const draft = optBoolean(args, "draft", false);
    const payload = { title, head, base, draft };
    if (body)
     payload.body = body;
    const r = await ghPost(`/repos/${spec}/pulls`, payload);
    return JSON.stringify({ message: `PR created: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var closePrTool = {
  name: "close-pr",
  description: "Close a pull request without merging",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    await ghPatch(`/repos/${spec}/pulls/${number}`, { state: "closed" });
    return JSON.stringify({ message: `PR #${number} closed.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var reopenPrTool = {
  name: "reopen-pr",
  description: "Reopen a closed pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    await ghPatch(`/repos/${spec}/pulls/${number}`, { state: "open" });
    return JSON.stringify({ message: `PR #${number} reopened.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var mergePrTool = {
  name: "merge-pr",
  description: "Merge a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    method: {
     type: "string",
     description: "Merge method to use",
     enum: ["merge", "squash", "rebase"]
    },
    delete_branch: { type: "boolean", description: "Delete the head branch after merging" },
    commit_message: { type: "string", description: "Custom merge commit message" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const method = optString(args, "method") || "merge";
    const deleteBranch = optBoolean(args, "delete_branch", false);
    const commitMessage = optString(args, "commit_message");
    const payload = { merge_method: method };
    if (commitMessage)
     payload.commit_message = commitMessage;
    await ghPut(`/repos/${spec}/pulls/${number}/merge`, payload);
    let msg = `PR #${number} merged via ${method}.`;
    if (deleteBranch) {
     try {
      const pr = await ghGet(`/repos/${spec}/pulls/${number}`);
      await ghDelete(`/repos/${spec}/git/refs/heads/${pr.head.ref}`);
      msg += ` Branch '${pr.head.ref}' deleted.`;
     } catch {
      msg += " (could not delete branch)";
     }
    }
    return JSON.stringify({ message: msg });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var editPrTool = {
  name: "edit-pr",
  description: "Edit a pull request's title, body, or base branch",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    title: { type: "string", description: "New pull request title" },
    body: { type: "string", description: "New pull request body" },
    base: { type: "string", description: "New base branch" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const title = optString(args, "title");
    const body = optString(args, "body");
    const base = optString(args, "base");
    if (!title && !body && !base)
     return JSON.stringify({ error: "Provide at least one field to edit." });
    const payload = {};
    if (title)
     payload.title = title;
    if (body)
     payload.body = body;
    if (base)
     payload.base = base;
    await ghPatch(`/repos/${spec}/pulls/${number}`, payload);
    return JSON.stringify({ message: `PR #${number} updated.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var commentOnPrTool = {
  name: "comment-on-pr",
  description: "Add a comment to a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    body: { type: "string", description: "Comment body (Markdown supported)" }
   },
   required: ["owner", "repo", "number", "body"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const body = reqString(args, "body");
    const r = await ghPost(`/repos/${spec}/issues/${number}/comments`, { body });
    return JSON.stringify({ message: `Comment added to PR #${number}: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listPrCommentsTool = {
  name: "list-pr-comments",
  description: "List comments on a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    limit: { type: "number", description: "Maximum number of comments to return" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const limit = optNumber(args, "limit", 30);
    const comments = await ghGet(`/repos/${spec}/issues/${number}/comments?per_page=${limit}`);
    if (!comments || comments.length === 0)
     return JSON.stringify({ message: `No comments on PR #${number}.` });
    const lines = comments.map((c) => {
     const author = c.user?.login || "unknown";
     const bodyText = (c.body || "").substring(0, 200);
     return `@${author} (${c.created_at}):
${bodyText}
`;
    });
    return JSON.stringify({ comments: truncate(lines.join("\n")) });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listPrReviewsTool = {
  name: "list-pr-reviews",
  description: "List reviews on a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const reviews = await ghGet(`/repos/${spec}/pulls/${number}/reviews`);
    if (!reviews || reviews.length === 0)
     return JSON.stringify({ message: `No reviews on PR #${number}.` });
    const lines = reviews.map((r) => {
     const user = r.user?.login || "unknown";
     const reviewState = r.state || "";
     const body = (r.body || "").substring(0, 150);
     return `@${user}: ${reviewState}${body ? ` - ${body}` : ""}`;
    });
    return JSON.stringify({ reviews: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createPrReviewTool = {
  name: "create-pr-review",
  description: "Submit a review on a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    event: {
     type: "string",
     description: "Review action to perform",
     enum: ["APPROVE", "REQUEST_CHANGES", "COMMENT"]
    },
    body: { type: "string", description: "Review comment body" }
   },
   required: ["owner", "repo", "number", "event"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const event = reqString(args, "event").toUpperCase();
    const body = optString(args, "body") || "";
    await ghPost(`/repos/${spec}/pulls/${number}/reviews`, { body, event });
    return JSON.stringify({ message: `Review (${event}) submitted on PR #${number}.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listPrFilesTool = {
  name: "list-pr-files",
  description: "List files changed in a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const files = await ghGet(`/repos/${spec}/pulls/${number}/files?per_page=100`);
    if (!files || files.length === 0)
     return JSON.stringify({ message: `No files changed in PR #${number}.` });
    const lines = files.map((f) => {
     const status = (f.status || "").padEnd(12);
     return `${status} +${f.additions} -${f.deletions}  ${f.filename}`;
    });
    return JSON.stringify({ files: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getPrDiffTool = {
  name: "get-pr-diff",
  description: "Get the unified diff for a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const files = await ghGet(`/repos/${spec}/pulls/${number}/files?per_page=50`);
    if (!files || files.length === 0)
     return JSON.stringify({ diff: "(empty diff)" });
    const lines = [];
    for (const f of files) {
     lines.push(`--- ${f.filename} (${f.status})`);
     if (f.patch)
      lines.push(f.patch.substring(0, 2e3));
     lines.push("");
    }
    return JSON.stringify({ diff: truncate(lines.join("\n")) });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getPrChecksTool = {
  name: "get-pr-checks",
  description: "Get CI/CD check runs and status for a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const pr = await ghGet(`/repos/${spec}/pulls/${number}`);
    const sha = pr.head?.sha;
    if (!sha)
     return JSON.stringify({ message: "No commits found on this PR." });
    const checks = await ghGet(`/repos/${spec}/commits/${sha}/check-runs`);
    const runs = checks.check_runs || [];
    if (!runs.length)
     return JSON.stringify({ message: `No checks on PR #${number}.` });
    const lines = runs.map((c) => {
     const conclusion = (c.conclusion || c.status || "pending").padEnd(12);
     return `${conclusion} ${c.name}`;
    });
    return JSON.stringify({ checks: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var requestPrReviewersTool = {
  name: "request-pr-reviewers",
  description: "Request reviews from specific users on a pull request",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" },
    reviewers: {
     type: "array",
     items: { type: "string" },
     description: "Usernames to request review from"
    }
   },
   required: ["owner", "repo", "number", "reviewers"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const reviewers = optStringList(args, "reviewers");
    if (!reviewers.length)
     return JSON.stringify({ error: "At least one reviewer is required." });
    await ghPost(`/repos/${spec}/pulls/${number}/requested_reviewers`, { reviewers });
    return JSON.stringify({ message: `Review requested from: ${reviewers.join(", ")}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var markPrReadyTool = {
  name: "mark-pr-ready",
  description: "Mark a draft pull request as ready for review",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    number: { type: "number", description: "Pull request number" }
   },
   required: ["owner", "repo", "number"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const number = validatePositiveInt(args.number, "number");
    const pr = await ghGet(`/repos/${spec}/pulls/${number}`);
    if (!pr.draft)
     return JSON.stringify({ message: `PR #${number} is already marked as ready.` });
    await ghPut(`/repos/${spec}/pulls/${number}`, { draft: false });
    return JSON.stringify({ message: `PR #${number} marked as ready for review.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var prTools = [
  listPrsTool,
  getPrTool,
  createPrTool,
  closePrTool,
  reopenPrTool,
  mergePrTool,
  editPrTool,
  commentOnPrTool,
  listPrCommentsTool,
  listPrReviewsTool,
  createPrReviewTool,
  listPrFilesTool,
  getPrDiffTool,
  getPrChecksTool,
  requestPrReviewersTool,
  markPrReadyTool
 ];

 // skills-ts-out/github/tools/search.js
 var searchReposTool = {
  name: "search-repos",
  description: "Search GitHub repositories by query",
  input_schema: {
   type: "object",
   properties: {
    query: { type: "string", description: "Search query (supports GitHub search syntax)" },
    limit: { type: "number", description: "Maximum number of results to return" },
    sort: {
     type: "string",
     description: "Sort field",
     enum: ["stars", "forks", "help-wanted-issues", "updated"]
    },
    order: { type: "string", description: "Sort order", enum: ["asc", "desc"] }
   },
   required: ["query"]
  },
  async execute(args) {
   try {
    const query = reqString(args, "query");
    const limit = optNumber(args, "limit", 20);
    const sort = optString(args, "sort") || "stars";
    const order = optString(args, "order") || "desc";
    const r = await ghGet(`/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${limit}`);
    const items = r.items ?? [];
    if (!items.length)
     return JSON.stringify({ message: `No repos found for: ${query}` });
    const lines = items.map((repo) => {
     const vis = repo.private ? "private" : "public";
     const desc = (repo.description || "").substring(0, 80);
     const lang = repo.language || "";
     let line = `${repo.full_name} [${vis}] (${repo.stargazers_count} stars)`;
     if (lang)
      line += ` [${lang}]`;
     if (desc)
      line += ` - ${desc}`;
     return line;
    });
    return JSON.stringify({ results: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var searchIssuesTool = {
  name: "search-issues",
  description: "Search issues and pull requests across GitHub",
  input_schema: {
   type: "object",
   properties: {
    query: {
     type: "string",
     description: "Search query (supports GitHub search syntax, e.g. 'is:issue is:open label:bug')"
    },
    limit: { type: "number", description: "Maximum number of results to return" },
    sort: {
     type: "string",
     description: "Sort field",
     enum: ["comments", "reactions", "created", "updated"]
    }
   },
   required: ["query"]
  },
  async execute(args) {
   try {
    const query = reqString(args, "query");
    const limit = optNumber(args, "limit", 20);
    const sort = optString(args, "sort") || "created";
    const r = await ghGet(`/search/issues?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`);
    const items = r.items ?? [];
    if (!items.length)
     return JSON.stringify({ message: `No issues found for: ${query}` });
    const lines = items.map((i) => {
     const repoName = i.repository_url?.split("/").slice(-2).join("/") || "";
     const author = i.user?.login || "";
     const prefix = repoName ? `[${repoName}] ` : "";
     const number = i.number ?? 0;
     const state2 = (i.state ?? "").toUpperCase();
     const title = (i.title ?? "").substring(0, 80);
     let line = `${prefix}#${number} [${state2}] ${title}`;
     if (author)
      line += ` (by @${author})`;
     return line;
    });
    return JSON.stringify({ results: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var searchCodeTool = {
  name: "search-code",
  description: "Search code across GitHub repositories",
  input_schema: {
   type: "object",
   properties: {
    query: { type: "string", description: "Search query (supports GitHub code search syntax)" },
    limit: { type: "number", description: "Maximum number of results to return" },
    repo: {
     type: "string",
     description: "Restrict search to a specific repo (owner/name format)"
    },
    language: { type: "string", description: "Filter by programming language" }
   },
   required: ["query"]
  },
  async execute(args) {
   try {
    let query = reqString(args, "query");
    const limit = optNumber(args, "limit", 20);
    const repo = optString(args, "repo");
    const language = optString(args, "language");
    if (repo)
     query += ` repo:${repo}`;
    if (language)
     query += ` language:${language}`;
    const r = await ghGet(`/search/code?q=${encodeURIComponent(query)}&per_page=${limit}`);
    const items = r.items ?? [];
    if (!items.length)
     return JSON.stringify({ message: `No code matches for: ${query}` });
    const lines = items.map((c) => {
     const repoName = c.repository?.full_name || "";
     return `[${repoName}] ${c.path ?? ""}`;
    });
    return JSON.stringify({ results: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var searchCommitsTool = {
  name: "search-commits",
  description: "Search commits across GitHub repositories",
  input_schema: {
   type: "object",
   properties: {
    query: { type: "string", description: "Search query (supports GitHub commit search syntax)" },
    limit: { type: "number", description: "Maximum number of results to return" },
    repo: {
     type: "string",
     description: "Restrict search to a specific repo (owner/name format)"
    }
   },
   required: ["query"]
  },
  async execute(args) {
   try {
    let query = reqString(args, "query");
    const limit = optNumber(args, "limit", 20);
    const repo = optString(args, "repo");
    if (repo)
     query += ` repo:${repo}`;
    const r = await ghGet(`/search/commits?q=${encodeURIComponent(query)}&per_page=${limit}`);
    const items = r.items ?? [];
    if (!items.length)
     return JSON.stringify({ message: `No commits found for: ${query}` });
    const lines = items.map((c) => {
     const sha = c.sha?.substring(0, 7) || "?";
     const msg = (c.commit?.message || "").split("\n")[0].substring(0, 80);
     const author = c.commit?.author?.name || "";
     const repoName = c.repository?.full_name || "";
     const prefix = repoName ? `[${repoName}] ` : "";
     return `${prefix}${sha} ${msg}${author ? ` (by ${author})` : ""}`;
    });
    return JSON.stringify({ results: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var searchTools = [
  searchReposTool,
  searchIssuesTool,
  searchCodeTool,
  searchCommitsTool
 ];

 // skills-ts-out/github/tools/code.js
 var viewFileTool = {
  name: "view-file",
  description: "View the contents of a file in a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    path: { type: "string", description: "File path within the repository" },
    ref: {
     type: "string",
     description: "Git ref (branch, tag, or commit SHA). Defaults to the default branch"
    }
   },
   required: ["owner", "repo", "path"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const path = reqString(args, "path");
    const ref = optString(args, "ref");
    let endpoint = `/repos/${spec}/contents/${encodeURIComponent(path)}`;
    if (ref)
     endpoint += `?ref=${encodeURIComponent(ref)}`;
    const r = await ghGet(endpoint);
    if (Array.isArray(r)) {
     return JSON.stringify({
      message: `${path} is a directory, not a file. Use list-directory instead.`
     });
    }
    if (r.encoding === "base64" && r.content) {
     const decoded = decodeBase64(r.content);
     return JSON.stringify({ content: truncate(decoded) });
    }
    return JSON.stringify({ content: "(binary or empty file)" });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listDirectoryTool = {
  name: "list-directory",
  description: "List the contents of a directory in a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    path: {
     type: "string",
     description: "Directory path within the repository. Defaults to the root"
    },
    ref: {
     type: "string",
     description: "Git ref (branch, tag, or commit SHA). Defaults to the default branch"
    }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const path = optString(args, "path") || "";
    const ref = optString(args, "ref");
    let endpoint = `/repos/${spec}/contents/${encodeURIComponent(path || "/")}`;
    if (ref)
     endpoint += `?ref=${encodeURIComponent(ref)}`;
    const r = await ghGet(endpoint);
    if (!Array.isArray(r))
     return JSON.stringify({ message: `${path} is a file, not a directory.` });
    const entries = r;
    const sorted = entries.sort((a, b) => {
     if (a.type === "dir" && b.type !== "dir")
      return -1;
     if (a.type !== "dir" && b.type === "dir")
      return 1;
     return (a.name ?? "").localeCompare(b.name ?? "");
    });
    const lines = sorted.map((entry) => {
     const indicator = entry.type === "dir" ? "/" : "";
     const sizeStr = entry.type === "file" && entry.size !== void 0 ? ` (${entry.size} bytes)` : "";
     const type = entry.type ?? "";
     const name = entry.name ?? "";
     return `${type.padEnd(4)} ${name}${indicator}${sizeStr}`;
    });
    return JSON.stringify({ directory: lines.join("\n") || "Empty directory." });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getReadmeTool = {
  name: "get-readme",
  description: "Get the README file for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}/readme`);
    if (r.encoding === "base64" && r.content) {
     const decoded = decodeBase64(r.content);
     return JSON.stringify({ content: truncate(decoded) });
    }
    return JSON.stringify({ content: "(empty README)" });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 function decodeBase64(encoded) {
  const cleaned = encoded.replace(/\n/g, "");
  try {
   return atob(cleaned);
  } catch {
   return "(unable to decode content)";
  }
 }
 var codeTools = [viewFileTool, listDirectoryTool, getReadmeTool];

 // skills-ts-out/github/tools/release.js
 var listReleasesTool = {
  name: "list-releases",
  description: "List releases for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    limit: { type: "number", description: "Maximum number of releases to return" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const limit = optNumber(args, "limit", 10);
    const releases = await ghGet(`/repos/${spec}/releases?per_page=${limit}`);
    if (!releases || releases.length === 0)
     return JSON.stringify({ message: `No releases in ${spec}.` });
    const lines = releases.map((r) => {
     const tag = r.tag_name ?? "?";
     const name = r.name ?? tag;
     const flags = [];
     if (r.draft)
      flags.push("draft");
     if (r.prerelease)
      flags.push("pre-release");
     const flagStr = flags.length ? ` [${flags.join(", ")}]` : "";
     const date = r.published_at || r.created_at || "";
     return `${tag} - ${name}${flagStr} (${date})`;
    });
    return JSON.stringify({ releases: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getReleaseTool = {
  name: "get-release",
  description: "Get a specific release by tag name",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    tag: { type: "string", description: "Release tag name (e.g. 'v1.0.0')" }
   },
   required: ["owner", "repo", "tag"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const tag = reqString(args, "tag");
    const r = await ghGet(`/repos/${spec}/releases/tags/${encodeURIComponent(tag)}`);
    const author = r.author?.login || "";
    const assets = r.assets || [];
    const assetLines = assets.map((a) => `  - ${a.name ?? "(asset)"} (${a.size ?? 0} bytes, ${a.download_count ?? 0} downloads)`);
    const lines = [
     `Release: ${r.name || r.tag_name}`,
     `Tag: ${r.tag_name}`,
     author ? `Author: @${author}` : "",
     `Draft: ${r.draft}`,
     `Pre-release: ${r.prerelease}`,
     `Published: ${r.published_at || ""}`
    ];
    if (assetLines.length) {
     lines.push(`Assets (${assetLines.length}):`);
     lines.push(...assetLines);
    }
    lines.push("");
    lines.push(truncate(r.body || "(no release notes)", 3e3));
    return JSON.stringify({ info: lines.filter((l) => l || l === "").join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createReleaseTool = {
  name: "create-release",
  description: "Create a new release for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    tag: { type: "string", description: "Tag name for the release (e.g. 'v1.0.0')" },
    title: { type: "string", description: "Release title" },
    notes: { type: "string", description: "Release notes body (Markdown supported)" },
    draft: { type: "boolean", description: "Create as a draft release" },
    prerelease: { type: "boolean", description: "Mark as a pre-release" },
    target: {
     type: "string",
     description: "Target commitish (branch or commit SHA) for the tag"
    },
    generate_notes: { type: "boolean", description: "Auto-generate release notes from commits" }
   },
   required: ["owner", "repo", "tag"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const tag = reqString(args, "tag");
    const title = optString(args, "title") || tag;
    const notes = optString(args, "notes") || "";
    const draft = optBoolean(args, "draft", false);
    const prerelease = optBoolean(args, "prerelease", false);
    const target = optString(args, "target");
    const generateNotes = optBoolean(args, "generate_notes", false);
    const payload = {
     tag_name: tag,
     name: title,
     body: notes,
     draft,
     prerelease,
     generate_release_notes: generateNotes
    };
    if (target)
     payload.target_commitish = target;
    const r = await ghPost(`/repos/${spec}/releases`, payload);
    return JSON.stringify({ message: `Release created: ${r.html_url ?? ""}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var deleteReleaseTool = {
  name: "delete-release",
  description: "Delete a release by tag name",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    tag: { type: "string", description: "Release tag name to delete" },
    cleanup_tag: { type: "boolean", description: "Also delete the associated git tag" }
   },
   required: ["owner", "repo", "tag"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const tag = reqString(args, "tag");
    const cleanupTag = optBoolean(args, "cleanup_tag", false);
    const r = await ghGet(`/repos/${spec}/releases/tags/${encodeURIComponent(tag)}`);
    await ghDelete(`/repos/${spec}/releases/${r.id}`);
    let msg = `Release ${tag} deleted.`;
    if (cleanupTag) {
     try {
      await ghDelete(`/repos/${spec}/git/refs/tags/${encodeURIComponent(tag)}`);
      msg += ` Tag ${tag} also deleted.`;
     } catch {
      msg += ` (could not delete tag ${tag})`;
     }
    }
    return JSON.stringify({ message: msg });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listReleaseAssetsTool = {
  name: "list-release-assets",
  description: "List assets (downloadable files) attached to a release",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    tag: { type: "string", description: "Release tag name" }
   },
   required: ["owner", "repo", "tag"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const tag = reqString(args, "tag");
    const r = await ghGet(`/repos/${spec}/releases/tags/${encodeURIComponent(tag)}`);
    const assets = r.assets || [];
    if (!assets.length)
     return JSON.stringify({ message: `No assets for release ${tag}.` });
    const lines = assets.map((a) => `${a.name ?? "(asset)"} (${a.size ?? 0} bytes, ${a.download_count ?? 0} downloads)`);
    return JSON.stringify({ assets: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getLatestReleaseTool = {
  name: "get-latest-release",
  description: "Get the latest published release for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}/releases/latest`);
    const author = r.author?.login || "";
    const lines = [
     `Latest Release: ${r.name || r.tag_name}`,
     `Tag: ${r.tag_name}`,
     author ? `Author: @${author}` : "",
     `Published: ${r.published_at || ""}`,
     "",
     truncate(r.body || "(no release notes)", 2e3)
    ].filter((l) => l || l === "");
    return JSON.stringify({ info: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var releaseTools = [
  listReleasesTool,
  getReleaseTool,
  createReleaseTool,
  deleteReleaseTool,
  listReleaseAssetsTool,
  getLatestReleaseTool
 ];

 // skills-ts-out/github/tools/gist.js
 var listGistsTool = {
  name: "list-gists",
  description: "List gists for the authenticated user or a specific user",
  input_schema: {
   type: "object",
   properties: {
    limit: { type: "number", description: "Maximum number of gists to return" },
    username: {
     type: "string",
     description: "GitHub username. Defaults to the authenticated user"
    }
   },
   required: []
  },
  async execute(args) {
   try {
    const limit = optNumber(args, "limit", 20);
    const username = optString(args, "username");
    const endpoint = username ? `/users/${encodeURIComponent(username)}/gists?per_page=${limit}` : `/gists?per_page=${limit}`;
    const gists = await ghGet(endpoint);
    if (!gists || gists.length === 0)
     return JSON.stringify({ message: "No gists found." });
    const lines = gists.map((g) => {
     const files = Object.keys(g.files || {});
     let fileStr = files.slice(0, 3).join(", ");
     if (files.length > 3)
      fileStr += ` (+${files.length - 3} more)`;
     const pub = g.public ? "public" : "private";
     const desc = (g.description || "").substring(0, 60);
     return `${g.id} [${pub}] ${fileStr}${desc ? ` - ${desc}` : ""}`;
    });
    return JSON.stringify({ gists: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getGistTool = {
  name: "get-gist",
  description: "Get a specific gist by ID, including its files and content",
  input_schema: {
   type: "object",
   properties: { gist_id: { type: "string", description: "The gist ID" } },
   required: ["gist_id"]
  },
  async execute(args) {
   try {
    const gistId = reqString(args, "gist_id");
    const g = await ghGet(`/gists/${gistId}`);
    const owner = g.owner?.login || "";
    const files = Object.keys(g.files || {});
    const pub = g.public ? "public" : "private";
    const lines = [
     `Gist: ${g.id}`,
     `URL: ${g.html_url}`,
     owner ? `Owner: @${owner}` : "",
     `Visibility: ${pub}`,
     `Description: ${g.description || "N/A"}`,
     `Files: ${files.join(", ")}`,
     `Comments: ${g.comments}`,
     `Created: ${g.created_at}`,
     `Updated: ${g.updated_at}`
    ];
    for (const [fname, fobj] of Object.entries(g.files || {})) {
     const f = fobj;
     const content = f.content || "";
     lines.push(`
--- ${fname} (${f.language || "text"}, ${f.size} bytes) ---`);
     lines.push(truncate(content, 1500));
    }
    return JSON.stringify({ info: lines.filter((l) => l || l === "").join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var createGistTool = {
  name: "create-gist",
  description: "Create a new gist with one or more files",
  input_schema: {
   type: "object",
   properties: {
    files: {
     type: "object",
     description: `Map of filename to file content, e.g. {"hello.py": {"content": "print('hello')"}}`
    },
    description: { type: "string", description: "Gist description" },
    public: { type: "boolean", description: "Whether the gist is public" }
   },
   required: ["files"]
  },
  async execute(args) {
   try {
    const filesArg = args.files;
    if (!filesArg || typeof filesArg !== "object" || !Object.keys(filesArg).length) {
     return JSON.stringify({
      error: "files must be a non-empty object of {filename: {content: string}}."
     });
    }
    const description = optString(args, "description") || "";
    const isPublic = optBoolean(args, "public", false);
    const r = await ghPost("/gists", { files: filesArg, description, public: isPublic });
    return JSON.stringify({ message: `Gist created: ${r.html_url}` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var editGistTool = {
  name: "edit-gist",
  description: "Edit an existing gist's description or files",
  input_schema: {
   type: "object",
   properties: {
    gist_id: { type: "string", description: "The gist ID" },
    description: { type: "string", description: "New gist description" },
    files: {
     type: "object",
     description: "Map of filename to new content. Set content to null to delete a file"
    }
   },
   required: ["gist_id"]
  },
  async execute(args) {
   try {
    const gistId = reqString(args, "gist_id");
    const description = optString(args, "description");
    const filesArg = args.files;
    const payload = {};
    if (description !== null && description !== void 0)
     payload.description = description;
    if (filesArg && typeof filesArg === "object" && Object.keys(filesArg).length) {
     payload.files = filesArg;
    }
    if (!Object.keys(payload).length) {
     return JSON.stringify({ error: "Provide description or files to edit." });
    }
    await ghPatch(`/gists/${gistId}`, payload);
    return JSON.stringify({ message: `Gist ${gistId} updated.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var deleteGistTool = {
  name: "delete-gist",
  description: "Permanently delete a gist",
  input_schema: {
   type: "object",
   properties: { gist_id: { type: "string", description: "The gist ID to delete" } },
   required: ["gist_id"]
  },
  async execute(args) {
   try {
    const gistId = reqString(args, "gist_id");
    await ghDelete(`/gists/${gistId}`);
    return JSON.stringify({ message: `Gist ${gistId} deleted.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var cloneGistTool = {
  name: "clone-gist",
  description: "Get the clone URL for a gist",
  input_schema: {
   type: "object",
   properties: { gist_id: { type: "string", description: "The gist ID to clone" } },
   required: ["gist_id"]
  },
  async execute(args) {
   try {
    const gistId = reqString(args, "gist_id");
    const g = await ghGet(`/gists/${gistId}`);
    return JSON.stringify({
     message: `Clone URL: ${g.git_pull_url}

Run: git clone ${g.git_pull_url}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var gistTools = [
  listGistsTool,
  getGistTool,
  createGistTool,
  editGistTool,
  deleteGistTool,
  cloneGistTool
 ];

 // skills-ts-out/github/tools/actions.js
 var listWorkflowsTool = {
  name: "list-workflows",
  description: "List GitHub Actions workflows defined in a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const r = await ghGet(`/repos/${spec}/actions/workflows`);
    const workflows = r.workflows ?? [];
    if (!workflows.length)
     return JSON.stringify({ message: `No workflows in ${spec}.` });
    const lines = workflows.slice(0, 30).map((w) => {
     const wfState = w.state ?? "";
     return `${w.name ?? "(unnamed)"} (id: ${w.id ?? "?"}) [${wfState}] - ${w.path ?? ""}`;
    });
    return JSON.stringify({ workflows: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listWorkflowRunsTool = {
  name: "list-workflow-runs",
  description: "List recent workflow runs for a repository",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    limit: { type: "number", description: "Maximum number of runs to return" },
    workflow_id: {
     type: "string",
     description: "Filter by workflow ID or filename (e.g. 'ci.yml')"
    },
    branch: { type: "string", description: "Filter by branch name" },
    status: {
     type: "string",
     description: "Filter by status",
     enum: ["queued", "in_progress", "completed", "waiting", "requested"]
    }
   },
   required: ["owner", "repo"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const limit = optNumber(args, "limit", 20);
    const workflowId = optString(args, "workflow_id");
    const branch = optString(args, "branch");
    const status = optString(args, "status");
    let endpoint;
    if (workflowId) {
     endpoint = `/repos/${spec}/actions/workflows/${encodeURIComponent(workflowId)}/runs?per_page=${limit}`;
    } else {
     endpoint = `/repos/${spec}/actions/runs?per_page=${limit}`;
    }
    if (branch)
     endpoint += `&branch=${encodeURIComponent(branch)}`;
    if (status)
     endpoint += `&status=${status}`;
    const r = await ghGet(endpoint);
    const runs = r.workflow_runs ?? [];
    if (!runs.length)
     return JSON.stringify({ message: "No workflow runs found." });
    const lines = runs.slice(0, limit).map((run) => {
     const conclusion = run.conclusion ?? run.status ?? "in_progress";
     const branchName = run.head_branch ?? "";
     return `#${run.run_number ?? "?"} ${run.name ?? "(unnamed)"} [${conclusion}] on ${branchName} (${run.created_at ?? ""})`;
    });
    return JSON.stringify({ runs: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getWorkflowRunTool = {
  name: "get-workflow-run",
  description: "Get detailed information about a specific workflow run",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    run_id: { type: "number", description: "Workflow run ID" }
   },
   required: ["owner", "repo", "run_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const runId = validatePositiveInt(args.run_id, "run_id");
    const run = await ghGet(`/repos/${spec}/actions/runs/${runId}`);
    const lines = [
     `Run #${run.run_number}: ${run.name}`,
     `Status: ${run.status}`,
     `Conclusion: ${run.conclusion || "N/A"}`,
     `Branch: ${run.head_branch}`,
     `Event: ${run.event}`,
     `SHA: ${run.head_sha?.substring(0, 7)}`,
     `URL: ${run.html_url}`,
     `Created: ${run.created_at}`,
     `Updated: ${run.updated_at}`
    ];
    if (run.run_started_at)
     lines.push(`Started: ${run.run_started_at}`);
    return JSON.stringify({ info: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var listRunJobsTool = {
  name: "list-run-jobs",
  description: "List jobs for a specific workflow run",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    run_id: { type: "number", description: "Workflow run ID" }
   },
   required: ["owner", "repo", "run_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const runId = validatePositiveInt(args.run_id, "run_id");
    const r = await ghGet(`/repos/${spec}/actions/runs/${runId}/jobs`);
    const jobs = r.jobs ?? [];
    if (!jobs.length)
     return JSON.stringify({ message: `No jobs in run #${runId}.` });
    const lines = [];
    for (const j of jobs) {
     const conclusion = j.conclusion ?? j.status ?? "in_progress";
     lines.push(`${j.name ?? "(job)"} [${conclusion}]`);
     if (j.steps) {
      for (const s of j.steps) {
       const stepStatus = s.conclusion ?? s.status ?? "?";
       lines.push(`  - ${s.name ?? "(step)"} [${stepStatus}]`);
      }
     }
    }
    return JSON.stringify({ jobs: lines.join("\n") });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var getRunLogsTool = {
  name: "get-run-logs",
  description: "Get the logs URL for a specific workflow run",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    run_id: { type: "number", description: "Workflow run ID" }
   },
   required: ["owner", "repo", "run_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const runId = validatePositiveInt(args.run_id, "run_id");
    const run = await ghGet(`/repos/${spec}/actions/runs/${runId}`);
    const logsUrl = `https://github.com/${spec}/actions/runs/${runId}`;
    return JSON.stringify({
     message: `Run #${run.run_number} (${run.conclusion || run.status})
View logs at: ${logsUrl}`
    });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var rerunWorkflowTool = {
  name: "rerun-workflow",
  description: "Re-run an entire workflow run",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    run_id: { type: "number", description: "Workflow run ID to re-run" }
   },
   required: ["owner", "repo", "run_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const runId = validatePositiveInt(args.run_id, "run_id");
    await ghPost(`/repos/${spec}/actions/runs/${runId}/rerun`);
    return JSON.stringify({ message: `Workflow run #${runId} rerun initiated.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var cancelWorkflowRunTool = {
  name: "cancel-workflow-run",
  description: "Cancel a workflow run that is in progress",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    run_id: { type: "number", description: "Workflow run ID to cancel" }
   },
   required: ["owner", "repo", "run_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const runId = validatePositiveInt(args.run_id, "run_id");
    await ghPost(`/repos/${spec}/actions/runs/${runId}/cancel`);
    return JSON.stringify({ message: `Workflow run #${runId} cancelled.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var triggerWorkflowTool = {
  name: "trigger-workflow",
  description: "Manually trigger a workflow dispatch event",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    workflow_id: { type: "string", description: "Workflow ID or filename (e.g. 'deploy.yml')" },
    ref: { type: "string", description: "Git ref (branch or tag) to run the workflow on" },
    inputs: {
     type: "object",
     description: "Input key-value pairs for the workflow_dispatch event"
    }
   },
   required: ["owner", "repo", "workflow_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const workflowId = reqString(args, "workflow_id");
    const ref = optString(args, "ref") || "main";
    const inputs = args.inputs && typeof args.inputs === "object" ? args.inputs : {};
    await ghPost(`/repos/${spec}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`, { ref, inputs });
    return JSON.stringify({ message: `Workflow '${workflowId}' triggered on ${ref}.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var viewWorkflowYamlTool = {
  name: "view-workflow-yaml",
  description: "View the YAML source of a workflow definition",
  input_schema: {
   type: "object",
   properties: {
    owner: { type: "string", description: "Repository owner" },
    repo: { type: "string", description: "Repository name" },
    workflow_id: { type: "string", description: "Workflow ID or filename (e.g. 'ci.yml')" }
   },
   required: ["owner", "repo", "workflow_id"]
  },
  async execute(args) {
   try {
    const spec = validateRepoSpec(args);
    const workflowId = reqString(args, "workflow_id");
    const wf = await ghGet(`/repos/${spec}/actions/workflows/${encodeURIComponent(workflowId)}`);
    const path = wf.path;
    const content = await ghGet(`/repos/${spec}/contents/${encodeURIComponent(path)}`);
    if (content.encoding === "base64" && content.content) {
     const decoded = atob(content.content.replace(/\n/g, ""));
     return JSON.stringify({ yaml: `--- ${path} ---
${truncate(decoded)}` });
    }
    return JSON.stringify({ yaml: "(empty workflow file)" });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var actionsTools = [
  listWorkflowsTool,
  listWorkflowRunsTool,
  getWorkflowRunTool,
  listRunJobsTool,
  getRunLogsTool,
  rerunWorkflowTool,
  cancelWorkflowRunTool,
  triggerWorkflowTool,
  viewWorkflowYamlTool
 ];

 // skills-ts-out/github/tools/notification.js
 var listNotificationsTool = {
  name: "list-notifications",
  description: "List GitHub notifications for the authenticated user",
  input_schema: {
   type: "object",
   properties: {
    all: { type: "boolean", description: "Include read notifications" },
    limit: { type: "number", description: "Maximum number of notifications to return" }
   },
   required: []
  },
  async execute(args) {
   try {
    const all = optBoolean(args, "all", false);
    const limit = optNumber(args, "limit", 30);
    const notifications = await ghGet(`/notifications?all=${all}&per_page=${limit}`);
    if (!notifications || notifications.length === 0)
     return JSON.stringify({ message: "No notifications." });
    const lines = notifications.map((n) => {
     const reason = n.reason || "";
     const repoName = n.repository?.full_name || "";
     const title = n.subject?.title || "";
     const ntype = n.subject?.type || "";
     const unread = n.unread ? "[unread]" : "[read]";
     return `${unread} [${repoName}] ${ntype}: ${title} (${reason})`;
    });
    return JSON.stringify({ notifications: lines.join("\n"), count: lines.length });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var markNotificationReadTool = {
  name: "mark-notification-read",
  description: "Mark a specific notification thread as read",
  input_schema: {
   type: "object",
   properties: { thread_id: { type: "string", description: "Notification thread ID" } },
   required: ["thread_id"]
  },
  async execute(args) {
   try {
    const threadId = reqString(args, "thread_id");
    await ghPatch(`/notifications/threads/${threadId}`, {});
    return JSON.stringify({ message: `Notification ${threadId} marked as read.` });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var markAllNotificationsReadTool = {
  name: "mark-all-notifications-read",
  description: "Mark all notifications as read",
  input_schema: { type: "object", properties: {}, required: [] },
  async execute(_args) {
   try {
    await ghPut("/notifications", { last_read_at: (/* @__PURE__ */ new Date()).toISOString() });
    return JSON.stringify({ message: "All notifications marked as read." });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var notificationTools = [
  listNotificationsTool,
  markNotificationReadTool,
  markAllNotificationsReadTool
 ];

 // skills-ts-out/github/tools/api.js
 var ghApiTool = {
  name: "gh-api",
  description: "Make a raw GitHub REST API request. Use this for any endpoint not covered by the other tools",
  input_schema: {
   type: "object",
   properties: {
    endpoint: {
     type: "string",
     description: "API endpoint path (e.g. '/repos/owner/repo/branches')"
    },
    method: {
     type: "string",
     description: "HTTP method",
     enum: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    body: { type: "object", description: "Request body (for POST/PUT/PATCH)" }
   },
   required: ["endpoint"]
  },
  async execute(args) {
   try {
    let endpoint = reqString(args, "endpoint");
    const method = (optString(args, "method") || "GET").toUpperCase();
    const body = args.body;
    if (!endpoint.startsWith("/"))
     endpoint = "/" + endpoint;
    const response = await ghFetch(endpoint, {
     method,
     body: body && (method === "POST" || method === "PUT" || method === "PATCH") ? body : void 0
    });
    if (response.data === null)
     return JSON.stringify({ result: "(no content)" });
    return JSON.stringify({ result: truncate(JSON.stringify(response.data, null, 2)) });
   } catch (e) {
    return JSON.stringify({ error: String(e) });
   }
  }
 };
 var apiTools = [ghApiTool];

 // skills-ts-out/github/index.js
 function getSkillState() {
  return globalThis.getGitHubSkillState();
 }
 async function init() {
  console.log("[github] Initializing");
  const s = getSkillState();
  const saved = state.get("config");
  if (saved) {
   s.config.token = saved.token ?? s.config.token;
   s.config.username = saved.username ?? s.config.username;
   s.config.refreshToken = saved.refreshToken ?? s.config.refreshToken;
   s.config.tokenExpiresAt = saved.tokenExpiresAt ?? s.config.tokenExpiresAt;
   s.config.refreshTokenExpiresAt = saved.refreshTokenExpiresAt ?? s.config.refreshTokenExpiresAt;
   s.config.clientId = saved.clientId ?? s.config.clientId;
   s.config.enableRepoTools = saved.enableRepoTools ?? s.config.enableRepoTools;
   s.config.enableIssueTools = saved.enableIssueTools ?? s.config.enableIssueTools;
   s.config.enablePrTools = saved.enablePrTools ?? s.config.enablePrTools;
   s.config.enableSearchTools = saved.enableSearchTools ?? s.config.enableSearchTools;
   s.config.enableCodeTools = saved.enableCodeTools ?? s.config.enableCodeTools;
   s.config.enableReleaseTools = saved.enableReleaseTools ?? s.config.enableReleaseTools;
   s.config.enableGistTools = saved.enableGistTools ?? s.config.enableGistTools;
   s.config.enableWorkflowTools = saved.enableWorkflowTools ?? s.config.enableWorkflowTools;
   s.config.enableNotificationTools = saved.enableNotificationTools ?? s.config.enableNotificationTools;
  }
  if (!s.config.token) {
   const envToken = platform.env("GITHUB_TOKEN");
   if (envToken)
    s.config.token = envToken;
  }
  console.log(`[github] Config loaded \u2014 user: ${s.config.username || "(not authenticated)"}`);
 }
 async function start() {
  const s = getSkillState();
  if (!s.config.token) {
   console.warn("[github] No token configured \u2014 waiting for setup");
   publishState();
   return;
  }
  await globalThis.githubOAuth.ensureValidToken();
  const auth = await checkAuth();
  s.authenticated = auth.authenticated;
  if (auth.authenticated) {
   s.config.username = auth.username;
   console.log(`[github] Authenticated as @${auth.username}`);
  } else {
   console.error("[github] Authentication failed");
  }
  cron.register("github-notifications", "0 */5 * * * *");
  publishState();
 }
 async function stop() {
  console.log("[github] Stopping");
  const s = getSkillState();
  cron.unregister("github-notifications");
  state.set("config", s.config);
 }
 async function onCronTrigger(scheduleId) {
  if (scheduleId === "github-notifications") {
   await checkNotifications();
  }
 }
 async function checkNotifications() {
  const s = getSkillState();
  if (!s.authenticated)
   return;
  try {
   await globalThis.githubOAuth.ensureValidToken();
   const response = await net.fetch("https://api.github.com/notifications?per_page=1", {
    method: "GET",
    headers: { Authorization: `Bearer ${s.config.token}`, Accept: "application/vnd.github+json" },
    timeout: 1e4
   });
   if (response.status === 200) {
    const notifications = JSON.parse(response.body);
    if (notifications.length > 0) {
     console.log("[github] Unread notifications available");
    }
   }
  } catch (e) {
   console.warn(`[github] Notification check failed: ${e}`);
  }
 }
 async function onSetupStart() {
  console.log("[github] onSetupStart");
  const s = getSkillState();
  if (s.config.token) {
   await globalThis.githubOAuth.ensureValidToken();
   const auth = await checkAuth();
   if (auth.authenticated) {
    s.config.username = auth.username;
    s.authenticated = true;
    state.set("config", s.config);
    publishState();
    return {
     step: {
      id: "existing-complete",
      title: "Already Connected",
      description: `Already connected as @${auth.username} via GitHub App.`,
      fields: []
     }
    };
   }
  }
  const clientId = platform.env("GITHUB_APP_CLIENT_ID") ?? "";
  if (!clientId) {
   return {
    step: {
     id: "missing-config",
     title: "GitHub App Not Configured",
     description: "The GITHUB_APP_CLIENT_ID environment variable is not set. Please configure the GitHub App credentials before connecting.",
     fields: []
    }
   };
  }
  try {
   const deviceCode = await globalThis.githubOAuth.requestDeviceCode(clientId);
   console.log(`[github] Device flow started \u2014 user code: ${deviceCode.user_code}, verify at: ${deviceCode.verification_uri}`);
   s.__deviceCode = deviceCode.device_code;
   s.__deviceInterval = deviceCode.interval;
   s.__deviceClientId = clientId;
   s.__deviceExpiresAt = Date.now() + deviceCode.expires_in * 1e3;
   return {
    step: {
     id: "device-code",
     title: "Authorize OpenHuman",
     description: `Open ${deviceCode.verification_uri} in your browser and enter this code:

**${deviceCode.user_code}**

Once you have authorized the app on GitHub, click Continue below.`,
     fields: [
      {
       name: "verification_uri",
       type: "text",
       label: "Verification URL",
       description: "Used by REPL to open in browser (optional)",
       required: false,
       default: deviceCode.verification_uri
      },
      {
       name: "ready",
       type: "boolean",
       label: "I've authorized on GitHub",
       description: "Press Enter after you have entered the code and authorized the app.",
       required: false,
       default: true
      },
      {
       name: "user_code",
       type: "text",
       label: "Your Code (for reference)",
       description: "This is your verification code \u2014 enter it on GitHub",
       required: false,
       default: deviceCode.user_code
      }
     ]
    }
   };
  } catch (e) {
   return {
    step: {
     id: "error",
     title: "Connection Failed",
     description: `Failed to start GitHub App authorization: ${e}`,
     fields: []
    }
   };
  }
 }
 async function onSetupSubmit(args) {
  const { stepId } = args;
  if (stepId === "existing-complete") {
   return { status: "complete" };
  }
  if (stepId === "missing-config" || stepId === "error") {
   return {
    status: "error",
    errors: [
     { field: "", message: "Setup cannot proceed. Fix the configuration and try again." }
    ]
   };
  }
  if (stepId === "device-code") {
   return handleDeviceCodePoll();
  }
  return { status: "error", errors: [{ field: "", message: `Unknown step: ${stepId}` }] };
 }
 async function handleDeviceCodePoll() {
  const s = getSkillState();
  const deviceCode = s.__deviceCode;
  const clientId = s.__deviceClientId;
  const expiresAt = s.__deviceExpiresAt;
  if (!deviceCode || !clientId) {
   return {
    status: "error",
    errors: [{ field: "", message: "Device flow session expired. Please start over." }]
   };
  }
  if (Date.now() >= expiresAt) {
   return {
    status: "error",
    errors: [{ field: "", message: "Authorization code expired. Please start setup again." }]
   };
  }
  const maxAttempts = 12;
  for (let i = 0; i < maxAttempts; i++) {
   try {
    const result = await globalThis.githubOAuth.pollForAccessToken(clientId, deviceCode);
    if ("error" in result && result.error) {
     if (result.error === "authorization_pending") {
      continue;
     }
     if (result.error === "slow_down") {
      continue;
     }
     if (result.error === "expired_token") {
      return {
       status: "error",
       errors: [
        { field: "", message: "Authorization code expired. Please start setup again." }
       ]
      };
     }
     if (result.error === "access_denied") {
      return {
       status: "error",
       errors: [{ field: "", message: "Authorization was denied. Please try again." }]
      };
     }
     return {
      status: "error",
      errors: [
       {
        field: "",
        message: `GitHub error: ${result.error} \u2014 ${result.error_description ?? ""}`
       }
      ]
     };
    }
    if ("access_token" in result && result.access_token) {
     s.config.token = result.access_token;
     const auth = await checkAuth();
     if (!auth.authenticated) {
      return {
       status: "error",
       errors: [{ field: "", message: "Token received but authentication check failed." }]
      };
     }
     globalThis.githubOAuth.storeTokens(clientId, result, auth.username);
     delete s.__deviceCode;
     delete s.__deviceInterval;
     delete s.__deviceClientId;
     delete s.__deviceExpiresAt;
     data.write("config.json", JSON.stringify({ username: auth.username }, null, 2));
     publishState();
     console.log(`[github] Setup complete \u2014 connected as @${auth.username}`);
     return { status: "complete" };
    }
   } catch (e) {
    console.warn(`[github] Poll attempt ${i + 1} failed: ${e}`);
   }
  }
  return {
   status: "error",
   errors: [
    {
     field: "",
     message: "Authorization not yet completed. Please make sure you entered the code at github.com/login/device and approved the app, then try setup again."
    }
   ]
  };
 }
 async function onSetupCancel() {
  console.log("[github] Setup cancelled");
 }
 async function onDisconnect() {
  console.log("[github] Disconnecting");
  const s = getSkillState();
  s.config.token = "";
  s.config.username = "";
  s.config.refreshToken = "";
  s.config.tokenExpiresAt = 0;
  s.config.refreshTokenExpiresAt = 0;
  s.config.clientId = "";
  s.authenticated = false;
  state.set("config", s.config);
  data.write("config.json", "{}");
  publishState();
 }
 async function onListOptions() {
  const s = getSkillState();
  return {
   options: [
    {
     name: "enableRepoTools",
     type: "boolean",
     label: "Repository Management",
     description: "12 tools \u2014 create, delete, fork, clone repos, manage collaborators and topics",
     value: s.config.enableRepoTools
    },
    {
     name: "enableIssueTools",
     type: "boolean",
     label: "Issues",
     description: "12 tools \u2014 create, edit, close, reopen issues, manage labels and assignees",
     value: s.config.enableIssueTools
    },
    {
     name: "enablePrTools",
     type: "boolean",
     label: "Pull Requests",
     description: "16 tools \u2014 create, edit, merge, review PRs, view diffs and checks",
     value: s.config.enablePrTools
    },
    {
     name: "enableSearchTools",
     type: "boolean",
     label: "Search",
     description: "4 tools \u2014 search repos, issues, code, and commits",
     value: s.config.enableSearchTools
    },
    {
     name: "enableCodeTools",
     type: "boolean",
     label: "Code & Files",
     description: "3 tools \u2014 view files, list directories, get README",
     value: s.config.enableCodeTools
    },
    {
     name: "enableReleaseTools",
     type: "boolean",
     label: "Releases",
     description: "6 tools \u2014 create, delete, get, list releases and assets",
     value: s.config.enableReleaseTools
    },
    {
     name: "enableGistTools",
     type: "boolean",
     label: "Gists",
     description: "6 tools \u2014 create, edit, delete, clone, get, and list gists",
     value: s.config.enableGistTools
    },
    {
     name: "enableWorkflowTools",
     type: "boolean",
     label: "Actions & Workflows",
     description: "9 tools \u2014 list, trigger, rerun, cancel workflows and view run logs",
     value: s.config.enableWorkflowTools
    },
    {
     name: "enableNotificationTools",
     type: "boolean",
     label: "Notifications & Raw API",
     description: "4 tools \u2014 list notifications, mark read, and raw API access",
     value: s.config.enableNotificationTools
    }
   ]
  };
 }
 async function onSetOption(args) {
  const { name, value } = args;
  const s = getSkillState();
  const booleanOptions = [
   "enableRepoTools",
   "enableIssueTools",
   "enablePrTools",
   "enableSearchTools",
   "enableCodeTools",
   "enableReleaseTools",
   "enableGistTools",
   "enableWorkflowTools",
   "enableNotificationTools"
  ];
  for (const opt of booleanOptions) {
   if (name === opt) {
    s.config[opt] = !!value;
    break;
   }
  }
  state.set("config", s.config);
  publishState();
  console.log(`[github] Option '${name}' set to ${value}`);
 }
 async function onSessionStart(args) {
  const s = getSkillState();
  s.activeSessions.push(args.sessionId);
  console.log(`[github] Session started: ${args.sessionId}`);
 }
 async function onSessionEnd(args) {
  const s = getSkillState();
  s.activeSessions = s.activeSessions.filter((sid) => sid !== args.sessionId);
  console.log(`[github] Session ended: ${args.sessionId}`);
 }
 function publishState() {
  const s = getSkillState();
  state.setPartial({
   connection_status: s.authenticated ? "connected" : "disconnected",
   auth_status: s.authenticated ? "authenticated" : "not_authenticated",
   username: s.config.username || null,
   is_initialized: true
  });
 }
 var _g = globalThis;
 _g.publishState = publishState;
 _g.checkNotifications = checkNotifications;
 _g.init = init;
 _g.start = start;
 _g.stop = stop;
 _g.onCronTrigger = onCronTrigger;
 _g.onSetupStart = onSetupStart;
 _g.onSetupSubmit = onSetupSubmit;
 _g.onSetupCancel = onSetupCancel;
 _g.onListOptions = onListOptions;
 _g.onSetOption = onSetOption;
 _g.onSessionStart = onSessionStart;
 _g.onSessionEnd = onSessionEnd;
 _g.onDisconnect = onDisconnect;
 function asToolArray(maybeTools) {
  if (!maybeTools)
   return [];
  return Array.isArray(maybeTools) ? maybeTools : [maybeTools];
 }
 var tools = [
  ...asToolArray(repoTools),
  ...asToolArray(issueTools),
  ...asToolArray(prTools),
  ...asToolArray(searchTools),
  ...asToolArray(codeTools),
  ...asToolArray(releaseTools),
  ...asToolArray(gistTools),
  ...asToolArray(actionsTools),
  ...asToolArray(notificationTools),
  ...asToolArray(apiTools)
 ];
 _g.tools = tools;
 var skill = {
  info: {
   id: "github",
   name: "GitHub",
   version: "1.0.0",
   description: "GitHub integration via REST API \u2014 72 tools for repos, issues, PRs, releases, gists, actions, search, notifications, and raw API access.",
   auto_start: true,
   setup: { required: true, label: "Connect GitHub" }
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSetupStart,
  onSetupSubmit,
  onSetupCancel,
  onListOptions,
  onSetOption,
  onSessionStart,
  onSessionEnd,
  onDisconnect
 };
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
