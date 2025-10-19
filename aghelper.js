// Komplett umgestaltete Encoding/Decoding-Funktionalität
// Funktionen umbenannt und Logik neu strukturiert

/**
 * Kodiert Parameter in das spezifische Format
 * 
 * Beispiel alte Nutzung:
 * encode(1, 0, 24, 1, "123;1;TestDevice")
 * 
 * Beispiel neue Nutzung:
 * p(1, 0, 24, 1, "123;1;TestDevice")
 */
const p = (a=0, b=0, c=0, d=0, e="") => {
  let x = 0;
  x |= (a & 7) << 21;
  x |= (b & 3) << 19;
  x |= (c & 0xfff) << 7;
  x |= (d & 0x1f) << 2;
  
  const hexVal = x.toString(16).padStart(6, "0");
  const msgLen = (hexVal.length + e.length + 1).toString(16).padStart(4, "0");
  
  return `!${msgLen}!${hexVal}!${e}`;
};

/**
 * Dekodiert den Header einer Nachricht
 * 
 * Beispiel alte Nutzung:
 * decodeheader("!0012!200c04!123;1;TestDevice")
 * 
 * Beispiel neue Nutzung:
 * q("!0012!200c04!123;1;TestDevice")
 */
const q = str => {
  if (typeof str !== 'string') str = str.toString("utf8");
  const parts = str.substring(1).split('!');
  
  const bitmask = parseInt(parts[1], 16);
  
  return {
    error: bitmask & 0x3,
    revision: (bitmask >> 2) & 0x1f,
    command: (bitmask >> 7) & 0xfff,
    method: (bitmask >> 19) & 0x3,
    protocol: (bitmask >> 21) & 0x7,
    length: parts[0],
    payload: parts[2]
  };
};

/**
 * Dekodiert eine vollständige Nachricht je nach Kommando
 * 
 * Beispiel alte Nutzung:
 * decode("!0012!200c04!123;1;TestDevice")
 * 
 * Beispiel neue Nutzung:
 * r("!0012!200c04!123;1;TestDevice")
 */
const r = msg => {
  const hdr = q(msg);
  const arr = hdr.payload.split(";");
  let res = {...hdr};
  
  const decoders = {
    24: arr => ({
      identification: +arr[0],
      group: +arr[1],
      name: arr[2]
    }),
    
    82: arr => ({
      index: +arr[0],
      name: arr[1],
      cutoff_lower: +arr[2],
      cutoff_upper: +arr[3]
    }),
    
    401: arr => ({
      portA_mode: +arr[0],
      portA_band: +arr[1],
      portA_inhibit: +arr[2],
      portA_antenna: +arr[3],
      portA_profile: +arr[4],
      portA_tx: +arr[5],
      portB_mode: +arr[6],
      portB_band: +arr[7],
      portB_inhibit: +arr[8],
      portB_antenna: +arr[9],
      portB_profile: +arr[10],
      portB_tx: +arr[11],
      stackReach: +arr[12]
    }),
    
    412: arr => {
      const output = {
        index: +arr[0],
        name: arr[1],
        mode: +arr[2],
        bands: []
      };
      
      const bits = parseInt(arr[3], 16);
      for (let i = 0; i < 16; i++) {
        output.bands.push((bits >> i) & 1);
      }
      
      return output;
    }
  };
  
  if (decoders[hdr.command]) {
    Object.assign(res, decoders[hdr.command](arr));
  }
  
  return res;
};

module.exports = {
  encode: p,
  decode: r,
  decodeheader: q
};


/*
// Beispiele für die Verwendung der Funktionen

// Beispiel 1: Device-Identifikation (Kommando 24)
const originalEncode1 = "Früher: " + encode(1, 0, 24, 1, "123;1;TestDevice");
const newEncode1 = "Jetzt: " + p(1, 0, 24, 1, "123;1;TestDevice");
console.log(originalEncode1);
console.log(newEncode1);

// Beispiel 2: Band-Konfiguration (Kommando 82)
const originalEncode2 = "Früher: " + encode(0, 1, 82, 0, "5;80m;3500000;3800000");
const newEncode2 = "Jetzt: " + p(0, 1, 82, 0, "5;80m;3500000;3800000");
console.log(originalEncode2); 
console.log(newEncode2);

// Beispiel für Dekodieren eines Headers
const originalDecodeHeader = "Früher: " + JSON.stringify(decodeheader("!0012!200c04!123;1;TestDevice"));
const newDecodeHeader = "Jetzt: " + JSON.stringify(q("!0012!200c04!123;1;TestDevice"));
console.log(originalDecodeHeader);
console.log(newDecodeHeader);

// Beispiel für vollständiges Dekodieren (Kommando 24)
const originalDecode = "Früher: " + JSON.stringify(decode("!0012!200c04!123;1;TestDevice"));
const newDecode = "Jetzt: " + JSON.stringify(r("!0012!200c04!123;1;TestDevice"));
console.log(originalDecode);
console.log(newDecode);

*/