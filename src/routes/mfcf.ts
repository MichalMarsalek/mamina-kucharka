interface Line {
	indent: number;
	key: string;
	value: string;
}

export function parseMfcf(source: string): object[] {
	const result = [];
	let lastObject: any = {};
	let key = null;
	for (const line of source.split('\n')) {
		const match = /^(\p{L}+):(.*)/u.exec(line);
		if (match) {
			key = match[1];
			if (key in lastObject) {
				result.push(lastObject);
				lastObject = {};
			}
			lastObject[key] = match[2].trim();
		} else {
			if (key == null) return [];
			lastObject[key] = ((lastObject[key] ?? '') + '\n' + line).trim();
		}
	}
	result.push(lastObject);
	return result;
}

function getLines(source: string): Line[] {
	return source.split("\n").map(line =>)
}
