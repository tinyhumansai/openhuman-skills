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

 // skills-ts-out/core/server-ping/index.js
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

 // skills-ts-out/core/server-ping/db/helpers.js
 function logPing(timestamp, url, status, latencyMs, success, error) {
  db.exec("INSERT INTO ping_log (timestamp, url, status, latency_ms, success, error) VALUES (?, ?, ?, ?, ?, ?)", [timestamp, url, status, latencyMs, success ? 1 : 0, error]);
 }
 function getLatestPing() {
  return db.get("SELECT latency_ms, status, success FROM ping_log ORDER BY id DESC LIMIT 1", []);
 }
 function getRecentPings(limit) {
  return db.all("SELECT timestamp, status, latency_ms, success, error FROM ping_log ORDER BY id DESC LIMIT ?", [limit]);
 }
 globalThis.serverPingDb = { logPing, getLatestPing, getRecentPings };

 // skills-ts-out/core/server-ping/db/schema.js
 function initializeSchema() {
  db.exec(`CREATE TABLE IF NOT EXISTS ping_log (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   timestamp TEXT NOT NULL,
   url TEXT NOT NULL,
   status INTEGER,
   latency_ms INTEGER,
   success INTEGER NOT NULL,
   error TEXT
  )`, []);
 }
 globalThis.initializeServerPingSchema = initializeSchema;

 // skills-ts-out/core/server-ping/setup.js
 async function onSetupStart() {
  console.log("[server-ping] onSetupStart");
  const defaultUrl = platform.env("BACKEND_URL") || platform.env("BACKEND_URL") || "";
  return {
   step: {
    id: "server-config",
    title: "Server Configuration",
    description: "Enter the server URL to monitor and choose a ping interval.",
    fields: [
     {
      name: "serverUrl",
      type: "text",
      label: "Server URL",
      description: "Full URL to ping (e.g. https://api.example.com/health)",
      required: true,
      default: defaultUrl,
      placeholder: "https://api.example.com/health"
     },
     {
      name: "pingIntervalSec",
      type: "select",
      label: "Ping Interval",
      description: "How often to check the server",
      required: true,
      default: "10",
      options: [
       { label: "Every 5 seconds", value: "5" },
       { label: "Every 10 seconds", value: "10" },
       { label: "Every 30 seconds", value: "30" },
       { label: "Every 60 seconds", value: "60" }
      ]
     }
    ]
   }
  };
 }
 async function onSetupSubmit(args) {
  const { stepId, values } = args;
  const s = globalThis.getSkillState();
  if (stepId === "server-config") {
   const url = (values.serverUrl || "").trim();
   if (!url) {
    return {
     status: "error",
     errors: [{ field: "serverUrl", message: "Server URL is required" }]
    };
   }
   if (!url.startsWith("http")) {
    return {
     status: "error",
     errors: [{ field: "serverUrl", message: "URL must start with http:// or https://" }]
    };
   }
   try {
    const response = await net.fetch(url, { method: "GET", timeout: 1e4 });
    if (response.status >= 500) {
     return {
      status: "error",
      errors: [
       {
        field: "serverUrl",
        message: `Server returned error ${response.status}. Verify the URL is correct.`
       }
      ]
     };
    }
   } catch (e) {
    return {
     status: "error",
     errors: [
      {
       field: "serverUrl",
       message: `Could not reach server: ${String(e)}. Check the URL and try again.`
      }
     ]
    };
   }
   s.config.serverUrl = url;
   s.config.pingIntervalSec = parseInt(values.pingIntervalSec) || 10;
   return {
    status: "next",
    nextStep: {
     id: "notification-config",
     title: "Notification Preferences",
     description: "Choose when to receive desktop notifications.",
     fields: [
      {
       name: "notifyOnDown",
       type: "boolean",
       label: "Notify when server goes down",
       description: "Send a desktop notification when the server becomes unreachable",
       required: false,
       default: true
      },
      {
       name: "notifyOnRecover",
       type: "boolean",
       label: "Notify when server recovers",
       description: "Send a desktop notification when the server comes back online",
       required: false,
       default: true
      }
     ]
    }
   };
  }
  if (stepId === "notification-config") {
   s.config.notifyOnDown = values.notifyOnDown != null ? values.notifyOnDown : true;
   s.config.notifyOnRecover = values.notifyOnRecover != null ? values.notifyOnRecover : true;
   state.set("config", s.config);
   data.write("config.json", JSON.stringify(s.config, null, 2));
   console.log(`[server-ping] Setup complete \u2014 monitoring ${s.config.serverUrl}`);
   return { status: "complete" };
  }
  return { status: "error", errors: [{ field: "", message: `Unknown setup step: ${stepId}` }] };
 }
 async function onSetupCancel() {
  console.log("[server-ping] Setup cancelled");
 }
 globalThis.serverPingSetup = { onSetupStart, onSetupSubmit, onSetupCancel };

 // skills-ts-out/core/server-ping/state.js
 var _g = globalThis;
 function initSkillState() {
  const stateObj = {
   config: {
    serverUrl: "",
    pingIntervalSec: 10,
    notifyOnDown: true,
    notifyOnRecover: true,
    verboseLogging: false
   },
   pingCount: 0,
   failCount: 0,
   consecutiveFails: 0,
   wasDown: false,
   activeSessions: [],
   pingIntervalId: null
  };
  _g.__skillState = stateObj;
  return stateObj;
 }
 initSkillState();
 _g.getSkillState = function getSkillState() {
  const s = _g.__skillState;
  if (!s) {
   throw new Error("[server-ping] Skill state not initialized");
  }
  return s;
 };

 // skills-ts-out/core/server-ping/tools/get-ping-stats.js
 var getPingStatsTool = {
  name: "get-ping-stats",
  description: "Get current ping statistics including uptime, total pings, failures, and latest latency.",
  input_schema: { type: "object", properties: {} },
  execute() {
   const s = globalThis.getSkillState();
   const uptimePct = s.pingCount > 0 ? Math.round((s.pingCount - s.failCount) / s.pingCount * 1e4) / 100 : 100;
   const latest = db.get("SELECT latency_ms, status, timestamp FROM ping_log ORDER BY id DESC LIMIT 1", []);
   const avgLatency = db.get("SELECT AVG(latency_ms) as avg_ms FROM ping_log WHERE success = 1", []);
   return JSON.stringify({
    serverUrl: s.config.serverUrl,
    totalPings: s.pingCount,
    totalFailures: s.failCount,
    consecutiveFailures: s.consecutiveFails,
    uptimePercent: uptimePct,
    lastPing: latest ? { latencyMs: latest.latency_ms, status: latest.status, at: latest.timestamp } : null,
    avgLatencyMs: avgLatency && avgLatency.avg_ms ? Math.round(avgLatency.avg_ms) : null,
    platform: platform.os()
   });
  }
 };

 // skills-ts-out/core/server-ping/tools/get-ping-history.js
 var getPingHistoryTool = {
  name: "get-ping-history",
  description: "Get recent ping history from the database. Returns the last N ping results.",
  input_schema: {
   type: "object",
   properties: {
    limit: {
     type: "number",
     description: "Number of recent pings to return (default 20, max 100)"
    }
   }
  },
  execute(args) {
   const limit = Math.min(Math.max(parseInt(args.limit) || 20, 1), 100);
   const rows = db.all("SELECT timestamp, url, status, latency_ms, success, error FROM ping_log ORDER BY id DESC LIMIT ?", [limit]);
   return JSON.stringify({ count: rows.length, history: rows });
  }
 };

 // skills-ts-out/core/server-ping/tools/ping-now.js
 var pingNowTool = {
  name: "ping-now",
  description: "Trigger an immediate ping to the configured server and return the result.",
  input_schema: { type: "object", properties: {} },
  execute() {
   const _g3 = globalThis;
   if (_g3.doPing)
    _g3.doPing();
   const s = globalThis.getSkillState();
   const latest = db.get("SELECT timestamp, status, latency_ms, success, error FROM ping_log ORDER BY id DESC LIMIT 1", []);
   return JSON.stringify({ triggered: true, pingNumber: s.pingCount, result: latest });
  }
 };

 // skills-ts-out/core/server-ping/tools/list-peer-skills.js
 var listPeerSkillsTool = {
  name: "list-peer-skills",
  description: "List all other running skills in the system (demonstrates inter-skill communication).",
  input_schema: { type: "object", properties: {} },
  execute() {
   try {
    const peers = skills.list();
    return JSON.stringify({ skills: peers });
   } catch (e) {
    return JSON.stringify({ error: String(e), skills: [] });
   }
  }
 };

 // skills-ts-out/core/server-ping/tools/update-server-url.js
 var updateServerUrlTool = {
  name: "update-server-url",
  description: "Change the monitored server URL at runtime.",
  input_schema: {
   type: "object",
   properties: { url: { type: "string", description: "New server URL to monitor" } },
   required: ["url"]
  },
  execute(args) {
   const url = (args.url || "").trim();
   if (!url || !url.startsWith("http")) {
    return JSON.stringify({ error: "Invalid URL \u2014 must start with http:// or https://" });
   }
   const s = globalThis.getSkillState();
   const oldUrl = s.config.serverUrl;
   s.config.serverUrl = url;
   state.set("config", s.config);
   console.log(`[server-ping] Server URL changed: ${oldUrl} -> ${url}`);
   const _g3 = globalThis;
   if (_g3.publishState)
    _g3.publishState();
   return JSON.stringify({ success: true, oldUrl, newUrl: url });
  }
 };

 // skills-ts-out/core/server-ping/tools/read-config.js
 var readConfigTool = {
  name: "read-config",
  description: "Read the current skill configuration from the data directory (demonstrates data file I/O).",
  input_schema: { type: "object", properties: {} },
  execute() {
   try {
    const raw = data.read("config.json");
    return raw || JSON.stringify({ error: "No config file found" });
   } catch (e) {
    return JSON.stringify({ error: `Failed to read config: ${e}` });
   }
  }
 };

 // skills-ts-out/core/server-ping/index.js
 function getSkillState2() {
  return globalThis.getSkillState();
 }
 async function init() {
  console.log(`[server-ping] Initializing on ${platform.os()}`);
  globalThis.initializeServerPingSchema();
  const s = getSkillState2();
  const saved = state.get("config");
  if (saved) {
   s.config.serverUrl = saved.serverUrl != null ? saved.serverUrl : s.config.serverUrl;
   s.config.pingIntervalSec = saved.pingIntervalSec != null ? saved.pingIntervalSec : s.config.pingIntervalSec;
   s.config.notifyOnDown = saved.notifyOnDown != null ? saved.notifyOnDown : s.config.notifyOnDown;
   s.config.notifyOnRecover = saved.notifyOnRecover != null ? saved.notifyOnRecover : s.config.notifyOnRecover;
   s.config.verboseLogging = saved.verboseLogging != null ? saved.verboseLogging : s.config.verboseLogging;
  }
  if (!s.config.serverUrl) {
   const envUrl = platform.env("BACKEND_URL") || platform.env("BACKEND_URL");
   if (envUrl) {
    s.config.serverUrl = envUrl;
    console.log(`[server-ping] Using BACKEND_URL from env: ${envUrl}`);
   }
  }
  const counters = state.get("counters");
  if (counters) {
   s.pingCount = counters.pingCount || 0;
   s.failCount = counters.failCount || 0;
  }
  console.log(`[server-ping] Config loaded \u2014 target: ${s.config.serverUrl}`);
 }
 async function start() {
  const s = getSkillState2();
  if (!s.config.serverUrl) {
   console.warn("[server-ping] No server URL configured \u2014 waiting for setup");
   return;
  }
  const intervalMs = s.config.pingIntervalSec * 1e3;
  console.log(`[server-ping] Starting \u2014 ping every ${s.config.pingIntervalSec}s (using setInterval)`);
  if (s.pingIntervalId !== null) {
   clearInterval(s.pingIntervalId);
  }
  s.pingIntervalId = setInterval(() => {
   doPing();
  }, intervalMs);
  doPing();
  publishState();
 }
 async function stop() {
  console.log("[server-ping] Stopping");
  const s = getSkillState2();
  if (s.pingIntervalId !== null) {
   clearInterval(s.pingIntervalId);
   s.pingIntervalId = null;
  }
  state.set("counters", { pingCount: s.pingCount, failCount: s.failCount });
  state.set("status", "stopped");
 }
 async function onListOptions() {
  const s = getSkillState2();
  return {
   options: [
    {
     name: "pingIntervalSec",
     type: "select",
     label: "Ping interval",
     description: "How often to check the server",
     value: String(s.config.pingIntervalSec),
     options: [
      { label: "Every 5 seconds", value: "5" },
      { label: "Every 10 seconds", value: "10" },
      { label: "Every 30 seconds", value: "30" },
      { label: "Every 60 seconds", value: "60" }
     ]
    },
    {
     name: "notifyOnDown",
     type: "boolean",
     label: "Notify on server down",
     description: "Send desktop notification when server is unreachable",
     value: s.config.notifyOnDown
    },
    {
     name: "notifyOnRecover",
     type: "boolean",
     label: "Notify on recovery",
     description: "Send desktop notification when server recovers",
     value: s.config.notifyOnRecover
    },
    {
     name: "verboseLogging",
     type: "boolean",
     label: "Verbose logging",
     description: "Log every ping result to console",
     value: s.config.verboseLogging
    }
   ]
  };
 }
 async function onSetOption(args) {
  const { name, value } = args;
  const s = getSkillState2();
  if (name === "pingIntervalSec") {
   const newInterval = parseInt(value) || 10;
   s.config.pingIntervalSec = newInterval;
   if (s.pingIntervalId !== null) {
    clearInterval(s.pingIntervalId);
    const intervalMs = newInterval * 1e3;
    s.pingIntervalId = setInterval(() => {
     doPing();
    }, intervalMs);
   }
   console.log(`[server-ping] Ping interval changed to ${newInterval}s`);
  } else if (name === "notifyOnDown") {
   s.config.notifyOnDown = !!value;
  } else if (name === "notifyOnRecover") {
   s.config.notifyOnRecover = !!value;
  } else if (name === "verboseLogging") {
   s.config.verboseLogging = !!value;
  }
  state.set("config", s.config);
  publishState();
  console.log(`[server-ping] Option '${name}' set to ${value}`);
 }
 async function onSessionStart(args) {
  const { sessionId } = args;
  const s = getSkillState2();
  s.activeSessions.push(sessionId);
  console.log(`[server-ping] Session started: ${sessionId} (active: ${s.activeSessions.length})`);
 }
 async function onSessionEnd(args) {
  const { sessionId } = args;
  const s = getSkillState2();
  s.activeSessions = s.activeSessions.filter((sid) => sid !== sessionId);
  console.log(`[server-ping] Session ended: ${sessionId} (active: ${s.activeSessions.length})`);
 }
 async function onCronTrigger(_scheduleId) {
 }
 async function doPing() {
  const s = getSkillState2();
  s.pingCount++;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const startTime = Date.now();
  try {
   const response = await net.fetch(s.config.serverUrl, { method: "GET", timeout: 10 });
   const latencyMs = Date.now() - startTime;
   const success = response.status >= 200 && response.status < 400;
   if (!success) {
    s.failCount++;
    s.consecutiveFails++;
   } else {
    if (s.wasDown && s.config.notifyOnRecover) {
     sendNotification("Server Recovered", `${s.config.serverUrl} is back online (was down for ${s.consecutiveFails} checks)`);
    }
    s.consecutiveFails = 0;
    s.wasDown = false;
   }
   if (s.config.verboseLogging) {
    console.log(`[server-ping] #${s.pingCount} ${response.status} ${latencyMs}ms`);
   }
   globalThis.serverPingDb.logPing(timestamp, s.config.serverUrl, response.status, latencyMs, success, null);
  } catch (e) {
   const latencyMs = Date.now() - startTime;
   s.failCount++;
   s.consecutiveFails++;
   console.error(`[server-ping] #${s.pingCount} FAILED: ${e}`);
   globalThis.serverPingDb.logPing(timestamp, s.config.serverUrl, 0, latencyMs, false, String(e));
   if (s.consecutiveFails === 1 && s.config.notifyOnDown) {
    s.wasDown = true;
    sendNotification("Server Down", `${s.config.serverUrl} is unreachable: ${e}`);
   }
  }
  if (s.pingCount % 10 === 0) {
   state.set("counters", { pingCount: s.pingCount, failCount: s.failCount });
  }
  publishState();
  appendDataLog(timestamp);
 }
 function publishState() {
  const s = getSkillState2();
  const uptimePct = s.pingCount > 0 ? Math.round((s.pingCount - s.failCount) / s.pingCount * 1e4) / 100 : 100;
  const latest = globalThis.serverPingDb.getLatestPing();
  state.setPartial({
   status: s.consecutiveFails > 0 ? "down" : "healthy",
   pingCount: s.pingCount,
   failCount: s.failCount,
   consecutiveFails: s.consecutiveFails,
   uptimePercent: uptimePct,
   lastLatencyMs: latest ? latest.latency_ms : null,
   lastStatus: latest ? latest.status : null,
   serverUrl: s.config.serverUrl,
   activeSessions: s.activeSessions.length,
   platform: platform.os()
  });
 }
 function appendDataLog(timestamp) {
  const recent = globalThis.serverPingDb.getRecentPings(20);
  const lines = ["# Ping Log (last 20 entries)", `# Generated: ${timestamp}`, ""];
  for (const r of recent) {
   const statusStr = r.success ? `OK ${r.status}` : "FAIL";
   lines.push(`${r.timestamp} | ${statusStr} | ${r.latency_ms}ms${r.error ? ` | ${r.error}` : ""}`);
  }
  data.write("ping-log.txt", lines.join("\n"));
 }
 function sendNotification(title, body) {
  const currentOs = platform.os();
  if (currentOs === "android" || currentOs === "ios") {
   console.log(`[server-ping] Notification (mobile, skipped): ${title} \u2014 ${body}`);
   return;
  }
  try {
   platform.notify(title, body);
  } catch (e) {
   console.warn(`[server-ping] Notification failed: ${e}`);
  }
 }
 var _g2 = globalThis;
 _g2.doPing = doPing;
 _g2.publishState = publishState;
 _g2.init = init;
 _g2.start = start;
 _g2.stop = stop;
 _g2.onCronTrigger = onCronTrigger;
 _g2.onSetupStart = globalThis.serverPingSetup.onSetupStart;
 _g2.onSetupSubmit = globalThis.serverPingSetup.onSetupSubmit;
 _g2.onSetupCancel = globalThis.serverPingSetup.onSetupCancel;
 _g2.onListOptions = onListOptions;
 _g2.onSetOption = onSetOption;
 _g2.onSessionStart = onSessionStart;
 _g2.onSessionEnd = onSessionEnd;
 var tools = [
  getPingStatsTool,
  getPingHistoryTool,
  pingNowTool,
  listPeerSkillsTool,
  updateServerUrlTool,
  readConfigTool
 ];
 var skill = {
  info: {
   id: "server-ping",
   name: "Server Ping",
   version: "2.2.0",
   description: "Monitors server health with configurable ping intervals using setInterval. Demos setup flow, DB, state, data, net, platform, skills interop, options, and tools.",
   auto_start: false,
   setup: { required: true, label: "Configure Server Ping" }
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSetupStart: globalThis.serverPingSetup.onSetupStart,
  onSetupSubmit: globalThis.serverPingSetup.onSetupSubmit,
  onSetupCancel: globalThis.serverPingSetup.onSetupCancel,
  onListOptions,
  onSetOption,
  onSessionStart,
  onSessionEnd
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
