// Cosmetic "fancy text" generators — pure unicode character substitution,
// no backend/AI involved. Each style maps A-Z / a-z / 0-9 to look-alike
// glyphs; anything else (spaces, punctuation, emoji, existing mentions)
// passes through untouched.
export type TextStyle = {
  id: string;
  label: string;
  sample: string;
  upper: string;
  lower: string;
  digits: string;
};

const A_Z = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const a_z = "abcdefghijklmnopqrstuvwxyz";
const d09 = "0123456789";

export const TEXT_STYLES: TextStyle[] = [
  { id: "normal", label: "Normal", sample: "Aa", upper: A_Z, lower: a_z, digits: d09 },
  {
    id: "bold",
    label: "Bold",
    sample: "𝐀𝐚",
    upper: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙",
    lower: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
    digits: "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  },
  {
    id: "italic",
    label: "Italic",
    sample: "𝐴𝑎",
    upper: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍",
    lower: "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    digits: d09,
  },
  {
    id: "script",
    label: "Script",
    sample: "𝓐𝓪",
    upper: "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩",
    lower: "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃",
    digits: "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  },
  {
    id: "double",
    label: "Double-struck",
    sample: "𝔸𝕒",
    upper: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ",
    lower: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
    digits: "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
  },
  {
    id: "mono",
    label: "Monospace",
    sample: "𝙰𝚊",
    upper: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉",
    lower: "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
    digits: "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  },
  {
    id: "circled",
    label: "Circled",
    sample: "Ⓐⓐ",
    upper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ",
    lower: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ",
    digits: "⓪①②③④⑤⑥⑦⑧⑨",
  },
  {
    id: "smallcaps",
    label: "Small caps",
    sample: "Aᴀ",
    upper: A_Z,
    lower: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ",
    digits: d09,
  },
];

export function applyTextStyle(text: string, styleId: string): string {
  const style = TEXT_STYLES.find((s) => s.id === styleId);
  if (!style || style.id === "normal") return text;
  // These replacement glyphs live outside the BMP (surrogate pairs), so index
  // by code point via spread rather than raw UTF-16 string indexing.
  const upperChars = [...style.upper];
  const lowerChars = [...style.lower];
  const digitChars = [...style.digits];
  return [...text]
    .map((ch) => {
      const upperIdx = A_Z.indexOf(ch);
      if (upperIdx !== -1) return upperChars[upperIdx] ?? ch;
      const lowerIdx = a_z.indexOf(ch);
      if (lowerIdx !== -1) return lowerChars[lowerIdx] ?? ch;
      const digitIdx = d09.indexOf(ch);
      if (digitIdx !== -1) return digitChars[digitIdx] ?? ch;
      return ch;
    })
    .join("");
}
