#!/usr/bin/env node
/**
 * Transform ingredient lines in .nt recipe files by wrapping each ingredient
 * (including quantity) in square brackets.
 *
 * Usage: node bracket_ingredients.js static/recepty_0.nt static/recepty_1.nt
 */

import { readFileSync, writeFileSync } from 'fs';

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const PREP_PARTICIPLE =
    'nakrájen[aáéý]|rozkrájen[aáéý]|nastrouhan[aáéý]|nasekan[aáéý]|' +
    'nastrúhan[aáéý]|umyt[aáéý]|oloupan[aáéý]|rozmixovan[aáéý]|' +
    'přecezen[aáéý]|nadroben[aáéý]|uvařen[aáéý]|upečen[aáéý]|' +
    'orestovan[aáéý]|osmahnut[aáéý]|propláchnut[aáéý]|prolisovan[aáéý]|' +
    'nakrájenou|nastrouhan[eé]|nasekan[eé]';

const PREP_ADVERB = 'najemno|nahrubo|nadrobno';

const IMPERATIVE_VERBS =
    'nastrouhej|oloupej|nakrájej|rozkrájej|nasekej|rozmíchej';

// ---------------------------------------------------------------------------
// findBracketEnd – return the index where the ingredient name/qty ends
// ---------------------------------------------------------------------------

function findBracketEnd(text) {
    const candidates = [];

    function tryPush(re) {
        const m = re.exec(text);
        if (m && m.index > 0) candidates.push(m.index);
    }

    // parenthetical note: wrap before ' ('
    tryPush(/\s*\(/u);

    // "nebo" / "či" alternatives
    tryPush(/\s+nebo\s/u);
    tryPush(/\s+či\s/u);

    // prep-participle followed by na/do/adverb
    tryPush(new RegExp(
        `\\s+(${PREP_PARTICIPLE})\\s+(?:na\\b|do\\b|${PREP_ADVERB})`, 'iu'
    ));

    // standalone celý/celá/celé at end or before (
    tryPush(/\s+cel[áýé]\s*($|\()/u);

    // em-dash
    tryPush(/\s+[–—]\s+/u);

    // hyphen-dash followed by 2+ uppercase letters
    tryPush(/\s+-\s+[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ]{2,}/u);

    // imperative verbs
    tryPush(new RegExp(`\\s+(${IMPERATIVE_VERBS})\\b`, 'iu'));

    // prep adverbs
    tryPush(new RegExp(`\\s+(${PREP_ADVERB})\\b`, 'u'));

    return candidates.length > 0 ? Math.min(...candidates) : text.length;
}

// ---------------------------------------------------------------------------
// splitOutsideParens – split at commas that are outside parentheses
// ---------------------------------------------------------------------------

function splitOutsideParens(text) {
    const parts = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '(') {
            depth++;
            current += ch;
        } else if (ch === ')') {
            depth--;
            current += ch;
        } else if (ch === ',' && depth === 0) {
            const lookahead = text.slice(i + 1).trimStart();
            // Don't split if the next part is a quantity suffix
            if (
                lookahead.startsWith('tj.') ||
                lookahead.startsWith('resp.') ||
                lookahead.startsWith('popř.') ||
                lookahead.startsWith('event.') ||
                /^[\d½¼¾]/u.test(lookahead) ||
                lookahead.startsWith('cca ')
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

// ---------------------------------------------------------------------------
// transformSinglePart – wrap one ingredient token
// ---------------------------------------------------------------------------

function transformSinglePart(text) {
    text = text.trim();
    if (!text) return text;
    if (text.includes('[')) return text;  // already bracketed

    const end = findBracketEnd(text);
    const main = text.slice(0, end).trim();
    const rest = text.slice(end).trim();

    return rest ? `[${main}] ${rest}` : `[${main}]`;
}

// ---------------------------------------------------------------------------
// splitAtInternalDigit – further split parts like "pepř 3 bobkové listy"
// into ["pepř", "3 bobkové listy"] where a bare single-word ingredient
// is immediately followed by a quantity (missing comma in original text).
// Only fires when the word before the digit is a single word with no digits.
// ---------------------------------------------------------------------------

function splitAtInternalDigit(parts) {
    const result = [];
    for (const part of parts) {
        const trimmed = part.trim();
        // Already starts with a quantity — don't touch
        if (/^[\d½¼¾]/u.test(trimmed) || trimmed.startsWith('cca ')) {
            result.push(part);
            continue;
        }
        // Match: single word (no spaces) then space then digit
        const m = /^(\S+)\s+(\d.*)$/u.exec(trimmed);
        if (m) {
            result.push(m[1], m[2]);
        } else {
            result.push(part);
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// transformIngredientLine – transform "          - some text"
// ---------------------------------------------------------------------------

function transformIngredientLine(line) {
    const m = /^(\s*-\s)(.*)$/u.exec(line);
    if (!m) return line;

    const prefix = m[1];
    const content = m[2];

    if (!content.trim() || content.includes('[')) return line;

    const parts = splitAtInternalDigit(splitOutsideParens(content));

    if (parts.length > 1) {
        return prefix + parts.map(transformSinglePart).join(', ');
    }
    return prefix + transformSinglePart(content);
}

// ---------------------------------------------------------------------------
// processFile – walk lines and transform ingredient sections
// ---------------------------------------------------------------------------

function processFile(content) {
    const lines = content.split('\n');
    const result = [];
    let inIngredient = false;
    let itemIndent = null;

    for (const line of lines) {
        const stripped = line.trim();

        // Detect "        Ingredience:" key
        const headerMatch = /^(\s+)Ingredience:\s*$/.exec(line);
        if (headerMatch) {
            inIngredient = true;
            itemIndent = headerMatch[1].length + 2; // expected indent of list items
            result.push(line);
            continue;
        }

        if (inIngredient) {
            if (!stripped) {
                result.push(line);
                continue;
            }

            if (stripped === '[]') {
                result.push(line);
                inIngredient = false;
                continue;
            }

            const currentIndent = line.length - line.trimStart().length;

            if (currentIndent === itemIndent && stripped.startsWith('- ')) {
                result.push(transformIngredientLine(line));
                continue;
            }

            // Different indent or new key — exit section
            inIngredient = false;
        }

        result.push(line);
    }

    return result.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error('Usage: node bracket_ingredients.js <file1.nt> [file2.nt ...]');
    process.exit(1);
}

for (const filepath of files) {
    const content = readFileSync(filepath, 'utf8');
    const newContent = processFile(content);
    writeFileSync(filepath, newContent, 'utf8');
    console.log(`Processed: ${filepath}`);
}
