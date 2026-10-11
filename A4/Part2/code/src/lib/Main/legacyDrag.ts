type LegacyEntry = { id?: string | number; items?: LegacyEntry[]; sections?: LegacyEntry[] };

function matches(entry: LegacyEntry, id: string) {
	return String(entry.id) === id;
}

export function findLegacySection(sections: LegacyEntry[], id: string): LegacyEntry | undefined {
	for (const section of sections) {
		if (matches(section, id)) return section;
		const nested = section.sections && findLegacySection(section.sections, id);
		if (nested) return nested;
	}
}

function findSectionList(sections: LegacyEntry[], id: string): LegacyEntry[] | undefined {
	if (sections.some((section) => matches(section, id))) return sections;
	for (const section of sections) {
		if (!section.sections) continue;
		const found = findSectionList(section.sections, id);
		if (found) return found;
	}
}

function findItemList(sections: LegacyEntry[], id: string): LegacyEntry[] | undefined {
	for (const section of sections) {
		if (section.items?.some((item) => matches(item, id))) return section.items;
		if (!section.sections) continue;
		const found = findItemList(section.sections, id);
		if (found) return found;
	}
}

function transfer(
	source: LegacyEntry[],
	target: LegacyEntry[],
	id: string,
	newIndex: number,
	clone: ((entry: LegacyEntry) => LegacyEntry) | undefined
) {
	const sourceIndex = source.findIndex((entry) => matches(entry, id));
	if (sourceIndex < 0) return false;
	const entry = clone ? clone(source[sourceIndex]) : source.splice(sourceIndex, 1)[0];
	target.splice(newIndex, 0, entry);
	return true;
}

/** Moves or clones a section between the root and any existing stack. */
export function transferLegacySection(
	sections: LegacyEntry[],
	targetParentId: string | null,
	id: string,
	newIndex: number,
	clone?: (entry: LegacyEntry) => LegacyEntry
) {
	const source = findSectionList(sections, id);
	const target =
		targetParentId === null ? sections : findLegacySection(sections, targetParentId)?.sections;
	if (!source || !target) return false;
	return transfer(source, target, id, newIndex, clone);
}

/** Moves or clones an object between regular, nested, and scenes sections. */
export function transferLegacyItem(
	sections: LegacyEntry[],
	targetSectionId: string,
	id: string,
	newIndex: number,
	clone?: (entry: LegacyEntry) => LegacyEntry
) {
	const source = findItemList(sections, id);
	const targetSection = findLegacySection(sections, targetSectionId);
	if (!source || !targetSection) return false;
	const target = (targetSection.items ??= []);
	return transfer(source, target, id, newIndex, clone);
}
