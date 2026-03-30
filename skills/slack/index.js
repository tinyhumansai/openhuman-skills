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

 // skills-ts-out/slack/index.js
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

 // skills-ts-out/slack/types.js
 var SLACK_BASE_URL = "https://slack.com/api";
 var SLACK_REQUEST_TIMEOUT = 15e3;
 var SYNC_MAX_CHANNELS = 30;
 var SYNC_WINDOW_DAYS = 90;
 var SYNC_MAX_PAGES_PER_CHANNEL = 10;

 // skills-ts-out/slack/api/slack.js
 async function slackApiFetch(method, endpoint, params) {
  const s = globalThis.getSlackSkillState();
  const token = s.config.botToken;
  if (!token) {
   throw new Error("Slack not connected. Please complete setup first.");
  }
  const url = endpoint.startsWith("http") ? endpoint : `${SLACK_BASE_URL}${endpoint}`;
  const isGet = method.toUpperCase() === "GET";
  let fullUrl = url;
  let body;
  if (isGet && params && Object.keys(params).length > 0) {
   const pairs = [];
   for (const [k, v] of Object.entries(params)) {
    if (v !== void 0 && v !== null) {
     pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
    }
   }
   fullUrl = `${url}?${pairs.join("&")}`;
  } else if (!isGet && params) {
   body = JSON.stringify(params);
  }
  const response = await net.fetch(fullUrl, {
   method: method.toUpperCase(),
   headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
   body,
   timeout: SLACK_REQUEST_TIMEOUT
  });
  if (response.status === 429) {
   throw new Error("Slack rate limited. Please try again in a moment.");
  }
  const parsed = JSON.parse(await response.body);
  if (!parsed.ok && response.status >= 400) {
   const err = parsed.error;
   throw new Error(err || `Slack API error: ${response.status}`);
  }
  return parsed;
 }
 function formatApiError(error) {
  const message = String(error);
  if (message.includes("401") || message.includes("invalid_auth")) {
   return "Invalid or expired token. Check your Slack app settings.";
  }
  if (message.includes("429")) {
   return "Rate limited. Please try again in a moment.";
  }
  if (message.includes("channel_not_found") || message.includes("not_in_channel")) {
   return "Channel not found or bot is not in the channel.";
  }
  return message;
 }
 globalThis.slackApi = { slackApiFetch, formatApiError };

 // skills-ts-out/slack/db/helpers.js
 function insertMessage(channelId, userId, ts, text, type, subtype, eventType, threadTs, createdAt, blocksJson, attachmentsJson) {
  db.exec(`INSERT OR IGNORE INTO slack_messages (channel_id, user_id, ts, text, type, subtype, event_type, thread_ts, created_at, blocks_json, attachments_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
   channelId,
   userId,
   ts,
   text,
   type,
   subtype,
   eventType,
   threadTs,
   createdAt,
   blocksJson,
   attachmentsJson
  ]);
 }
 function deleteOlderThan(tsThreshold) {
  db.exec("DELETE FROM slack_messages WHERE ts < ?", [tsThreshold]);
 }
 globalThis.slackDb = { insertMessage, deleteOlderThan };

 // skills-ts-out/slack/db/schema.js
 function initializeSchema() {
  db.exec(`CREATE TABLE IF NOT EXISTS slack_messages (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   channel_id TEXT NOT NULL,
   user_id TEXT,
   ts TEXT NOT NULL,
   text TEXT,
   type TEXT,
   subtype TEXT,
   event_type TEXT,
   thread_ts TEXT,
   created_at TEXT NOT NULL,
   blocks_json TEXT,
   attachments_json TEXT,
   UNIQUE(channel_id, ts)
  )`, []);
  try {
   db.exec("ALTER TABLE slack_messages ADD COLUMN blocks_json TEXT");
  } catch {
  }
  try {
   db.exec("ALTER TABLE slack_messages ADD COLUMN attachments_json TEXT");
  } catch {
  }
 }
 globalThis.initializeSlackSchema = initializeSchema;

 // skills-ts-out/slack/setup.js
 async function onSetupStart() {
  return {
   step: {
    id: "bot_token",
    title: "Connect Slack",
    description: "Enter your Slack Bot User OAuth Token (xoxb-...). Create an app at https://api.slack.com/apps and install it to your workspace. Find the token under OAuth & Permissions > Bot User OAuth Token.",
    fields: [
     {
      name: "bot_token",
      type: "password",
      label: "Bot Token",
      description: "Your Slack bot token (starts with xoxb-)",
      required: true,
      placeholder: "xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
     }
    ]
   }
  };
 }
 async function onSetupSubmit(args) {
  const { stepId, values } = args;
  if (stepId !== "bot_token") {
   return { status: "error", errors: [{ field: "", message: `Unknown setup step: ${stepId}` }] };
  }
  const rawToken = (values.bot_token ?? "").trim();
  if (!rawToken) {
   return { status: "error", errors: [{ field: "bot_token", message: "Bot token is required" }] };
  }
  if (!rawToken.startsWith("xoxb-")) {
   return {
    status: "error",
    errors: [
     {
      field: "bot_token",
      message: "Bot token should start with 'xoxb-'. Check your Slack app settings."
     }
    ]
   };
  }
  try {
   const response = await net.fetch(`${SLACK_BASE_URL}/auth.test`, {
    method: "GET",
    headers: { Authorization: `Bearer ${rawToken}`, "Content-Type": "application/json" },
    timeout: 15e3
   });
   if (response.status !== 200) {
    const responseBody = await response.body;
    return {
     status: "error",
     errors: [{ field: "bot_token", message: `Slack API error: ${responseBody}` }]
    };
   }
   const auth = JSON.parse(await response.body);
   if (!auth.ok) {
    const err = auth.error || "invalid_auth";
    return {
     status: "error",
     errors: [
      {
       field: "bot_token",
       message: err === "invalid_auth" ? "Invalid bot token. Please check your token." : `Slack error: ${err}`
      }
     ]
    };
   }
   const workspaceName = auth.team || auth.url || "";
   const s = globalThis.getSlackSkillState();
   s.config.botToken = rawToken;
   s.config.workspaceName = workspaceName;
   state.set("config", s.config);
   data.write("config.json", JSON.stringify({ workspaceName }, null, 2));
   console.log(`[slack] Setup complete \u2014 connected to ${workspaceName || "workspace"}`);
   globalThis.slackPublishState();
   return { status: "complete" };
  } catch (e) {
   return {
    status: "error",
    errors: [
     {
      field: "bot_token",
      message: `Failed to connect: ${globalThis.slackApi.formatApiError(e)}`
     }
    ]
   };
  }
 }
 async function onSetupCancel() {
  console.log("[slack] Setup cancelled");
 }
 globalThis.slackSetup = { onSetupStart, onSetupSubmit, onSetupCancel };

 // skills-ts-out/slack/state.js
 var skillState = {
  config: { botToken: "", workspaceName: "", syncIntervalMinutes: 20 },
  syncInProgress: false,
  lastSyncTime: 0,
  lastSyncChannels: 0,
  lastSyncMessages: 0,
  lastSyncedLatestPerChannel: {}
 };
 globalThis.__slackSkillState = skillState;
 globalThis.getSlackSkillState = function getSlackSkillState() {
  return globalThis.__slackSkillState;
 };

 // skills-ts-out/slack/sync.js
 function slackTsDaysAgo(days) {
  const sec = Math.floor(Date.now() / 1e3) - days * 24 * 3600;
  return `${sec}.000000`;
 }
 async function performSync() {
  const s = globalThis.getSlackSkillState();
  if (!s.config.botToken) {
   return;
  }
  if (s.syncInProgress) {
   console.log("[slack] Sync already in progress, skipping");
   return;
  }
  s.syncInProgress = true;
  globalThis.slackPublishState();
  const oldest90Str = slackTsDaysAgo(SYNC_WINDOW_DAYS);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
   const seen = /* @__PURE__ */ new Set();
   const listAllChannels = async (types) => {
    try {
     let cursor;
     do {
      const params = { types, exclude_archived: true, limit: 200 };
      if (cursor)
       params.cursor = cursor;
      const listResult = await globalThis.slackApi.slackApiFetch("GET", "/conversations.list", params);
      const raw = listResult.channels || [];
      for (const ch of raw) {
       const id = ch.id;
       if (id)
        seen.add(id);
      }
      const meta = listResult.response_metadata;
      cursor = meta?.next_cursor;
     } while (cursor && seen.size < SYNC_MAX_CHANNELS);
    } catch (e) {
     if (types.includes("im") || types.includes("mpim")) {
      console.log("[slack] Could not list DMs/group DMs (add OAuth scopes im:read and mpim:read, then reinstall the app).");
     } else {
      console.warn("[slack] conversations.list failed:", e);
     }
    }
   };
   await listAllChannels("public_channel,private_channel");
   await listAllChannels("mpim,im");
   const channelIds = Array.from(seen).slice(0, SYNC_MAX_CHANNELS);
   if (channelIds.length === 0) {
    console.log("[slack] No channels found. Add the bot to channels in Slack, or for DMs/group DMs add OAuth scopes im:read and mpim:read and reinstall the app.");
   }
   let totalStored = 0;
   let loggedZeroHint = false;
   for (const channelId of channelIds) {
    const oldestForChannel = s.lastSyncedLatestPerChannel[channelId] ?? oldest90Str;
    let cursor = null;
    let pagesThisChannel = 0;
    let newestTs = null;
    while (pagesThisChannel < SYNC_MAX_PAGES_PER_CHANNEL) {
     const params = {
      channel: channelId,
      oldest: oldestForChannel,
      limit: 200
     };
     if (cursor)
      params.cursor = cursor;
     const historyResult = await globalThis.slackApi.slackApiFetch("GET", "/conversations.history", params);
     const messages = historyResult.messages || [];
     let storedThisPage = 0;
     for (const msg of messages) {
      const ts = msg.ts;
      const tsStr = typeof ts === "number" ? String(ts) : ts;
      if (!tsStr)
       continue;
      if (!newestTs || tsStr > newestTs)
       newestTs = tsStr;
      const userId = msg.user;
      const displayText = globalThis.getMessageDisplayText;
      const text = typeof displayText === "function" ? displayText(msg) : msg.text ?? "";
      const type = msg.type ?? "message";
      const subtype = msg.subtype ?? null;
      const threadTs = msg.thread_ts ?? null;
      const blocksJson = msg.blocks ? JSON.stringify(msg.blocks) : null;
      const attachmentsJson = msg.attachments ? JSON.stringify(msg.attachments) : null;
      globalThis.slackDb.insertMessage(channelId, userId ?? null, tsStr, text, type, subtype, "message", threadTs, now, blocksJson, attachmentsJson);
      totalStored++;
      storedThisPage++;
     }
     if (messages.length > 0 || pagesThisChannel === 0) {
      const pageLabel = pagesThisChannel > 0 ? ` (page ${pagesThisChannel + 1})` : "";
      console.log(`[slack] Channel ${channelId}: ${messages.length} from API, ${storedThisPage} stored for this channel${pageLabel} (total so far: ${totalStored})`);
      if (messages.length === 0 && pagesThisChannel === 0 && !loggedZeroHint) {
       console.log(`[slack] Hint: If the channel has messages, ensure the bot has OAuth scopes channels:history (public) and groups:history (private).`);
       loggedZeroHint = true;
      }
     }
     pagesThisChannel++;
     const meta = historyResult.response_metadata;
     const nextCursor = meta?.next_cursor;
     if (!nextCursor)
      break;
     cursor = nextCursor;
    }
    if (newestTs) {
     s.lastSyncedLatestPerChannel[channelId] = newestTs;
    }
   }
   globalThis.slackDb.deleteOlderThan(oldest90Str);
   s.lastSyncTime = Date.now();
   s.lastSyncChannels = channelIds.length;
   s.lastSyncMessages = totalStored;
   state.set("lastSyncTime", s.lastSyncTime);
   state.set("lastSyncedLatestPerChannel", s.lastSyncedLatestPerChannel);
   console.log(`[slack] Sync completed: ${channelIds.length} channels, ${totalStored} messages stored in total; trimmed to last ${SYNC_WINDOW_DAYS} days`);
  } catch (e) {
   console.error("[slack] Sync failed:", e);
  } finally {
   s.syncInProgress = false;
   globalThis.slackPublishState();
  }
 }
 globalThis.slackSync = { performSync };

 // skills-ts-out/slack/tools/list-channels.js
 var listChannelsTool = {
  name: "list_channels",
  description: "List Slack channels (public and optionally private) so the agent can choose where to read or send messages.",
  input_schema: {
   type: "object",
   properties: {
    include_private: {
     type: "boolean",
     description: "Include private channels (default false).",
     default: false
    },
    include_archived: {
     type: "boolean",
     description: "Include archived channels (default false).",
     default: false
    },
    limit: {
     type: "number",
     description: "Maximum number of channels to return (default 50).",
     default: 50
    }
   },
   required: []
  },
  async execute(args) {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   try {
    const includePrivate = !!args.include_private;
    const excludeArchived = !args.include_archived;
    const limit = Math.min(Number(args.limit) || 50, 200);
    const types = includePrivate ? "public_channel,private_channel" : "public_channel";
    const slackFetch = globalThis.slackApiFetch;
    const result = slackFetch("GET", "/conversations.list", {
     types,
     exclude_archived: excludeArchived,
     limit
    });
    const rawChannels = result.channels || [];
    const channels = rawChannels.slice(0, limit).map((ch) => ({
     id: ch.id,
     name: ch.name,
     is_private: ch.is_private,
     is_archived: ch.is_archived,
     topic: ch.topic?.value ?? "",
     purpose: ch.purpose?.value ?? "",
     num_members: ch.num_members
    }));
    return JSON.stringify({ ok: true, channels });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/tools/get-channel.js
 var getChannelTool = {
  name: "get_channel",
  description: "Get detailed information about a Slack channel (name, topic, member count, etc.).",
  input_schema: {
   type: "object",
   properties: {
    channel_id: { type: "string", description: "The channel ID (e.g. C1234567890)." }
   },
   required: ["channel_id"]
  },
  async execute(args) {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   const channelId = args.channel_id;
   if (!channelId || typeof channelId !== "string") {
    return JSON.stringify({ ok: false, error: "channel_id is required." });
   }
   try {
    const slackFetch = globalThis.slackApiFetch;
    const result = slackFetch("GET", "/conversations.info", { channel: channelId });
    const ch = result.channel;
    if (!ch) {
     return JSON.stringify({ ok: false, error: "Channel not found." });
    }
    const info = {
     id: ch.id,
     name: ch.name,
     is_private: ch.is_private,
     is_archived: ch.is_archived,
     topic: ch.topic?.value ?? "",
     purpose: ch.purpose?.value ?? "",
     num_members: ch.num_members,
     created: ch.created
    };
    return JSON.stringify({ ok: true, channel: info });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/tools/get-messages.js
 var getMessagesTool = {
  name: "get_messages",
  description: "Get messages from a Slack channel or DM. Reads from the skill DB (populated by sync). Use refresh_from_slack to fetch latest from Slack API and update the DB (avoids rate limits by default).",
  input_schema: {
   type: "object",
   properties: {
    channel_id: {
     type: "string",
     description: "The channel or DM ID (e.g. C1234567890 or D1234567890)."
    },
    limit: {
     type: "number",
     description: "Maximum number of messages to return (default 50, max 200).",
     default: 50
    },
    oldest: {
     type: "string",
     description: "Optional Slack timestamp \u2014 only messages after this time (DB filter)."
    },
    latest: {
     type: "string",
     description: "Optional Slack timestamp \u2014 only messages before this time (DB filter)."
    },
    refresh_from_slack: {
     type: "boolean",
     description: "If true, fetch latest from Slack API and merge into DB, then return from DB. Default false to avoid rate limits.",
     default: false
    }
   },
   required: ["channel_id"]
  },
  async execute(args) {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   const channelId = args.channel_id;
   if (!channelId || typeof channelId !== "string") {
    return JSON.stringify({ ok: false, error: "channel_id is required." });
   }
   const limit = Math.min(Number(args.limit) || 50, 200);
   const refreshFromSlack = !!args.refresh_from_slack;
   try {
    if (refreshFromSlack) {
     const slackFetch = globalThis.slackApiFetch;
     const params = { channel: channelId, limit: 200 };
     const result = slackFetch("GET", "/conversations.history", params);
     const rawMessages = result.messages || [];
     const now = (/* @__PURE__ */ new Date()).toISOString();
     for (const msg of rawMessages) {
      const ts = msg.ts;
      const tsStr = typeof ts === "number" ? String(ts) : ts;
      if (!tsStr)
       continue;
      const userId = msg.user;
      const getDisplayText = globalThis.getMessageDisplayText;
      const displayText = typeof getDisplayText === "function" ? getDisplayText(msg) : msg.text ?? "";
      const type = msg.type ?? "message";
      const subtype = msg.subtype ?? null;
      const threadTs = msg.thread_ts ?? null;
      const blocksJson = msg.blocks ? JSON.stringify(msg.blocks) : null;
      const attachmentsJson = msg.attachments ? JSON.stringify(msg.attachments) : null;
      try {
       db.exec(`INSERT OR IGNORE INTO slack_messages (channel_id, user_id, ts, text, type, subtype, event_type, thread_ts, created_at, blocks_json, attachments_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        channelId,
        userId ?? null,
        tsStr,
        displayText,
        type,
        subtype,
        "message",
        threadTs,
        now,
        blocksJson,
        attachmentsJson
       ]);
      } catch {
      }
     }
    }
    const conditions = ["channel_id = ?"];
    const queryParams = [channelId];
    if (args.oldest) {
     conditions.push("ts >= ?");
     queryParams.push(args.oldest);
    }
    if (args.latest) {
     conditions.push("ts <= ?");
     queryParams.push(args.latest);
    }
    queryParams.push(limit);
    const rows = db.all(`SELECT user_id, ts, text, type, subtype, thread_ts, blocks_json, attachments_json FROM slack_messages
    WHERE ${conditions.join(" AND ")} ORDER BY ts DESC LIMIT ?`, queryParams);
    const messages = rows.map((row) => {
     let blocks = null;
     let attachments = null;
     try {
      if (row.blocks_json && typeof row.blocks_json === "string")
       blocks = JSON.parse(row.blocks_json);
     } catch {
     }
     try {
      if (row.attachments_json && typeof row.attachments_json === "string")
       attachments = JSON.parse(row.attachments_json);
     } catch {
     }
     return {
      ts: row.ts,
      user: row.user_id,
      text: row.text,
      type: row.type,
      subtype: row.subtype,
      thread_ts: row.thread_ts,
      blocks: blocks ?? void 0,
      attachments: attachments ?? void 0
     };
    });
    return JSON.stringify({
     ok: true,
     messages,
     source: refreshFromSlack ? "slack_then_db" : "db"
    });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/tools/send-message.js
 var sendMessageTool = {
  name: "send_message",
  description: "Send a message to a Slack channel or DM. Optionally reply in a thread.",
  input_schema: {
   type: "object",
   properties: {
    channel_id: { type: "string", description: "The channel or DM ID to send the message to." },
    text: { type: "string", description: "The message text to send." },
    thread_ts: {
     type: "string",
     description: "Optional Slack timestamp of a message to reply to (thread)."
    }
   },
   required: ["channel_id", "text"]
  },
  async execute(args) {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   const channelId = args.channel_id;
   const text = args.text ?? "";
   if (!channelId || typeof channelId !== "string") {
    return JSON.stringify({ ok: false, error: "channel_id is required." });
   }
   if (!text || typeof text !== "string") {
    return JSON.stringify({ ok: false, error: "text is required." });
   }
   try {
    const body = { channel: channelId, text };
    if (args.thread_ts && typeof args.thread_ts === "string") {
     body.thread_ts = args.thread_ts;
    }
    const slackFetch = globalThis.slackApiFetch;
    const result = slackFetch("POST", "/chat.postMessage", body);
    const message = result.message;
    return JSON.stringify({
     ok: true,
     ts: message?.ts,
     channel: message?.channel ?? channelId,
     text: message?.text ?? text
    });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/tools/open-dm.js
 var openDmTool = {
  name: "open_dm",
  description: "Open or get the DM channel ID for a Slack user. Use the returned channel_id with send_message or get_messages.",
  input_schema: {
   type: "object",
   properties: {
    user_id: { type: "string", description: "The Slack user ID (e.g. U1234567890)." }
   },
   required: ["user_id"]
  },
  async execute(args) {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   const userId = args.user_id;
   if (!userId || typeof userId !== "string") {
    return JSON.stringify({ ok: false, error: "user_id is required." });
   }
   try {
    const slackFetch = globalThis.slackApiFetch;
    const result = slackFetch("POST", "/conversations.open", { users: userId });
    const channel = result.channel;
    const channelId = channel?.id;
    if (!channelId) {
     return JSON.stringify({ ok: false, error: "Could not open DM channel." });
    }
    return JSON.stringify({ ok: true, channel_id: channelId, user_id: userId });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/tools/sync-now.js
 var syncNowTool = {
  name: "sync_now",
  description: "Trigger an immediate sync of Slack channels and their recent messages into the skill database. Use this to refresh stored messages on demand. The skill also runs a periodic sync every 20 minutes.",
  input_schema: { type: "object", properties: {}, required: [] },
  async execute() {
   const config = state.get("config");
   if (!config?.botToken) {
    return JSON.stringify({ ok: false, error: "Slack not connected. Complete setup first." });
   }
   const getStatus = globalThis.getSlackSyncStatus;
   const status = getStatus?.();
   if (status?.syncInProgress) {
    return JSON.stringify({
     ok: false,
     sync_in_progress: true,
     message: "Sync already in progress. Try again in a moment.",
     last_sync_time: status.lastSyncTime > 0 ? new Date(status.lastSyncTime).toISOString() : null
    });
   }
   const performSync2 = globalThis.performSlackSync;
   if (typeof performSync2 !== "function") {
    return JSON.stringify({ ok: false, error: "Sync not available." });
   }
   try {
    performSync2();
    const after = getStatus?.();
    return JSON.stringify({
     ok: true,
     message: "Sync completed.",
     last_sync_time: after?.lastSyncTime ? new Date(after.lastSyncTime).toISOString() : null,
     channels_synced: after?.lastSyncChannels ?? 0,
     messages_stored: after?.lastSyncMessages ?? 0
    });
   } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
   }
  }
 };

 // skills-ts-out/slack/update-handlers.js
 async function onServerEvent(event, payload) {
  if (event !== "slack") {
   return;
  }
  const envelope = payload;
  if (!envelope || typeof envelope !== "object") {
   return;
  }
  const eventPayload = envelope.event;
  if (!eventPayload || typeof eventPayload !== "object") {
   return;
  }
  const eventType = eventPayload.type;
  if (eventType !== "message" && eventType !== "app_mention") {
   return;
  }
  const channelId = eventPayload.channel;
  const ts = eventPayload.ts;
  if (!channelId || !ts) {
   return;
  }
  const userId = eventPayload.user;
  const getDisplayText = globalThis.getMessageDisplayText;
  const displayText = typeof getDisplayText === "function" ? getDisplayText(eventPayload) : eventPayload.text ?? "";
  const type = eventPayload.type ?? "message";
  const subtype = eventPayload.subtype;
  const threadTs = eventPayload.thread_ts;
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const blocksJson = eventPayload.blocks ? JSON.stringify(eventPayload.blocks) : null;
  const attachmentsJson = eventPayload.attachments ? JSON.stringify(eventPayload.attachments) : null;
  try {
   globalThis.slackDb.insertMessage(channelId, userId ?? null, ts, displayText, type, subtype ?? null, eventType, threadTs ?? null, createdAt, blocksJson, attachmentsJson);
   state.setPartial({ last_event_at: createdAt });
  } catch (e) {
   console.error("[slack] Failed to store event:", e);
  }
 }
 globalThis.slackUpdateHandlers = { onServerEvent };

 // skills-ts-out/slack/index.js
 function getMessageDisplayText(msg) {
  const text = msg.text ?? "";
  if (text.trim())
   return text;
  if (Array.isArray(msg.blocks)) {
   const parts = [];
   for (const block of msg.blocks) {
    if (!block || typeof block !== "object")
     continue;
    const b = block;
    if (b.text && typeof b.text === "object" && b.text !== null && "text" in b.text) {
     const t = b.text.text;
     if (typeof t === "string" && t.trim())
      parts.push(t.trim());
    }
    if (b.elements && Array.isArray(b.elements)) {
     for (const el of b.elements) {
      if (el && typeof el === "object" && "text" in el) {
       const t = el.text;
       if (typeof t === "string" && t.trim())
        parts.push(t.trim());
      }
     }
    }
   }
   if (parts.length > 0)
    return parts.join(" ");
  }
  if (Array.isArray(msg.attachments)) {
   const parts = [];
   for (const a of msg.attachments) {
    if (!a || typeof a !== "object")
     continue;
    const at = a;
    for (const key of ["fallback", "pretext", "title", "text"]) {
     const v = at[key];
     if (typeof v === "string" && v.trim())
      parts.push(v.trim());
    }
   }
   if (parts.length > 0)
    return parts.join(" ");
  }
  return "";
 }
 async function init() {
  console.log("[slack] Initializing");
  globalThis.initializeSlackSchema();
  const s = globalThis.getSlackSkillState();
  const saved = state.get("config");
  if (saved) {
   s.config.botToken = saved.botToken ?? "";
   s.config.workspaceName = saved.workspaceName ?? "";
   s.config.syncIntervalMinutes = typeof saved.syncIntervalMinutes === "number" ? saved.syncIntervalMinutes : 20;
  }
  const savedLastSync = state.get("lastSyncTime");
  if (savedLastSync && typeof savedLastSync === "number") {
   s.lastSyncTime = savedLastSync;
  }
  const savedPerChannel = state.get("lastSyncedLatestPerChannel");
  if (savedPerChannel && typeof savedPerChannel === "object") {
   s.lastSyncedLatestPerChannel = { ...savedPerChannel };
  }
  if (s.config.botToken) {
   console.log(`[slack] Connected to workspace: ${s.config.workspaceName || "(unnamed)"}`);
  } else {
   console.log("[slack] No bot token configured \u2014 waiting for setup");
  }
  publishState();
 }
 async function start() {
  const s = globalThis.getSlackSkillState();
  if (!s.config.botToken) {
   console.log("[slack] No bot token \u2014 skill inactive until setup completes");
   return;
  }
  const mins = s.config.syncIntervalMinutes;
  const cronExpr = `0 */${mins} * * * *`;
  cron.register("slack-sync", cronExpr);
  console.log(`[slack] Started \u2014 sync every ${mins} minutes`);
  const tenMinsMs = 10 * 60 * 1e3;
  if (s.lastSyncTime === 0 || Date.now() - s.lastSyncTime > tenMinsMs) {
   globalThis.slackSync.performSync();
  } else {
   console.log("[slack] Skipping initial sync (last sync was within 10 minutes)");
  }
  publishState();
 }
 async function stop() {
  const s = globalThis.getSlackSkillState();
  cron.unregister("slack-sync");
  state.set("config", s.config);
  state.set("lastSyncTime", s.lastSyncTime);
  state.set("lastSyncedLatestPerChannel", s.lastSyncedLatestPerChannel);
  console.log("[slack] Stopped");
  state.set("status", "stopped");
  publishState();
 }
 async function onCronTrigger(scheduleId) {
  if (scheduleId === "slack-sync") {
   globalThis.slackSync.performSync();
  }
 }
 async function publishState() {
  const s = globalThis.getSlackSkillState();
  state.setPartial({
   connected: !!s.config.botToken,
   workspaceName: s.config.workspaceName || null,
   lastSyncTime: s.lastSyncTime > 0 ? s.lastSyncTime : null,
   syncInProgress: s.syncInProgress
  });
 }
 var _g = globalThis;
 _g.getMessageDisplayText = getMessageDisplayText;
 _g.slackApiFetch = globalThis.slackApi.slackApiFetch;
 _g.performSlackSync = globalThis.slackSync.performSync;
 _g.slackPublishState = publishState;
 _g.getSlackSyncStatus = function() {
  const s = globalThis.getSlackSkillState();
  return {
   lastSyncTime: s.lastSyncTime,
   syncInProgress: s.syncInProgress,
   lastSyncChannels: s.lastSyncChannels,
   lastSyncMessages: s.lastSyncMessages
  };
 };
 var tools = [
  listChannelsTool,
  getMessagesTool,
  sendMessageTool,
  getChannelTool,
  openDmTool,
  syncNowTool
 ];
 var skill = {
  info: {
   id: "slack",
   name: "Slack",
   version: "1.0.0",
   description: "Full-fledged Slack bot: read and send messages, receive real-time events, periodic sync to DB, and store all messages in the skill DB.",
   auto_start: false,
   setup: { required: true, label: "Connect Slack" }
  },
  tools,
  init,
  start,
  stop,
  onCronTrigger,
  onSetupStart: globalThis.slackSetup.onSetupStart,
  onSetupSubmit: globalThis.slackSetup.onSetupSubmit,
  onSetupCancel: globalThis.slackSetup.onSetupCancel,
  onServerEvent: globalThis.slackUpdateHandlers.onServerEvent
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
