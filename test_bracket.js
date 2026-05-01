const PREP_PARTICIPLE =
    'nakrájen[aáéý]|rozkrájen[aáéý]|nastrouhan[aáéý]|nasekan[aáéý]|' +
    'nastrúhan[aáéý]|umyt[aáéý]|oloupan[aáéý]|rozmixovan[aáéý]|' +
    'přecezen[aáéý]|nadroben[aáéý]|uvařen[aáéý]|upečen[aáéý]|' +
    'orestovan[aáéý]|osmahnut[aáéý]|propláchnut[aáéý]|prolisovan[aáéý]|' +
    'nakrájenou|nastrouhan[eé]|nasekan[eé]';
const PREP_ADVERB = 'najemno|nahrubo|nadrobno';
const IMPERATIVE_VERBS = 'nastrouhej|oloupej|nakrájej|rozkrájej|nasekej|rozmíchej';

function findBracketEnd(text) {
    const candidates = [];
    function tryPush(re) {
        const m = re.exec(text);
        if (m && m.index > 0) candidates.push(m.index);
    }
    tryPush(/\s*\(/u);
    tryPush(/\s+nebo\s/u);
    tryPush(/\s+či\s/u);
    tryPush(new RegExp(`\\s+(${PREP_PARTICIPLE})\\s+(?:na\\b|do\\b|${PREP_ADVERB})`, 'iu'));
    tryPush(/\s+cel[áýé]\s*($|\()/u);
    tryPush(/\s+[–—]\s+/u);
    tryPush(/\s+-\s+[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ]{2,}/u);
    tryPush(new RegExp(`\\s+(${IMPERATIVE_VERBS})\\b`, 'iu'));
    tryPush(new RegExp(`\\s+(${PREP_ADVERB})\\b`, 'u'));
    return candidates.length > 0 ? Math.min(...candidates) : text.length;
}

function splitOutsideParens(text) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '(') { depth++; current += ch; }
        else if (ch === ')') { depth--; current += ch; }
        else if (ch === ',' && depth === 0) {
            const la = text.slice(i + 1).trimStart();
            if (
                la.startsWith('tj.') || la.startsWith('resp.') ||
                la.startsWith('popř.') || la.startsWith('event.') ||
                /^[\d½¼¾]/u.test(la) || la.startsWith('cca ')
            ) {
                current += ch;
            } else {
                parts.push(current.trim());
                current = '';
            }
        } else {
            current += ch;
        }
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(p => p.length > 0);
}

function transformSinglePart(text) {
    text = text.trim();
    if (!text) return text;
    if (text.includes('[')) return text;
    const end = findBracketEnd(text);
    const main = text.slice(0, end).trim();
    const rest = text.slice(end).trim();
    return rest ? `[${main}] ${rest}` : `[${main}]`;
}

function splitAtInternalDigit(parts) {
    const result = [];
    for (const part of parts) {
        const trimmed = part.trim();
        if (/^[\d½¼¾]/u.test(trimmed) || trimmed.startsWith('cca ')) { result.push(part); continue; }
        const m = /^(\S+)\s+(\d.*)$/u.exec(trimmed);
        if (m) { result.push(m[1], m[2]); } else { result.push(part); }
    }
    return result;
}

function transformIngredientLine(line) {
    const m = /^(\s*-\s)(.*)$/u.exec(line);
    if (!m) return line;
    const prefix = m[1];
    const content = m[2];
    if (!content.trim() || content.includes('[')) return line;
    const parts = splitAtInternalDigit(splitOutsideParens(content));
    if (parts.length > 1) return prefix + parts.map(transformSinglePart).join(', ');
    return prefix + transformSinglePart(content);
}

const tests = [
    '          - 500 g kysaného zelí',
    '          - 1 nakrájená cibule (můžeš vynechat, ale pro chuť polévky je lepší rozmixovat ji na kaši)',
    '          - 1 lžíce cukru',
    '          - sůl, pepř 3 bobkové listy',
    '          - 1 kostka masoxu',
    '          - 2 klobásy nakrájené na půlky koleček (pro našeho Honzu bez kmínu)',
    '          - 2 větší brambory nakrájené na kostičky',
    '          - kmín celý (pro našeho Honzu NE! )',
    '          - 1 lžíce hladké mouky nebo bramborový či kukuřičný škrob',
    '          - 1 kelímek smetany ke šlehání',
    '          - sůl, pepř',
    '          - sůl, pepř, drcený kmín',
];
for (const t of tests) console.log(transformIngredientLine(t));
