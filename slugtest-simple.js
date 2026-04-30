const slugify = (x) => x.replace(/[\s\p{L}\d-]/gu, c => /[\s-]/.test(c) ? '-' : c).replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
console.log(slugify('O elektronické verzi'));
