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

 // skills-ts-out/google-drive/index.js
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

 // skills-ts-out/google-drive/api/drive.js
 async function driveFetch(endpoint, options = {}) {
  const cred = oauth.getCredential();
  if (!cred) {
   return {
    success: false,
    error: { code: 401, message: "Google Drive not connected. Complete OAuth setup first." }
   };
  }
  const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  try {
   const response = await oauth.fetch(path, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...options.headers || {} },
    body: options.body,
    timeout: options.timeout || 30
   });
   const s = globalThis.getGoogleDriveSkillState();
   if (response.headers["x-ratelimit-remaining"]) {
    s.rateLimitRemaining = parseInt(response.headers["x-ratelimit-remaining"], 10);
   }
   if (response.headers["x-ratelimit-reset"]) {
    s.rateLimitReset = parseInt(response.headers["x-ratelimit-reset"], 10) * 1e3;
   }
   if (response.status >= 200 && response.status < 300) {
    const data = options.rawBody ? response.body : response.body ? JSON.parse(response.body) : null;
    s.lastApiError = null;
    return { success: true, data };
   }
   const error = response.body ? JSON.parse(response.body) : { code: response.status, message: "API request failed" };
   s.lastApiError = error.message || `HTTP ${response.status}`;
   return { success: false, error: { code: response.status, message: s.lastApiError } };
  } catch (err) {
   const errorMsg = err instanceof Error ? err.message : String(err);
   const s = globalThis.getGoogleDriveSkillState();
   s.lastApiError = errorMsg;
   return { success: false, error: { code: 500, message: errorMsg } };
  }
 }
 globalThis.googleDriveApi = { driveFetch };

 // skills-ts-out/google-drive/state.js
 function initGoogleDriveSkillState() {
  const state2 = {
   config: { credentialId: "", userEmail: "", syncIntervalMinutes: 30 },
   syncStatus: {
    syncInProgress: false,
    lastSyncTime: 0,
    nextSyncTime: 0,
    totalFiles: 0,
    totalSpreadsheets: 0,
    totalDocuments: 0,
    lastSyncError: null,
    lastSyncDurationMs: 0
   },
   activeSessions: [],
   rateLimitRemaining: 250,
   rateLimitReset: Date.now() + 36e5,
   lastApiError: null
  };
  globalThis.__googleDriveSkillState = state2;
  return state2;
 }
 initGoogleDriveSkillState();
 globalThis.getGoogleDriveSkillState = function getGoogleDriveSkillState() {
  const state2 = globalThis.__googleDriveSkillState;
  if (!state2) {
   throw new Error("[google-drive] Skill state not initialized");
  }
  return state2;
 };
 function getGoogleDriveSkillState2() {
  return globalThis.getGoogleDriveSkillState();
 }

 // skills-ts-out/google-drive/db/helpers.js
 function upsertFile(file) {
  const now = Date.now();
  const parentsJson = file.parents && file.parents.length > 0 ? JSON.stringify(file.parents) : null;
  db.exec(`INSERT INTO files (
   id, name, mime_type, size, modified_time, web_view_link, parents_json, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
   name = excluded.name,
   mime_type = excluded.mime_type,
   size = excluded.size,
   modified_time = excluded.modified_time,
   web_view_link = excluded.web_view_link,
   parents_json = excluded.parents_json,
   synced_at = excluded.synced_at`, [
   file.id,
   file.name,
   file.mimeType ?? "application/octet-stream",
   file.size ?? null,
   file.modifiedTime ?? null,
   file.webViewLink ?? null,
   parentsJson,
   now
  ]);
 }
 function getFileById(fileId) {
  return db.get("SELECT * FROM files WHERE id = ?", [fileId]);
 }
 function getLocalFiles(options = {}) {
  let sql = "SELECT * FROM files WHERE 1=1";
  const params = [];
  if (options.mimeType) {
   sql += " AND mime_type = ?";
   params.push(options.mimeType);
  }
  if (options.query) {
   sql += " AND name LIKE ?";
   params.push(`%${options.query}%`);
  }
  sql += " ORDER BY modified_time DESC";
  const limit = options.limit ?? 50;
  sql += " LIMIT ?";
  params.push(limit);
  return db.all(sql, params);
 }
 function upsertSpreadsheet(id, title, sheets) {
  const now = Date.now();
  const sheetsJson = JSON.stringify(sheets);
  db.exec(`INSERT INTO spreadsheets (id, title, sheets_json, synced_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET title = excluded.title, sheets_json = excluded.sheets_json, synced_at = excluded.synced_at`, [id, title, sheetsJson, now]);
 }
 function upsertSheetValues(spreadsheetId, rangeA1, values) {
  const now = Date.now();
  const valuesJson = JSON.stringify(values);
  db.exec(`INSERT INTO sheet_values (spreadsheet_id, range_a1, values_json, synced_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(spreadsheet_id, range_a1) DO UPDATE SET values_json = excluded.values_json, synced_at = excluded.synced_at`, [spreadsheetId, rangeA1, valuesJson, now]);
 }
 function getSpreadsheetById(id) {
  return db.get("SELECT * FROM spreadsheets WHERE id = ?", [id]);
 }
 function getSheetValues(spreadsheetId, rangeA1) {
  if (rangeA1) {
   const row2 = db.get("SELECT range_a1, values_json FROM sheet_values WHERE spreadsheet_id = ? AND range_a1 = ?", [spreadsheetId, rangeA1]);
   if (!row2)
    return null;
   try {
    return { range_a1: row2.range_a1, values: JSON.parse(row2.values_json) };
   } catch {
    return null;
   }
  }
  const row = db.get("SELECT range_a1, values_json FROM sheet_values WHERE spreadsheet_id = ? ORDER BY range_a1 LIMIT 1", [spreadsheetId]);
  if (!row)
   return null;
  try {
   return { range_a1: row.range_a1, values: JSON.parse(row.values_json) };
  } catch {
   return null;
  }
 }
 function getSheetValueRanges(spreadsheetId) {
  const rows = db.all("SELECT range_a1 FROM sheet_values WHERE spreadsheet_id = ? ORDER BY range_a1", [spreadsheetId]);
  return rows.map((r) => r.range_a1);
 }
 function upsertDocument(id, title, contentText) {
  const now = Date.now();
  db.exec(`INSERT INTO documents (id, title, content_text, synced_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET title = excluded.title, content_text = excluded.content_text, synced_at = excluded.synced_at`, [id, title, contentText, now]);
 }
 function getDocumentById(id) {
  return db.get("SELECT * FROM documents WHERE id = ?", [id]);
 }
 function getEntityCounts() {
  const files = db.get("SELECT COUNT(*) as cnt FROM files", []);
  const spreadsheets = db.get("SELECT COUNT(*) as cnt FROM spreadsheets", []);
  const sheetRanges = db.get("SELECT COUNT(*) as cnt FROM sheet_values", []);
  const documents = db.get("SELECT COUNT(*) as cnt FROM documents", []);
  return {
   totalFiles: files?.cnt ?? 0,
   totalSpreadsheets: spreadsheets?.cnt ?? 0,
   totalSheetRanges: sheetRanges?.cnt ?? 0,
   totalDocuments: documents?.cnt ?? 0
  };
 }
 function getSyncState(key) {
  const row = db.get("SELECT value FROM sync_state WHERE key = ?", [key]);
  return row?.value ?? null;
 }
 function setSyncState(key, value) {
  db.exec("INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)", [key, value]);
 }
 globalThis.GOOGLE_DRIVE_DB_HELPERS = {
  upsertFile,
  getFileById,
  getLocalFiles,
  upsertSpreadsheet,
  upsertSheetValues,
  getSpreadsheetById,
  getSheetValues,
  getSheetValueRanges,
  upsertDocument,
  getDocumentById,
  getEntityCounts,
  getSyncState,
  setSyncState
 };

 // skills-ts-out/google-drive/db/schema.js
 function initializeGoogleDriveSchema() {
  console.log("[google-drive] Initializing database schema...");
  db.exec(`CREATE TABLE IF NOT EXISTS files (
   id TEXT PRIMARY KEY,
   name TEXT NOT NULL,
   mime_type TEXT NOT NULL,
   size TEXT,
   modified_time TEXT,
   web_view_link TEXT,
   parents_json TEXT,
   synced_at INTEGER NOT NULL
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS spreadsheets (
   id TEXT PRIMARY KEY,
   title TEXT NOT NULL,
   sheets_json TEXT NOT NULL,
   synced_at INTEGER NOT NULL
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS sheet_values (
   spreadsheet_id TEXT NOT NULL,
   range_a1 TEXT NOT NULL,
   values_json TEXT NOT NULL,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (spreadsheet_id, range_a1),
   FOREIGN KEY (spreadsheet_id) REFERENCES spreadsheets(id)
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS documents (
   id TEXT PRIMARY KEY,
   title TEXT NOT NULL,
   content_text TEXT NOT NULL,
   synced_at INTEGER NOT NULL
  )`, []);
  db.exec(`CREATE TABLE IF NOT EXISTS sync_state (
   key TEXT PRIMARY KEY,
   value TEXT NOT NULL
  )`, []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_files_modified_time ON files(modified_time DESC)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_sheet_values_spreadsheet ON sheet_values(spreadsheet_id)", []);
  console.log("[google-drive] Database schema initialized successfully");
 }

 // skills-ts-out/google-drive/types.js
 var SHEETS_BASE = "https://sheets.googleapis.com/v4";
 var SHEETS_MIMETYPE = "application/vnd.google-apps.spreadsheet";
 var DOCS_BASE = "https://docs.googleapis.com/v1";
 var DOCS_MIMETYPE = "application/vnd.google-apps.document";

 // skills-ts-out/google-drive/sync.js
 var DEFAULT_PAGE_SIZE = 100;
 var MAX_PAGES_PER_SYNC = 50;
 var MAX_SPREADSHEETS_PER_SYNC = 3;
 var MAX_DOCUMENTS_PER_SYNC = 5;
 var CONTENT_SYNC_TIME_BUDGET_MS = 18e3;
 var DEFAULT_SHEET_RANGE = "A1:Z500";
 function publishSyncState() {
  const s = getGoogleDriveSkillState2();
  const isConnected = !!oauth.getCredential();
  state.setPartial({
   connection_status: isConnected ? "connected" : "disconnected",
   auth_status: isConnected ? "authenticated" : "not_authenticated",
   connection_error: s.syncStatus.lastSyncError ?? null,
   auth_error: null,
   is_initialized: isConnected,
   syncInProgress: s.syncStatus.syncInProgress,
   lastSyncTime: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null,
   nextSyncTime: s.syncStatus.nextSyncTime ? new Date(s.syncStatus.nextSyncTime).toISOString() : null,
   totalFiles: s.syncStatus.totalFiles,
   totalSpreadsheets: s.syncStatus.totalSpreadsheets,
   totalDocuments: s.syncStatus.totalDocuments,
   lastSyncError: s.syncStatus.lastSyncError,
   lastSyncDurationMs: s.syncStatus.lastSyncDurationMs
  });
 }
 async function performSync() {
  const s = getGoogleDriveSkillState2();
  if (s.syncStatus.syncInProgress) {
   console.log("[google-drive] Sync already in progress, skipping");
   return;
  }
  if (!oauth.getCredential()) {
   console.log("[google-drive] No credential, skipping sync");
   return;
  }
  const startTime = Date.now();
  s.syncStatus.syncInProgress = true;
  s.syncStatus.lastSyncError = null;
  publishSyncState();
  try {
   const lastSyncTime = s.syncStatus.lastSyncTime;
   const isFirstSync = lastSyncTime === 0;
   let pageToken;
   let totalUpserted = 0;
   let totalSkipped = 0;
   let pageCount = 0;
   while (pageCount < MAX_PAGES_PER_SYNC) {
    const qParts = ["trashed = false"];
    const params = [
     "q=" + encodeURIComponent(qParts.join(" and ")),
     "pageSize=" + String(DEFAULT_PAGE_SIZE),
     "fields=" + encodeURIComponent("nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, parents)"),
     "orderBy=" + encodeURIComponent("modifiedTime desc")
    ];
    if (pageToken) {
     params.push("pageToken=" + encodeURIComponent(pageToken));
    }
    const path = "/drive/v3/files?" + params.join("&");
    const result = await driveFetch(path);
    if (!result.success) {
     throw new Error(result.error?.message ?? "Drive API request failed");
    }
    const data = result.data;
    const files = data.files ?? [];
    for (const f of files) {
     const id = f.id;
     const modifiedTime = f.modifiedTime || null;
     if (!id)
      continue;
     if (!isFirstSync && modifiedTime) {
      const modifiedMs = new Date(modifiedTime).getTime();
      if (modifiedMs <= lastSyncTime) {
       totalSkipped++;
       continue;
      }
     }
     const existing = getFileById(id);
     if (existing && modifiedTime && existing.modified_time === modifiedTime) {
      totalSkipped++;
      continue;
     }
     upsertFile({
      id,
      name: f.name ?? "",
      mimeType: f.mimeType,
      size: f.size,
      modifiedTime: modifiedTime ?? void 0,
      webViewLink: f.webViewLink,
      parents: Array.isArray(f.parents) ? f.parents : void 0
     });
     totalUpserted++;
    }
    pageToken = data.nextPageToken ?? void 0;
    pageCount++;
    if (!pageToken || files.length === 0)
     break;
   }
   const sheetFiles = getLocalFiles({
    mimeType: SHEETS_MIMETYPE,
    limit: MAX_SPREADSHEETS_PER_SYNC
   });
   let spreadsheetsSynced = 0;
   for (const file of sheetFiles) {
    if (Date.now() - startTime > CONTENT_SYNC_TIME_BUDGET_MS) {
     console.log("[google-drive] Content sync time budget reached, stopping spreadsheets");
     break;
    }
    try {
     const metaRes = await driveFetch(`/v4/spreadsheets/${encodeURIComponent(file.id)}`, {
      baseUrl: SHEETS_BASE
     });
     if (!metaRes.success)
      continue;
     const meta = metaRes.data;
     const title = meta.properties?.title ?? file.name;
     const sheets = (meta.sheets ?? []).map((sh) => ({
      sheetId: sh.properties?.sheetId,
      title: sh.properties?.title ?? ""
     }));
     upsertSpreadsheet(file.id, title, sheets);
     const firstSheet = meta.sheets?.[0]?.properties;
     const sheetTitle = firstSheet?.title ?? "Sheet1";
     const rangeA1 = `${sheetTitle}!${DEFAULT_SHEET_RANGE}`;
     const valRes = await driveFetch(`/v4/spreadsheets/${encodeURIComponent(file.id)}/values/${encodeURIComponent(rangeA1)}`, { baseUrl: SHEETS_BASE });
     if (valRes.success) {
      const valData = valRes.data;
      upsertSheetValues(file.id, rangeA1, valData.values ?? []);
     }
     spreadsheetsSynced++;
    } catch (e) {
     console.error(`[google-drive] Failed to sync spreadsheet ${file.id}: ${e}`);
    }
   }
   const docFiles = getLocalFiles({ mimeType: DOCS_MIMETYPE, limit: MAX_DOCUMENTS_PER_SYNC });
   let documentsSynced = 0;
   for (const file of docFiles) {
    if (Date.now() - startTime > CONTENT_SYNC_TIME_BUDGET_MS) {
     console.log("[google-drive] Content sync time budget reached, stopping documents");
     break;
    }
    try {
     const docRes = await driveFetch(`/v1/documents/${encodeURIComponent(file.id)}`, {
      baseUrl: DOCS_BASE
     });
     if (!docRes.success)
      continue;
     const doc = docRes.data;
     const parts = [];
     (doc.body?.content ?? []).forEach((c) => {
      (c.paragraph?.elements ?? []).forEach((el) => {
       if (el.textRun?.content)
        parts.push(el.textRun.content);
      });
     });
     const contentText = parts.join("").replace(/\n$/, "") || "";
     upsertDocument(file.id, doc.title ?? file.name, contentText);
     documentsSynced++;
    } catch (e) {
     console.error(`[google-drive] Failed to sync document ${file.id}: ${e}`);
    }
   }
   const durationMs = Date.now() - startTime;
   const nowMs = Date.now();
   s.syncStatus.lastSyncTime = nowMs;
   s.syncStatus.nextSyncTime = nowMs + s.config.syncIntervalMinutes * 60 * 1e3;
   s.syncStatus.lastSyncDurationMs = durationMs;
   setSyncState("last_sync", String(nowMs));
   const counts = getEntityCounts();
   s.syncStatus.totalFiles = counts.totalFiles;
   s.syncStatus.totalSpreadsheets = counts.totalSpreadsheets;
   s.syncStatus.totalDocuments = counts.totalDocuments;
   console.log(`[google-drive] Sync complete in ${durationMs}ms \u2014 files: ${totalUpserted} updated, ${totalSkipped} skipped; spreadsheets: ${spreadsheetsSynced}, documents: ${documentsSynced}; totals: ${counts.totalFiles} files, ${counts.totalSpreadsheets} spreadsheets, ${counts.totalDocuments} documents`);
  } catch (error) {
   const errorMsg = error instanceof Error ? error.message : String(error);
   s.syncStatus.lastSyncError = errorMsg;
   s.syncStatus.lastSyncDurationMs = Date.now() - startTime;
   console.error(`[google-drive] Sync failed: ${errorMsg}`);
  } finally {
   s.syncStatus.syncInProgress = false;
   publishSyncState();
  }
 }

 // skills-ts-out/google-drive/tools/list-files.js
 var listFilesTool = {
  name: "google-drive-list-files",
  description: "List files and folders in Google Drive. Optional folder ID (default: root), page size, and order.",
  input_schema: {
   type: "object",
   properties: {
    folder_id: {
     type: "string",
     description: 'Folder ID to list (use "root" for root). Omit to list from root.'
    },
    page_size: {
     type: "number",
     description: "Max number of files to return (default: 50, max: 1000)",
     minimum: 1,
     maximum: 1e3
    },
    order_by: {
     type: "string",
     description: 'Order: modifiedTime, name, createdTime, quotaBytesUsed, etc. Prefix with "desc" for descending.'
    },
    page_token: {
     type: "string",
     description: "Page token from previous response for pagination"
    },
    include_trashed: { type: "boolean", description: "Include trashed files (default: false)" }
   },
   required: []
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const folderId = args.folder_id || "root";
    const pageSize = Math.min(Number(args.page_size) || 50, 1e3);
    const orderBy = args.order_by || "modifiedTime desc";
    const pageToken = args.page_token;
    const includeTrashed = Boolean(args.include_trashed);
    const qParts = [`'${folderId}' in parents`];
    if (!includeTrashed)
     qParts.push("trashed = false");
    const fields = "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, parents)";
    const paramParts = [
     "q=" + encodeURIComponent(qParts.join(" and ")),
     "pageSize=" + encodeURIComponent(String(pageSize)),
     "orderBy=" + encodeURIComponent(orderBy),
     "fields=" + encodeURIComponent(fields)
    ];
    if (pageToken)
     paramParts.push("pageToken=" + encodeURIComponent(pageToken));
    const path = "/drive/v3/files?" + paramParts.join("&");
    const response = await driveFetch(path);
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message ?? "Failed to list files"
     }));
    }
    const data = response.data;
    const files = (data.files ?? []).map((f) => ({
     id: f.id,
     name: f.name,
     mimeType: f.mimeType,
     size: f.size,
     modifiedTime: f.modifiedTime,
     webViewLink: f.webViewLink,
     parents: f.parents
    }));
    return Promise.resolve(JSON.stringify({ success: true, files, next_page_token: data.nextPageToken ?? null }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/get-file.js
 var getFileTool = {
  name: "google-drive-get-file",
  description: "Get file metadata or export content. For native Google Docs/Sheets, use export_format to get plain text or CSV.",
  input_schema: {
   type: "object",
   properties: {
    file_id: { type: "string", description: "Drive file ID" },
    export_format: {
     type: "string",
     description: "For Docs/Sheets: text/plain, text/html, application/pdf, or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx). Omit for metadata only."
    }
   },
   required: ["file_id"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const fileId = args.file_id;
    const exportFormat = args.export_format;
    if (!fileId) {
     return Promise.resolve(JSON.stringify({ success: false, error: "file_id is required" }));
    }
    if (exportFormat) {
     const path2 = `/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportFormat)}`;
     const response2 = await driveFetch(path2, { rawBody: true });
     if (response2.success) {
      return Promise.resolve(JSON.stringify({
       success: true,
       content: response2.data,
       exported_as: exportFormat
      }));
     }
     return Promise.resolve(JSON.stringify({ success: false, error: response2.error?.message ?? "Export failed" }));
    }
    const path = `/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink,parents,createdTime`;
    const response = await driveFetch(path);
    if (!response.success) {
     return Promise.resolve(JSON.stringify({ success: false, error: response.error?.message ?? "Failed to get file" }));
    }
    return Promise.resolve(JSON.stringify({ success: true, file: response.data }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/search-files.js
 var searchFilesTool = {
  name: "google-drive-search-files",
  description: 'Search Google Drive by name, mime type, or full-text. Use Drive query syntax (e.g. name contains "report", mimeType = "application/vnd.google-apps.spreadsheet").',
  input_schema: {
   type: "object",
   properties: {
    query: {
     type: "string",
     description: `Drive search query (e.g. "name contains 'meeting'", "mimeType = 'application/vnd.google-apps.document'", "fullText contains 'budget'")`
    },
    page_size: {
     type: "number",
     description: "Max results (default: 50, max: 1000)",
     minimum: 1,
     maximum: 1e3
    },
    page_token: { type: "string", description: "Page token for pagination" }
   },
   required: ["query"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "query is required and must be a non-empty string"
     }));
    }
    const parsedPageSize = Number(args.page_size);
    const pageSize = Math.max(1, Math.min(Number.isNaN(parsedPageSize) ? 50 : parsedPageSize, 1e3));
    const pageToken = args.page_token;
    const fields = "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, parents)";
    const paramParts = [
     "q=" + encodeURIComponent(query),
     "pageSize=" + encodeURIComponent(String(pageSize)),
     "fields=" + encodeURIComponent(fields)
    ];
    if (pageToken)
     paramParts.push("pageToken=" + encodeURIComponent(pageToken));
    const path = "/drive/v3/files?" + paramParts.join("&");
    const response = await driveFetch(path);
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message ?? "Failed to search files"
     }));
    }
    const data = response.data;
    const files = (data.files ?? []).map((f) => ({
     id: f.id,
     name: f.name,
     mimeType: f.mimeType,
     size: f.size,
     modifiedTime: f.modifiedTime,
     webViewLink: f.webViewLink,
     parents: f.parents
    }));
    return Promise.resolve(JSON.stringify({ success: true, files, next_page_token: data.nextPageToken ?? null }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/get-spreadsheet.js
 var getSpreadsheetTool = {
  name: "google-drive-get-spreadsheet",
  description: "Get Google Sheets spreadsheet metadata: title and sheet names. Use spreadsheet_id from Drive (file with mimeType application/vnd.google-apps.spreadsheet).",
  input_schema: {
   type: "object",
   properties: {
    spreadsheet_id: {
     type: "string",
     description: "Spreadsheet ID (Drive file ID of the sheet)"
    }
   },
   required: ["spreadsheet_id"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const spreadsheetId = args.spreadsheet_id;
    if (!spreadsheetId) {
     return Promise.resolve(JSON.stringify({ success: false, error: "spreadsheet_id is required" }));
    }
    const path = `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const response = await driveFetch(path, { baseUrl: SHEETS_BASE });
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message ?? "Failed to get spreadsheet"
     }));
    }
    const data = response.data;
    const sheets = (data.sheets ?? []).map((sh) => ({
     title: sh.properties?.title,
     sheetId: sh.properties?.sheetId
    }));
    return Promise.resolve(JSON.stringify({
     success: true,
     spreadsheetId: data.spreadsheetId,
     title: data.properties?.title,
     sheets: sheets.map((sh) => sh.title)
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/get-sheet-values.js
 var getSheetValuesTool = {
  name: "google-drive-get-sheet-values",
  description: 'Read a range of values from a Google Sheet. Range in A1 notation (e.g. "Sheet1!A1:D10" or "A1:B2").',
  input_schema: {
   type: "object",
   properties: {
    spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
    range: { type: "string", description: 'A1 notation range (e.g. "Sheet1!A1:D10" or "A1:B2")' }
   },
   required: ["spreadsheet_id", "range"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const spreadsheetId = args.spreadsheet_id;
    const range = args.range;
    if (!spreadsheetId || !range) {
     return Promise.resolve(JSON.stringify({ success: false, error: "spreadsheet_id and range are required" }));
    }
    const path = `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
    const response = await driveFetch(path, { baseUrl: SHEETS_BASE });
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to get values"
     }));
    }
    const data = response.data;
    return Promise.resolve(JSON.stringify({ success: true, range: data.range, values: data.values ?? [] }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/update-sheet-values.js
 var updateSheetValuesTool = {
  name: "google-drive-update-sheet-values",
  description: "Update a range of cells in a Google Sheet. Values as 2D array. value_input_option: RAW or USER_ENTERED (parses formulas/dates).",
  input_schema: {
   type: "object",
   properties: {
    spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
    range: { type: "string", description: 'A1 notation range (e.g. "Sheet1!A1:B2")' },
    values: {
     type: "array",
     description: '2D array of cell values (rows of columns), e.g. [["A1","B1"],["A2","B2"]]'
    },
    value_input_option: {
     type: "string",
     description: "RAW (no parsing) or USER_ENTERED (formulas, numbers, dates)",
     enum: ["RAW", "USER_ENTERED"]
    }
   },
   required: ["spreadsheet_id", "range", "values"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const spreadsheetId = args.spreadsheet_id;
    const range = args.range;
    const values = args.values;
    const valueInputOption = args.value_input_option || "USER_ENTERED";
    const is2DArray = Array.isArray(values) && values.every((row) => Array.isArray(row));
    if (!spreadsheetId || !range || !is2DArray) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "spreadsheet_id, range, and values (2D array) are required; values must be a 2D array"
     }));
    }
    const path = `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`;
    const response = await driveFetch(path, {
     method: "PUT",
     body: JSON.stringify({ values }),
     baseUrl: SHEETS_BASE
    });
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to update values"
     }));
    }
    const data = response.data;
    return Promise.resolve(JSON.stringify({
     success: true,
     updatedCells: data.updatedCells,
     updatedRows: data.updatedRows
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/get-document.js
 var getDocumentTool = {
  name: "google-drive-get-document",
  description: "Get Google Docs document structure and text content. document_id is the Drive file ID (mimeType application/vnd.google-apps.document).",
  input_schema: {
   type: "object",
   properties: { document_id: { type: "string", description: "Google Doc ID (Drive file ID)" } },
   required: ["document_id"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const documentId = args.document_id;
    if (!documentId) {
     return Promise.resolve(JSON.stringify({ success: false, error: "document_id is required" }));
    }
    const path = `/v1/documents/${encodeURIComponent(documentId)}`;
    const response = await driveFetch(path, { baseUrl: DOCS_BASE });
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to get document"
     }));
    }
    const data = response.data;
    const parts = [];
    (data.body?.content ?? []).forEach((c) => {
     (c.paragraph?.elements ?? []).forEach((el) => {
      if (el.textRun?.content)
       parts.push(el.textRun.content);
     });
    });
    const text = parts.join("").replace(/\n$/, "");
    return Promise.resolve(JSON.stringify({
     success: true,
     documentId: data.documentId,
     title: data.title,
     content: text
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/create-document.js
 var createDocumentTool = {
  name: "google-drive-create-document",
  description: "Create a new Google Docs document in Drive. Optionally in a folder. Returns file id and webViewLink.",
  input_schema: {
   type: "object",
   properties: {
    name: { type: "string", description: "Document title / file name" },
    folder_id: { type: "string", description: "Parent folder ID (omit for root)" }
   },
   required: ["name"]
  },
  async execute(args) {
   try {
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    const name = args.name;
    const folderId = args.folder_id;
    if (!name) {
     return Promise.resolve(JSON.stringify({ success: false, error: "name is required" }));
    }
    const body = {
     name,
     mimeType: "application/vnd.google-apps.document"
    };
    if (folderId) {
     body.parents = [folderId];
    }
    const response = await driveFetch("/drive/v3/files", {
     method: "POST",
     body: JSON.stringify(body)
    });
    if (!response.success) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to create document"
     }));
    }
    const data = response.data;
    return Promise.resolve(JSON.stringify({
     success: true,
     id: data.id,
     name: data.name,
     webViewLink: data.webViewLink
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/sync-now.js
 var syncNowTool = {
  name: "google-drive-sync-now",
  description: "Trigger an immediate Google Drive sync to refresh local file cache. Returns sync results including count of synced files.",
  input_schema: { type: "object", properties: {} },
  async execute() {
   try {
    const s = getGoogleDriveSkillState2();
    if (!oauth.getCredential()) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Google Drive not connected. Complete OAuth setup first."
     }));
    }
    if (s.syncStatus.syncInProgress) {
     return Promise.resolve(JSON.stringify({
      success: false,
      message: "Sync already in progress",
      sync_in_progress: true,
      last_sync_time: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null
     }));
    }
    await performSync();
    return Promise.resolve(JSON.stringify({
     success: !s.syncStatus.lastSyncError,
     message: "Sync completed",
     last_sync_time: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null,
     totals: {
      files: s.syncStatus.totalFiles,
      spreadsheets: s.syncStatus.totalSpreadsheets,
      documents: s.syncStatus.totalDocuments
     }
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/tools/sync-status.js
 var syncStatusTool = {
  name: "google-drive-sync-status",
  description: "Get the current Google Drive sync status including last sync time, total synced files, sync progress, and any errors.",
  input_schema: { type: "object", properties: {} },
  execute() {
   try {
    const s = getGoogleDriveSkillState2();
    return Promise.resolve(JSON.stringify({
     success: true,
     connected: !!oauth.getCredential(),
     user_email: s.config.userEmail || null,
     sync_in_progress: s.syncStatus.syncInProgress,
     last_sync_time: s.syncStatus.lastSyncTime ? new Date(s.syncStatus.lastSyncTime).toISOString() : null,
     next_sync_time: s.syncStatus.nextSyncTime ? new Date(s.syncStatus.nextSyncTime).toISOString() : null,
     last_sync_duration_ms: s.syncStatus.lastSyncDurationMs,
     last_sync_error: s.syncStatus.lastSyncError,
     totals: {
      files: s.syncStatus.totalFiles,
      spreadsheets: s.syncStatus.totalSpreadsheets,
      documents: s.syncStatus.totalDocuments
     },
     config: { sync_interval_minutes: s.config.syncIntervalMinutes }
    }));
   } catch (e) {
    return Promise.resolve(JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
   }
  }
 };

 // skills-ts-out/google-drive/index.js
 async function init() {
  console.log(`[google-drive] Initializing on ${platform.os()}`);
  const s = globalThis.getGoogleDriveSkillState();
  initializeGoogleDriveSchema();
  const saved = state.get("config");
  if (saved) {
   s.config.credentialId = saved.credentialId ?? s.config.credentialId;
   s.config.userEmail = saved.userEmail ?? s.config.userEmail;
   if (typeof saved.syncIntervalMinutes === "number") {
    s.config.syncIntervalMinutes = saved.syncIntervalMinutes;
   }
  }
  const lastSync = state.get("lastSyncTime");
  if (lastSync) {
   s.syncStatus.lastSyncTime = typeof lastSync === "number" ? lastSync : new Date(lastSync).getTime();
  }
  const counts = getEntityCounts();
  s.syncStatus.totalFiles = counts.totalFiles;
  s.syncStatus.totalSpreadsheets = counts.totalSpreadsheets;
  s.syncStatus.totalDocuments = counts.totalDocuments;
  const isConnected = !!oauth.getCredential();
  console.log(`[google-drive] Initialized. Connected: ${isConnected}`);
  publishSkillState();
 }
 async function start() {
  console.log("[google-drive] Starting skill...");
  const s = globalThis.getGoogleDriveSkillState();
  if (oauth.getCredential()) {
   const cronExpr = `0 */${s.config.syncIntervalMinutes} * * * *`;
   cron.register("google-drive-sync", cronExpr);
   await performSync();
  }
  publishSkillState();
 }
 async function stop() {
  console.log("[google-drive] Stopping skill...");
  const s = globalThis.getGoogleDriveSkillState();
  cron.unregister("google-drive-sync");
  state.set("config", s.config);
  console.log("[google-drive] Skill stopped");
 }
 async function onCronTrigger(scheduleId) {
  if (scheduleId === "google-drive-sync") {
   await performSync();
  }
 }
 async function onSync() {
  await performSync();
 }
 async function onSessionStart(args) {
  const s = globalThis.getGoogleDriveSkillState();
  s.activeSessions.push(args.sessionId);
 }
 async function onSessionEnd(args) {
  const s = globalThis.getGoogleDriveSkillState();
  const i = s.activeSessions.indexOf(args.sessionId);
  if (i > -1)
   s.activeSessions.splice(i, 1);
 }
 async function onOAuthComplete(args) {
  console.log(`[google-drive] OAuth complete: ${args.provider}`);
  const s = globalThis.getGoogleDriveSkillState();
  s.config.credentialId = args.credentialId;
  if (args.accountLabel)
   s.config.userEmail = args.accountLabel;
  state.set("config", s.config);
  publishSkillState();
 }
 async function onOAuthRevoked(_args) {
  const s = globalThis.getGoogleDriveSkillState();
  s.config = { credentialId: "", userEmail: "", syncIntervalMinutes: s.config.syncIntervalMinutes };
  state.set("config", s.config);
  publishSkillState();
 }
 async function onDisconnect() {
  oauth.revoke();
  const s = globalThis.getGoogleDriveSkillState();
  s.config = { credentialId: "", userEmail: "", syncIntervalMinutes: s.config.syncIntervalMinutes };
  state.delete("config");
  publishSkillState();
 }
 function publishSkillState() {
  const s = globalThis.getGoogleDriveSkillState();
  const isConnected = !!oauth.getCredential();
  state.setPartial({
   connection_status: isConnected ? "connected" : "disconnected",
   auth_status: isConnected ? "authenticated" : "not_authenticated",
   connection_error: s.lastApiError || null,
   auth_error: null,
   is_initialized: isConnected,
   userEmail: s.config.userEmail,
   activeSessions: s.activeSessions.length,
   rateLimitRemaining: s.rateLimitRemaining,
   lastError: s.lastApiError
  });
 }
 var _g = globalThis;
 _g.driveFetch = globalThis.googleDriveApi.driveFetch;
 _g.publishSkillState = publishSkillState;
 _g.performSync = performSync;
 var tools = [
  listFilesTool,
  getFileTool,
  searchFilesTool,
  getSpreadsheetTool,
  getSheetValuesTool,
  updateSheetValuesTool,
  getDocumentTool,
  createDocumentTool,
  syncNowTool,
  syncStatusTool
 ];
 var skill = {
  info: {
   id: "google-drive",
   name: "Google Drive",
   version: "2.0.0",
   description: "Google Drive integration with persistent storage",
   auto_start: true,
   setup: { required: true, label: "Google Drive" }
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSessionStart,
  onSessionEnd,
  onOAuthComplete,
  onOAuthRevoked,
  onDisconnect,
  onSync
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
