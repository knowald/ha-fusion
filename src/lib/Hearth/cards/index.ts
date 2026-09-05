import type { OverviewCard, OverviewItem } from '../types';
import { isStack } from '../config';
import type { CardDescriptor } from './types';
import { cameraCard } from './camera/descriptor';
import { climateCard } from './climate/descriptor';
import { entitiesCard } from './entities/descriptor';
import { fusionCard } from './fusion/descriptor';
import { headerCard } from './header/descriptor';
import { imageCard } from './image/descriptor';
import { mediaCard } from './media/descriptor';
import { scenesCard } from './scenes/descriptor';
import { temperatureCard } from './temperature/descriptor';
import { vacuumCard } from './vacuum/descriptor';

export type { CardDescriptor, CardDraft, CardEditorProps, CardFields } from './types';

/** Every card type, in gallery order. Register a new type here and nowhere else. */
export const CARD_TYPES: CardDescriptor<any>[] = [
	entitiesCard,
	headerCard,
	temperatureCard,
	mediaCard,
	vacuumCard,
	cameraCard,
	imageCard,
	climateCard,
	scenesCard,
	fusionCard
];

const BY_TYPE = new Map<string, CardDescriptor<any>>(CARD_TYPES.map((card) => [card.type, card]));

export function cardDescriptor<T extends OverviewCard>(type: T['type']): CardDescriptor<T>;
export function cardDescriptor(type: string): CardDescriptor<any> | undefined;
export function cardDescriptor(type: string) {
	return BY_TYPE.get(type);
}

export function cardNeedsConfiguration(card: OverviewCard): boolean {
	return cardDescriptor(card.type).needsConfiguration(card);
}

export function cardConfigurationLabel(card: OverviewCard): string {
	return `${cardDescriptor(card.type).name} card`;
}

/** Every entity id a card refers to. */
export function cardEntityIds(card: OverviewCard): string[] {
	return cardDescriptor(card.type).entityIds(card);
}

/**
 * How many shares of its column's leftover height an item takes. 0 means it
 * sizes to its content.
 */
export function fillWeight(item: OverviewItem): number {
	if (!isStack(item) && 'height' in item && item.height) return 0;
	if (typeof item.fill === 'number') return Math.max(0, item.fill);
	return !isStack(item) && cardDescriptor(item.type).fillByDefault ? 1 : 0;
}
