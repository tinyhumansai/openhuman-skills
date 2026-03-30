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

 // skills-ts-out/google-calendar/index.js
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

 // skills-ts-out/google-calendar/api/calendar.js
 async function calendarFetch(endpoint, options = {}) {
  if (!oauth.getCredential()) {
   return {
    success: false,
    error: { code: 401, message: "Google Calendar not connected. Complete OAuth setup first." }
   };
  }
  try {
   const response = await oauth.fetch(endpoint, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...options.headers || {} },
    body: options.body,
    timeout: options.timeout || 30
   });
   const s = globalThis.getGoogleCalendarSkillState();
   if (response.headers["x-ratelimit-remaining"]) {
    s.rateLimitRemaining = parseInt(response.headers["x-ratelimit-remaining"], 10);
   }
   if (response.headers["x-ratelimit-reset"]) {
    s.rateLimitReset = parseInt(response.headers["x-ratelimit-reset"], 10) * 1e3;
   }
   if (response.status >= 200 && response.status < 300) {
    const data = response.body ? JSON.parse(response.body) : null;
    s.lastApiError = null;
    return { success: true, data };
   }
   const error = response.body ? JSON.parse(response.body) : { code: response.status, message: "API request failed" };
   s.lastApiError = error.message || `HTTP ${response.status}`;
   return { success: false, error: { code: response.status, message: s.lastApiError } };
  } catch (err) {
   const errorMsg = err instanceof Error ? err.message : String(err);
   const s = globalThis.getGoogleCalendarSkillState();
   s.lastApiError = errorMsg;
   return { success: false, error: { code: 500, message: errorMsg } };
  }
 }
 globalThis.googleCalendarApi = { calendarFetch };

 // skills-ts-out/google-calendar/state.js
 function initGoogleCalendarSkillState() {
  const state2 = {
   config: { credentialId: "", userEmail: "" },
   activeSessions: [],
   rateLimitRemaining: 250,
   rateLimitReset: Date.now() + 36e5,
   lastApiError: null,
   syncInProgress: false,
   lastSyncTime: null,
   lastSyncedCalendars: 0
  };
  globalThis.__googleCalendarSkillState = state2;
  return state2;
 }
 initGoogleCalendarSkillState();
 globalThis.getGoogleCalendarSkillState = function getGoogleCalendarSkillState() {
  const state2 = globalThis.__googleCalendarSkillState;
  if (!state2) {
   throw new Error("[google-calendar] Skill state not initialized");
  }
  return state2;
 };

 // skills-ts-out/google-calendar/db/helpers.js
 var CALENDAR_LIST_SYNC_KEY = "calendarListSyncToken";
 var EVENTS_SYNC_PREFIX = "eventsSyncToken:";
 var LAST_REQUEST_PREFIX = "lastRequestedRange:";
 function toBooleanFlag(value) {
  return value ? 1 : 0;
 }
 function normalizeDateTime(dt) {
  const dateValue = dt.dateTime || dt.date || "";
  const iso = dateValue;
  const ts = Number.isFinite(Date.parse(dateValue)) ? Date.parse(dateValue) : Date.now();
  return { iso, ts, json: JSON.stringify(dt) };
 }
 function upsertCalendars(calendars) {
  db.exec("BEGIN", []);
  try {
   for (const calendar of calendars) {
    db.exec(`INSERT INTO calendars (
     id, summary, description, time_zone, primary_flag, access_role,
     background_color, foreground_color, hidden, selected, writable,
     color_id, etag, conference_properties_json, updated, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
     summary = excluded.summary,
     description = excluded.description,
     time_zone = excluded.time_zone,
     primary_flag = excluded.primary_flag,
     access_role = excluded.access_role,
     background_color = excluded.background_color,
     foreground_color = excluded.foreground_color,
     hidden = excluded.hidden,
     selected = excluded.selected,
     writable = excluded.writable,
     color_id = excluded.color_id,
     etag = excluded.etag,
     conference_properties_json = excluded.conference_properties_json,
     updated = excluded.updated,
     raw_json = excluded.raw_json`, [
     calendar.id,
     calendar.summary || calendar.id,
     calendar.description || null,
     calendar.timeZone || null,
     toBooleanFlag(calendar.primary),
     calendar.accessRole || "reader",
     calendar.backgroundColor || null,
     calendar.foregroundColor || null,
     toBooleanFlag(calendar.hidden),
     toBooleanFlag(calendar.selected),
     toBooleanFlag(calendar.writable),
     calendar.colorId || null,
     calendar.etag || null,
     calendar.conferenceProperties ? JSON.stringify(calendar.conferenceProperties) : null,
     calendar.updated || null,
     JSON.stringify(calendar)
    ]);
   }
   db.exec("COMMIT", []);
  } catch (err) {
   db.exec("ROLLBACK", []);
   throw err;
  }
 }
 function getCalendars(options = {}) {
  const where = options.includeHidden ? "1=1" : "hidden = 0";
  return db.all(`SELECT * FROM calendars WHERE ${where} ORDER BY primary_flag DESC, summary ASC`, []);
 }
 function bulkUpsertEvents(calendarId, events) {
  const now = Date.now();
  db.exec("BEGIN", []);
  try {
   for (const event of events) {
    const start2 = normalizeDateTime(event.start);
    const end = normalizeDateTime(event.end);
    db.exec(`INSERT INTO events (
     calendar_id, id, summary, description, location, status, html_link,
     start_time, end_time, start_ts, end_ts, start_json, end_json,
     attendees_json, created, updated,
     recurring_event_id, recurrence_json, sequence, raw_json, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(calendar_id, id) DO UPDATE SET
     calendar_id = excluded.calendar_id,
     summary = excluded.summary,
     description = excluded.description,
     location = excluded.location,
     status = excluded.status,
     html_link = excluded.html_link,
     start_time = excluded.start_time,
     end_time = excluded.end_time,
     start_ts = excluded.start_ts,
     end_ts = excluded.end_ts,
     start_json = excluded.start_json,
     end_json = excluded.end_json,
     attendees_json = COALESCE(excluded.attendees_json, events.attendees_json),
     created = COALESCE(excluded.created, events.created),
     updated = COALESCE(excluded.updated, events.updated),
     recurring_event_id = excluded.recurring_event_id,
     recurrence_json = COALESCE(excluded.recurrence_json, events.recurrence_json),
     sequence = COALESCE(excluded.sequence, events.sequence),
     raw_json = excluded.raw_json,
     synced_at = excluded.synced_at
    WHERE events.updated IS NULL OR excluded.updated IS NULL OR excluded.updated >= events.updated`, [
     calendarId,
     event.id,
     event.summary || null,
     event.description || null,
     event.location || null,
     event.status || null,
     event.htmlLink || null,
     start2.iso,
     end.iso,
     start2.ts,
     end.ts,
     start2.json,
     end.json,
     event.attendees ? JSON.stringify(event.attendees) : null,
     event.created || null,
     event.updated || null,
     event.recurringEventId || null,
     event.recurrence ? JSON.stringify(event.recurrence) : null,
     typeof event.sequence === "number" ? event.sequence : null,
     JSON.stringify(event),
     now
    ]);
   }
   db.exec("COMMIT", []);
  } catch (err) {
   db.exec("ROLLBACK", []);
   throw err;
  }
 }
 function toTimestamp(value) {
  if (!value)
   return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
 }
 function getEventsForCalendar(options) {
  const params = [options.calendarId];
  let sql = "SELECT * FROM events WHERE calendar_id = ?";
  const minTs = toTimestamp(options.timeMin);
  if (minTs != null) {
   sql += " AND end_ts >= ?";
   params.push(minTs);
  }
  const maxTs = toTimestamp(options.timeMax);
  if (maxTs != null) {
   sql += " AND start_ts <= ?";
   params.push(maxTs);
  }
  sql += " ORDER BY start_ts ASC";
  if (options.limit) {
   sql += " LIMIT ?";
   params.push(options.limit);
  }
  return db.all(sql, params);
 }
 function listCalendarsNeedingSync(limit, staleBeforeMs) {
  const calendars = getCalendars({ includeHidden: true });
  const ranked = calendars.map((cal) => {
   const meta = getCalendarSyncMeta(cal.id);
   return { cal, lastFullSync: meta.lastFullSync ?? 0 };
  }).filter((item) => item.lastFullSync < staleBeforeMs).sort((a, b) => (a.lastFullSync || 0) - (b.lastFullSync || 0)).slice(0, limit).map((item) => item.cal);
  return ranked;
 }
 function getCalendarMetaKey(calendarId) {
  return `calendarMeta:${calendarId}`;
 }
 function getCalendarSyncMeta(calendarId) {
  const raw = getSyncState(getCalendarMetaKey(calendarId));
  if (!raw)
   return {};
  try {
   return JSON.parse(raw);
  } catch {
   return {};
  }
 }
 function markCalendarSynced(calendarId, options) {
  const prev = getCalendarSyncMeta(calendarId);
  const next = { ...prev, ...options };
  setSyncState(getCalendarMetaKey(calendarId), JSON.stringify(next));
 }
 function deleteEventsBefore(calendarId, cutoffTs) {
  db.exec("DELETE FROM events WHERE calendar_id = ? AND end_ts < ?", [calendarId, cutoffTs]);
 }
 function deleteEvent(calendarId, eventId) {
  db.exec("DELETE FROM events WHERE calendar_id = ? AND id = ?", [calendarId, eventId]);
 }
 function getEventById(calendarId, eventId) {
  return db.get("SELECT * FROM events WHERE calendar_id = ? AND id = ?", [
   calendarId,
   eventId
  ]);
 }
 function getEventsCoverage(calendarId, startTs, endTs) {
  const row = db.get(`SELECT
    COUNT(*) AS count,
    MIN(start_ts) AS minStart,
    MAX(end_ts) AS maxEnd
  FROM events
  WHERE calendar_id = ?
   AND end_ts >= ?
   AND start_ts <= ?`, [calendarId, startTs, endTs]);
  if (!row) {
   return { hasEvents: false, earliestStart: null, latestEnd: null };
  }
  return { hasEvents: row.count > 0, earliestStart: row.minStart, latestEnd: row.maxEnd };
 }
 function getSyncState(key) {
  const row = db.get("SELECT value FROM sync_state WHERE key = ?", [key]);
  return row ? row.value : null;
 }
 function setSyncState(key, value) {
  db.exec(`INSERT INTO sync_state (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
 }
 function clearSyncState(key) {
  db.exec("DELETE FROM sync_state WHERE key = ?", [key]);
 }
 function getCalendarListSyncToken() {
  return getSyncState(CALENDAR_LIST_SYNC_KEY);
 }
 function setCalendarListSyncToken(token) {
  setSyncState(CALENDAR_LIST_SYNC_KEY, token);
 }
 function getEventsSyncToken(calendarId) {
  return getSyncState(`${EVENTS_SYNC_PREFIX}${calendarId}`);
 }
 function setEventsSyncToken(calendarId, token) {
  setSyncState(`${EVENTS_SYNC_PREFIX}${calendarId}`, token);
 }
 function clearEventsSyncToken(calendarId) {
  clearSyncState(`${EVENTS_SYNC_PREFIX}${calendarId}`);
 }
 function recordRequestedRange(calendarId, startTs, endTs) {
  setSyncState(`${LAST_REQUEST_PREFIX}${calendarId}`, JSON.stringify({ startTs, endTs, at: Date.now() }));
 }
 function getCalendarSyncState(calendarId) {
  const meta = getCalendarSyncMeta(calendarId);
  const lastRangeRaw = getSyncState(`${LAST_REQUEST_PREFIX}${calendarId}`);
  let lastRequestedStart = null;
  let lastRequestedEnd = null;
  if (lastRangeRaw) {
   try {
    const parsed = JSON.parse(lastRangeRaw);
    lastRequestedStart = parsed.startTs ?? null;
    lastRequestedEnd = parsed.endTs ?? null;
   } catch {
    lastRequestedStart = null;
    lastRequestedEnd = null;
   }
  }
  return {
   calendarId,
   eventsSyncToken: getEventsSyncToken(calendarId),
   lastFullSync: meta.lastFullSync ?? null,
   lastRequestedStart,
   lastRequestedEnd
  };
 }
 globalThis.googleCalendarDb = {
  upsertCalendars,
  getCalendars,
  bulkUpsertEvents,
  getEventsForCalendar,
  listCalendarsNeedingSync,
  markCalendarSynced,
  deleteEventsBefore,
  deleteEvent,
  getEventsCoverage,
  getEventById,
  getCalendarListSyncToken,
  setCalendarListSyncToken,
  getEventsSyncToken,
  setEventsSyncToken,
  clearEventsSyncToken,
  getCalendarSyncState,
  recordRequestedRange,
  getCalendarSyncMeta
 };

 // skills-ts-out/google-calendar/db/schema.js
 function initializeGoogleCalendarSchema() {
  console.log("[google-calendar] Initializing database schema...");
  db.exec(`CREATE TABLE IF NOT EXISTS calendars (
   id TEXT PRIMARY KEY,
   summary TEXT NOT NULL,
   description TEXT,
   time_zone TEXT,
   primary_flag INTEGER NOT NULL DEFAULT 0,
   access_role TEXT NOT NULL,
   background_color TEXT,
   foreground_color TEXT,
   hidden INTEGER NOT NULL DEFAULT 0,
   selected INTEGER NOT NULL DEFAULT 0,
   writable INTEGER NOT NULL DEFAULT 0,
   color_id TEXT,
   etag TEXT,
   conference_properties_json TEXT,
   updated TEXT,
   raw_json TEXT
  )`, []);
  console.log("[google-calendar] Calendars table created");
  db.exec(`CREATE TABLE IF NOT EXISTS events (
   calendar_id TEXT NOT NULL,
   id TEXT NOT NULL,
   summary TEXT,
   description TEXT,
   location TEXT,
   status TEXT,
   html_link TEXT,
   start_time TEXT NOT NULL,
   end_time TEXT NOT NULL,
   start_ts INTEGER NOT NULL,
   end_ts INTEGER NOT NULL,
   start_json TEXT NOT NULL,
   end_json TEXT NOT NULL,
   attendees_json TEXT,
   created TEXT,
   updated TEXT,
   recurring_event_id TEXT,
   recurrence_json TEXT,
   sequence INTEGER,
   raw_json TEXT,
   synced_at INTEGER NOT NULL,
   PRIMARY KEY (calendar_id, id)
  )`, []);
  console.log("[google-calendar] Events table created");
  db.exec(`CREATE TABLE IF NOT EXISTS sync_state (
   key TEXT PRIMARY KEY,
   value TEXT NOT NULL
  )`, []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_calendar_time ON events(calendar_id, start_ts)", []);
  db.exec("CREATE INDEX IF NOT EXISTS idx_events_updated ON events(updated)", []);
  console.log("[google-calendar] Database schema initialized");
 }
 globalThis.initializeGoogleCalendarSchema = initializeGoogleCalendarSchema;

 // skills-ts-out/google-calendar/sync.js
 var MAX_CALENDARS_PER_RUN = 10;
 var CALENDAR_STALE_MS = 6 * 60 * 60 * 1e3;
 var EVENTS_WINDOW_DAYS = 30;
 var MAX_EVENTS_RESULTS = 250;
 var MAX_EVENT_PAGES = 5;
 function daysAgoIso(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
  return date.toISOString();
 }
 function getCalendarFetch() {
  return globalThis.calendarFetch ?? null;
 }
 function buildQuery(params) {
  return Object.entries(params).filter(([, value]) => value != null && value !== "").map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
 }
 async function syncCalendarList(forceFull) {
  const calendarFetch2 = getCalendarFetch();
  const db2 = globalThis.googleCalendarDb;
  if (!calendarFetch2 || !db2)
   return;
  let syncToken = forceFull ? null : db2.getCalendarListSyncToken?.() ?? null;
  let nextPageToken;
  let retrying = false;
  do {
   const qs = buildQuery({
    minAccessRole: "reader",
    maxResults: "250",
    pageToken: nextPageToken,
    syncToken
   });
   const path = `/calendar/v3/users/me/calendarList${qs ? `?${qs}` : ""}`;
   const response = await calendarFetch2(path);
   if (!response.success) {
    const code = response.error?.code;
    if ((code === 400 || code === 410) && !retrying) {
     db2.setCalendarListSyncToken?.("");
     syncToken = null;
     nextPageToken = void 0;
     retrying = true;
     continue;
    }
    console.warn("[google-calendar] calendarList sync failed:", response.error?.message || code);
    return;
   }
   const data = response.data;
   if (Array.isArray(data.items) && data.items.length > 0) {
    db2.upsertCalendars?.(data.items);
   }
   if (data.nextSyncToken) {
    db2.setCalendarListSyncToken?.(data.nextSyncToken);
   }
   nextPageToken = data.nextPageToken || void 0;
  } while (nextPageToken);
 }
 async function syncEventsForCalendar(calendarId, forceFull) {
  const calendarFetch2 = getCalendarFetch();
  const db2 = globalThis.googleCalendarDb;
  if (!calendarFetch2 || !db2)
   return;
  let syncToken = !forceFull ? db2.getEventsSyncToken?.(calendarId) ?? null : null;
  let nextPageToken;
  let pages = 0;
  const baseQuery = {
   singleEvents: "true",
   maxResults: String(MAX_EVENTS_RESULTS),
   orderBy: "startTime"
  };
  if (!syncToken) {
   baseQuery.timeMin = daysAgoIso(EVENTS_WINDOW_DAYS);
  }
  let retrying = false;
  do {
   const qs = buildQuery({ ...baseQuery, syncToken, pageToken: nextPageToken });
   const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${qs}`;
   const response = await calendarFetch2(path);
   if (!response.success) {
    const code = response.error?.code;
    if ((code === 400 || code === 410) && !retrying) {
     db2.clearEventsSyncToken?.(calendarId);
     syncToken = null;
     nextPageToken = void 0;
     retrying = true;
     continue;
    }
    if (code === 404) {
     console.warn("[google-calendar] events sync skipped for", calendarId, "\u2014 API returned 404 (likely read-only/holiday calendar)");
     return;
    }
    console.warn("[google-calendar] events sync failed for", calendarId, response.error?.message || code);
    return;
   }
   const data = response.data;
   if (Array.isArray(data.items) && data.items.length > 0) {
    db2.bulkUpsertEvents?.(calendarId, data.items);
   }
   if (data.nextSyncToken) {
    db2.setEventsSyncToken?.(calendarId, data.nextSyncToken);
   }
   nextPageToken = data.nextPageToken || void 0;
   pages += 1;
  } while (nextPageToken && pages < MAX_EVENT_PAGES);
  if (pages >= MAX_EVENT_PAGES && nextPageToken) {
   console.warn("[google-calendar] Events sync truncated for", calendarId, "\u2014 hit MAX_EVENT_PAGES; not marking fully synced or pruning");
   return;
  }
  db2.markCalendarSynced?.(calendarId, {
   lastFullSync: Date.now(),
   nextSyncToken: db2.getEventsSyncToken?.(calendarId) ?? null
  });
  const pruneBefore = Date.now() - EVENTS_WINDOW_DAYS * 24 * 60 * 60 * 1e3;
  db2.deleteEventsBefore?.(calendarId, pruneBefore);
 }
 function publishState() {
  globalThis.publishGoogleCalendarState?.();
 }
 async function performSync(options) {
  if (!oauth.getCredential())
   return;
  const s = globalThis.getGoogleCalendarSkillState();
  if (s.syncInProgress) {
   return;
  }
  s.syncInProgress = true;
  publishState();
  try {
   await syncCalendarList(Boolean(options?.forceFull));
   const db2 = globalThis.googleCalendarDb;
   if (!db2)
    return;
   let calendars;
   if (options?.calendars?.length) {
    calendars = options.calendars;
   } else {
    const staleBefore = Date.now() - CALENDAR_STALE_MS;
    calendars = db2.listCalendarsNeedingSync?.(MAX_CALENDARS_PER_RUN, staleBefore)?.map((c) => c.id) ?? [];
   }
   for (const calendarId of calendars) {
    await syncEventsForCalendar(calendarId, Boolean(options?.forceFull));
   }
   s.lastSyncTime = Date.now();
   s.lastSyncedCalendars = calendars.length;
  } catch (err) {
   console.error("[google-calendar] Sync run failed:", err);
  } finally {
   s.syncInProgress = false;
   publishState();
  }
 }
 globalThis.googleCalendarSync = { performSync };

 // skills-ts-out/google-calendar/tools/list-calendars.js
 var CALENDAR_STALE_MS2 = 6 * 60 * 60 * 1e3;
 var listCalendarsTool = {
  name: "google-calendar-list-calendars",
  description: "List all Google Calendars the user has access to. Returns id, summary, timeZone, primary, and accessRole.",
  input_schema: {
   type: "object",
   properties: {
    show_hidden: { type: "boolean", description: "Include hidden calendars (default: false)" }
   },
   required: []
  },
  async execute(args) {
   try {
    const calendarFetch2 = globalThis.calendarFetch;
    const calendarDb = globalThis.googleCalendarDb;
    const calendarSync = globalThis.googleCalendarSync;
    if (!oauth.getCredential()) {
     return JSON.stringify({
      success: false,
      error: "Google Calendar not connected. Complete OAuth setup first."
     });
    }
    const showHidden = Boolean(args.show_hidden);
    if (!calendarDb || !calendarSync?.performSync) {
     if (!calendarFetch2) {
      return JSON.stringify({ success: false, error: "Calendar API helper not available" });
     }
     const qs = showHidden ? "?showHidden=true" : "";
     const response = await calendarFetch2(`/calendar/v3/users/me/calendarList${qs}`);
     if (!response.success) {
      return JSON.stringify({
       success: false,
       error: response.error?.message || "Failed to list calendars"
      });
     }
     const data = response.data;
     const items = Array.isArray(data.items) ? data.items : [];
     calendarDb?.upsertCalendars?.(items);
     return JSON.stringify({
      success: true,
      calendars: items.map((c) => ({
       id: c.id,
       summary: c.summary,
       description: c.description,
       timeZone: c.timeZone,
       primary: c.primary,
       accessRole: c.accessRole
      }))
     });
    }
    let cached = calendarDb.getCalendars({ includeHidden: showHidden });
    const staleBefore = Date.now() - CALENDAR_STALE_MS2;
    const needsSync = cached.length === 0 || cached.some((cal) => {
     const meta = calendarDb.getCalendarSyncState?.(cal.id);
     return !meta?.lastFullSync || meta.lastFullSync < staleBefore;
    });
    if (needsSync && calendarSync?.performSync) {
     await calendarSync.performSync({ forceFull: cached.length === 0 });
     cached = calendarDb.getCalendars({ includeHidden: showHidden });
    }
    const calendars = cached.map((c) => ({
     id: c.id,
     summary: c.summary,
     description: c.description,
     timeZone: c.time_zone,
     primary: Boolean(c.primary_flag),
     accessRole: c.access_role
    }));
    return JSON.stringify({ success: true, calendars, from_cache: true });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/tools/list-events.js
 var DEFAULT_WINDOW_DAYS = 7;
 var listEventsTool = {
  name: "google-calendar-list-events",
  description: 'List events in a Google Calendar. Optional time range and max results. Use calendar_id "primary" for primary calendar.',
  input_schema: {
   type: "object",
   properties: {
    calendar_id: {
     type: "string",
     description: 'Calendar ID (use "primary" for primary calendar). Default: primary'
    },
    time_min: { type: "string", description: "Lower bound (RFC3339 or date) for event start" },
    time_max: { type: "string", description: "Upper bound (RFC3339 or date) for event end" },
    max_results: {
     type: "number",
     description: "Max number of events (default: 50)",
     minimum: 1,
     maximum: 2500
    },
    single_events: {
     type: "boolean",
     description: "Expand recurring events into instances (default: true)"
    },
    order_by: {
     type: "string",
     description: "Order by startTime or lastModified (default: startTime)",
     enum: ["startTime", "lastModified"]
    }
   },
   required: []
  },
  async execute(args) {
   try {
    const calendarFetch2 = globalThis.calendarFetch;
    const calendarDb = globalThis.googleCalendarDb;
    const calendarSync = globalThis.googleCalendarSync;
    if (!oauth.getCredential()) {
     return JSON.stringify({
      success: false,
      error: "Google Calendar not connected. Complete OAuth setup first."
     });
    }
    if (!calendarDb || !calendarSync?.performSync) {
     if (!calendarFetch2) {
      return JSON.stringify({ success: false, error: "Calendar API helper not available" });
     }
     const calendarId2 = args.calendar_id || "primary";
     const params = [];
     if (args.time_min)
      params.push(`timeMin=${encodeURIComponent(args.time_min)}`);
     if (args.time_max)
      params.push(`timeMax=${encodeURIComponent(args.time_max)}`);
     const maxResults2 = Math.min(Number(args.max_results) || 50, 2500);
     params.push(`maxResults=${maxResults2}`);
     if (args.single_events === true)
      params.push("singleEvents=true");
     else if (args.single_events === false)
      params.push("singleEvents=false");
     const orderBy = args.order_by || "startTime";
     params.push(`orderBy=${orderBy}`);
     const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId2)}/events?${params.join("&")}`;
     const response = await calendarFetch2(path);
     if (!response.success) {
      return JSON.stringify({
       success: false,
       error: response.error?.message || "Failed to list events"
      });
     }
     const data = response.data;
     return JSON.stringify({
      success: true,
      events: (data.items || []).map((ev) => ({
       id: ev.id,
       summary: ev.summary,
       description: ev.description,
       location: ev.location,
       start: ev.start,
       end: ev.end,
       status: ev.status,
       htmlLink: ev.htmlLink,
       attendees: ev.attendees
      })),
      next_page_token: data.nextPageToken || null
     });
    }
    const calendarId = args.calendar_id || "primary";
    const timeMinIso = args.time_min || new Date(Date.now() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1e3).toISOString();
    const timeMaxIso = args.time_max || new Date(Date.parse(timeMinIso) + DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1e3).toISOString();
    const startTs = Date.parse(timeMinIso);
    const endTs = Date.parse(timeMaxIso);
    const maxResults = Math.min(Number(args.max_results) || 50, 2500);
    calendarDb.recordRequestedRange?.(calendarId, startTs, endTs);
    let coverage = calendarDb.getEventsCoverage?.(calendarId, startTs, endTs);
    const needsCoverage = !coverage || !coverage.hasEvents || coverage.earliestStart == null || coverage.latestEnd == null || coverage.earliestStart > startTs || coverage.latestEnd < endTs;
    if (needsCoverage && calendarSync?.performSync) {
     await calendarSync.performSync({
      calendars: [calendarId],
      forceFull: !coverage?.hasEvents
     });
     coverage = calendarDb.getEventsCoverage?.(calendarId, startTs, endTs);
    }
    const rows = calendarDb.getEventsForCalendar({
     calendarId,
     timeMin: timeMinIso,
     timeMax: timeMaxIso,
     limit: maxResults
    });
    const events = rows.map((ev) => ({
     id: ev.id,
     summary: ev.summary ?? void 0,
     description: ev.description ?? void 0,
     location: ev.location ?? void 0,
     start: JSON.parse(ev.start_json),
     end: JSON.parse(ev.end_json),
     status: ev.status ?? void 0,
     htmlLink: ev.html_link ?? void 0,
     attendees: ev.attendees_json ? JSON.parse(ev.attendees_json) : void 0
    }));
    return JSON.stringify({ success: true, events, from_cache: true });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/tools/get-event.js
 var getEventTool = {
  name: "google-calendar-get-event",
  description: "Get a single event by calendar ID and event ID.",
  input_schema: {
   type: "object",
   properties: {
    calendar_id: {
     type: "string",
     description: 'Calendar ID (use "primary" for primary calendar)'
    },
    event_id: { type: "string", description: "Event ID" }
   },
   required: ["calendar_id", "event_id"]
  },
  async execute(args) {
   try {
    const calendarFetch2 = globalThis.calendarFetch;
    const calendarDb = globalThis.googleCalendarDb;
    const calendarSync = globalThis.googleCalendarSync;
    if (!calendarFetch2) {
     return JSON.stringify({ success: false, error: "Calendar API helper not available" });
    }
    if (!oauth.getCredential()) {
     return JSON.stringify({
      success: false,
      error: "Google Calendar not connected. Complete OAuth setup first."
     });
    }
    const calendarId = args.calendar_id;
    const eventId = args.event_id;
    if (!calendarId || !eventId) {
     return JSON.stringify({ success: false, error: "calendar_id and event_id are required" });
    }
    if (calendarDb) {
     let cached = calendarDb.getEventById?.(calendarId, eventId);
     if (!cached && calendarSync?.performSync) {
      await calendarSync.performSync({ calendars: [calendarId], forceFull: false });
      cached = calendarDb.getEventById?.(calendarId, eventId);
     }
     if (cached) {
      return JSON.stringify({
       success: true,
       event: {
        id: cached.id,
        summary: cached.summary ?? void 0,
        description: cached.description ?? void 0,
        location: cached.location ?? void 0,
        status: cached.status ?? void 0,
        start: JSON.parse(cached.start_json),
        end: JSON.parse(cached.end_json),
        attendees: cached.attendees_json ? JSON.parse(cached.attendees_json) : void 0,
        htmlLink: cached.html_link ?? void 0
       },
       from_cache: true
      });
     }
    }
    const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const response = await calendarFetch2(path);
    if (!response.success) {
     return JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to get event"
     });
    }
    calendarDb?.bulkUpsertEvents?.(calendarId, [response.data]);
    return JSON.stringify({ success: true, event: response.data });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/tools/create-event.js
 var createEventTool = {
  name: "google-calendar-create-event",
  description: "Create a new event in a Google Calendar. Provide start/end as dateTime (RFC3339) or date (YYYY-MM-DD) for all-day.",
  input_schema: {
   type: "object",
   properties: {
    calendar_id: {
     type: "string",
     description: 'Calendar ID (use "primary" for primary calendar). Default: primary'
    },
    summary: { type: "string", description: "Event title/summary" },
    description: { type: "string", description: "Event description" },
    location: { type: "string", description: "Event location" },
    start_date_time: {
     type: "string",
     description: "Start time in RFC3339 (e.g. 2025-02-10T14:00:00Z) for timed events"
    },
    end_date_time: { type: "string", description: "End time in RFC3339 for timed events" },
    start_date: { type: "string", description: "Start date YYYY-MM-DD for all-day events" },
    end_date: { type: "string", description: "End date YYYY-MM-DD for all-day events" },
    time_zone: {
     type: "string",
     description: "IANA time zone (e.g. America/New_York) for start/end"
    },
    attendees: {
     type: "array",
     items: { type: "string" },
     description: "List of attendee email addresses"
    }
   },
   required: ["summary"]
  },
  execute(args) {
   const calendarFetch2 = globalThis.calendarFetch;
   const calendarDb = globalThis.googleCalendarDb;
   if (!calendarFetch2) {
    return Promise.resolve(JSON.stringify({ success: false, error: "Calendar API helper not available" }));
   }
   if (!oauth.getCredential()) {
    return Promise.resolve(JSON.stringify({
     success: false,
     error: "Google Calendar not connected. Complete OAuth setup first."
    }));
   }
   const calendarId = args.calendar_id || "primary";
   const hasStartDate = typeof args.start_date === "string" && args.start_date.length > 0;
   const hasEndDate = typeof args.end_date === "string" && args.end_date.length > 0;
   const hasStartDateTime = typeof args.start_date_time === "string" && args.start_date_time.length > 0;
   const hasEndDateTime = typeof args.end_date_time === "string" && args.end_date_time.length > 0;
   const allDayPair = hasStartDate && hasEndDate && !hasStartDateTime && !hasEndDateTime;
   const timedPair = hasStartDateTime && hasEndDateTime && !hasStartDate && !hasEndDate;
   if (!allDayPair && !timedPair) {
    if (hasStartDate && !hasEndDate) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "start_date requires end_date for all-day events"
     }));
    }
    if (hasEndDate && !hasStartDate) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "end_date requires start_date for all-day events"
     }));
    }
    if (hasStartDateTime && !hasEndDateTime) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "start_date_time requires end_date_time for timed events"
     }));
    }
    if (hasEndDateTime && !hasStartDateTime) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "end_date_time requires start_date_time for timed events"
     }));
    }
    if ((hasStartDate || hasEndDate) && (hasStartDateTime || hasEndDateTime)) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "Do not mix date (all-day) and dateTime (timed) fields; use either start_date/end_date or start_date_time/end_date_time"
     }));
    }
    return Promise.resolve(JSON.stringify({
     success: false,
     error: "Provide either start_date and end_date (all-day) or start_date_time and end_date_time (timed)"
    }));
   }
   const tz = args.time_zone || "UTC";
   let start2;
   let end;
   if (allDayPair) {
    const startDate = args.start_date;
    const endDate = args.end_date;
    if (startDate === endDate) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "start_date and end_date must differ (zero-length all-day events are not allowed)"
     }));
    }
    start2 = { date: startDate };
    end = { date: endDate };
   } else {
    const startDt = args.start_date_time;
    const endDt = args.end_date_time;
    if (startDt === endDt) {
     return Promise.resolve(JSON.stringify({
      success: false,
      error: "start_date_time and end_date_time must differ (zero-length events are not allowed)"
     }));
    }
    start2 = { dateTime: startDt, timeZone: tz };
    end = { dateTime: endDt, timeZone: tz };
   }
   const body = {
    summary: args.summary,
    description: args.description,
    location: args.location,
    start: start2,
    end,
    attendees: Array.isArray(args.attendees) ? args.attendees.map((email) => ({ email })) : void 0
   };
   const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
   return calendarFetch2(path, { method: "POST", body: JSON.stringify(body) }).then((response) => {
    if (!response.success) {
     return JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to create event"
     });
    }
    calendarDb?.bulkUpsertEvents?.(calendarId, [response.data]);
    return JSON.stringify({ success: true, event: response.data });
   }, (e) => JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }));
  }
 };

 // skills-ts-out/google-calendar/tools/update-event.js
 var updateEventTool = {
  name: "google-calendar-update-event",
  description: "Update an existing event. Only include fields to change. Start/end as dateTime (RFC3339) or date (YYYY-MM-DD) for all-day.",
  input_schema: {
   type: "object",
   properties: {
    calendar_id: {
     type: "string",
     description: 'Calendar ID (use "primary" for primary calendar)'
    },
    event_id: { type: "string", description: "Event ID to update" },
    summary: { type: "string", description: "New title/summary" },
    description: { type: "string", description: "New description" },
    location: { type: "string", description: "New location" },
    start_date_time: { type: "string", description: "New start (RFC3339)" },
    end_date_time: { type: "string", description: "New end (RFC3339)" },
    start_date: { type: "string", description: "New start date (YYYY-MM-DD) for all-day" },
    end_date: { type: "string", description: "New end date for all-day" },
    time_zone: { type: "string", description: "IANA time zone for start/end" },
    attendees: {
     type: "array",
     items: { type: "string" },
     description: "Replace attendees with these emails"
    }
   },
   required: ["calendar_id", "event_id"]
  },
  async execute(args) {
   try {
    const calendarFetch2 = globalThis.calendarFetch;
    const calendarDb = globalThis.googleCalendarDb;
    if (!calendarFetch2) {
     return JSON.stringify({ success: false, error: "Calendar API helper not available" });
    }
    if (!oauth.getCredential()) {
     return JSON.stringify({
      success: false,
      error: "Google Calendar not connected. Complete OAuth setup first."
     });
    }
    const calendarId = args.calendar_id;
    const eventId = args.event_id;
    if (!calendarId || !eventId) {
     return JSON.stringify({ success: false, error: "calendar_id and event_id are required" });
    }
    const body = {};
    if (args.summary != null)
     body.summary = args.summary;
    if (args.description != null)
     body.description = args.description;
    if (args.location != null)
     body.location = args.location;
    const hasStartDate = typeof args.start_date === "string" && args.start_date.length > 0;
    const hasStartDateTime = typeof args.start_date_time === "string" && args.start_date_time.length > 0;
    const hasEndDate = typeof args.end_date === "string" && args.end_date.length > 0;
    const hasEndDateTime = typeof args.end_date_time === "string" && args.end_date_time.length > 0;
    if (hasStartDate && hasStartDateTime) {
     return JSON.stringify({
      success: false,
      error: "Do not mix start_date and start_date_time; use one or the other"
     });
    }
    if (hasEndDate && hasEndDateTime) {
     return JSON.stringify({
      success: false,
      error: "Do not mix end_date and end_date_time; use one or the other"
     });
    }
    const tz = args.time_zone || "UTC";
    if (hasStartDate) {
     body.start = { date: args.start_date };
    } else if (hasStartDateTime) {
     body.start = { dateTime: args.start_date_time, timeZone: tz };
    }
    if (hasEndDate) {
     body.end = { date: args.end_date };
    } else if (hasEndDateTime) {
     body.end = { dateTime: args.end_date_time, timeZone: tz };
    }
    if (Array.isArray(args.attendees)) {
     body.attendees = args.attendees.map((email) => ({ email }));
    }
    const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const response = await calendarFetch2(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!response.success) {
     return JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to update event"
     });
    }
    calendarDb?.bulkUpsertEvents?.(calendarId, [response.data]);
    return JSON.stringify({ success: true, event: response.data });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/tools/delete-event.js
 var deleteEventTool = {
  name: "google-calendar-delete-event",
  description: "Delete an event from a Google Calendar.",
  input_schema: {
   type: "object",
   properties: {
    calendar_id: {
     type: "string",
     description: 'Calendar ID (use "primary" for primary calendar)'
    },
    event_id: { type: "string", description: "Event ID to delete" }
   },
   required: ["calendar_id", "event_id"]
  },
  async execute(args) {
   try {
    const calendarFetch2 = globalThis.calendarFetch;
    const calendarDb = globalThis.googleCalendarDb;
    if (!calendarFetch2) {
     return JSON.stringify({ success: false, error: "Calendar API helper not available" });
    }
    if (!oauth.getCredential()) {
     return JSON.stringify({
      success: false,
      error: "Google Calendar not connected. Complete OAuth setup first."
     });
    }
    const calendarId = args.calendar_id;
    const eventId = args.event_id;
    if (!calendarId || !eventId) {
     return JSON.stringify({ success: false, error: "calendar_id and event_id are required" });
    }
    const path = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    const response = await calendarFetch2(path, { method: "DELETE" });
    if (!response.success) {
     return JSON.stringify({
      success: false,
      error: response.error?.message || "Failed to delete event"
     });
    }
    calendarDb?.deleteEvent?.(calendarId, eventId);
    return JSON.stringify({ success: true, deleted: true });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/tools/sync-now.js
 var syncNowTool = {
  name: "google-calendar-sync-now",
  description: "Trigger an immediate Google Calendar sync to refresh cached calendars and events.",
  input_schema: {
   type: "object",
   properties: {
    force_full: {
     type: "boolean",
     description: "Force a full resync (ignores incremental sync tokens).",
     default: false
    },
    calendar_id: {
     type: "string",
     description: "Optional calendar ID to sync. Defaults to all calendars needing updates."
    }
   },
   required: []
  },
  async execute(args) {
   const sync = globalThis.googleCalendarSync;
   if (!oauth.getCredential()) {
    return JSON.stringify({ success: false, error: "Google Calendar not connected." });
   }
   if (!sync?.performSync) {
    return JSON.stringify({ success: false, error: "Sync engine unavailable" });
   }
   try {
    await sync.performSync({
     forceFull: Boolean(args.force_full),
     calendars: args.calendar_id ? [String(args.calendar_id)] : void 0
    });
    return JSON.stringify({ success: true });
   } catch (e) {
    return JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) });
   }
  }
 };

 // skills-ts-out/google-calendar/index.js
 async function init() {
  console.log(`[google-calendar] Initializing on ${platform.os()}`);
  if (typeof globalThis.initializeGoogleCalendarSchema === "function") {
   globalThis.initializeGoogleCalendarSchema();
  }
  const s = globalThis.getGoogleCalendarSkillState();
  const saved = state.get("config");
  if (saved) {
   s.config.credentialId = saved.credentialId || s.config.credentialId;
   s.config.userEmail = saved.userEmail || s.config.userEmail;
  }
  const isConnected = !!oauth.getCredential();
  console.log(`[google-calendar] Initialized. Connected: ${isConnected}`);
 }
 async function start() {
  console.log("[google-calendar] Starting skill...");
  publishSkillState();
  try {
   cron.register("google-calendar-sync", "0 */10 * * * *");
  } catch (e) {
   console.warn("[google-calendar] Failed to register sync cron", e);
  }
  try {
   await globalThis.googleCalendarSync?.performSync();
  } catch (err) {
   console.warn("[google-calendar] Initial sync failed:", err);
  }
 }
 async function stop() {
  console.log("[google-calendar] Stopping skill...");
  const s = globalThis.getGoogleCalendarSkillState();
  state.set("config", s.config);
  console.log("[google-calendar] Skill stopped");
  try {
   cron.unregister("google-calendar-sync");
  } catch {
  }
 }
 async function onSessionStart(args) {
  const s = globalThis.getGoogleCalendarSkillState();
  s.activeSessions.push(args.sessionId);
 }
 async function onSessionEnd(args) {
  const s = globalThis.getGoogleCalendarSkillState();
  const i = s.activeSessions.indexOf(args.sessionId);
  if (i > -1)
   s.activeSessions.splice(i, 1);
 }
 async function onCronTrigger(scheduleId) {
  if (scheduleId === "google-calendar-sync") {
   await globalThis.googleCalendarSync?.performSync();
  }
 }
 async function onOAuthComplete(args) {
  console.log(`[google-calendar] OAuth complete: ${args.provider}`);
  const s = globalThis.getGoogleCalendarSkillState();
  s.config.credentialId = args.credentialId;
  if (args.accountLabel)
   s.config.userEmail = args.accountLabel;
  state.set("config", s.config);
  publishSkillState();
 }
 async function onOAuthRevoked(_args) {
  const s = globalThis.getGoogleCalendarSkillState();
  s.config = { credentialId: "", userEmail: "" };
  state.set("config", s.config);
  publishSkillState();
 }
 async function onDisconnect() {
  oauth.revoke();
  const s = globalThis.getGoogleCalendarSkillState();
  s.config = { credentialId: "", userEmail: "" };
  state.delete("config");
  publishSkillState();
 }
 function publishSkillState() {
  const s = globalThis.getGoogleCalendarSkillState();
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
   lastError: s.lastApiError,
   sync_in_progress: s.syncInProgress,
   last_sync_time: s.lastSyncTime,
   last_synced_calendars: s.lastSyncedCalendars
  });
 }
 var _g = globalThis;
 _g.calendarFetch = globalThis.googleCalendarApi.calendarFetch;
 _g.publishGoogleCalendarState = publishSkillState;
 var tools = [
  listCalendarsTool,
  listEventsTool,
  getEventTool,
  createEventTool,
  updateEventTool,
  deleteEventTool,
  syncNowTool
 ];
 var skill = {
  info: {
   id: "google-calendar",
   name: "Google Calendar",
   version: "1.0.0",
   description: "Google Calendar integration",
   auto_start: false,
   setup: { required: true, label: "Google Calendar" }
  },
  tools,
  init,
  start,
  stop,
  onSessionStart,
  onSessionEnd,
  onOAuthComplete,
  onOAuthRevoked,
  onDisconnect,
  onCronTrigger
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
