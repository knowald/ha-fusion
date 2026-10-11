import type { OverviewCard, RailWidget } from './config';

export function cardNeedsConfiguration(card: OverviewCard): boolean {
	switch (card.type) {
		case 'temperature':
		case 'media':
		case 'vacuum':
		case 'camera':
		case 'image':
		case 'climate':
			return !card.entity;
		case 'entities':
			return card.entities.length === 0 && !card.wildcard?.trim();
		case 'scenes':
			return card.scenes.length === 0;
		case 'fusion':
			return !card.config?.type;
		case 'header':
			return false;
	}
}

export function cardConfigurationLabel(card: OverviewCard): string {
	return `${card.type === 'fusion' ? 'Fusion' : card.type[0].toUpperCase() + card.type.slice(1)} card`;
}

export function railWidgetNeedsConfiguration(widget: RailWidget): boolean {
	switch (widget.type) {
		case 'weather':
		case 'energy':
		case 'entity':
			return !widget.entity;
		case 'progress':
			return !widget.status_entity;
		case 'calendar':
			return !widget.entities?.length;
		case 'fusion':
			return !widget.config?.type;
		default:
			return false;
	}
}

export function railConfigurationLabel(widget: RailWidget): string {
	return `${widget.type === 'fusion' ? 'Fusion' : widget.type[0].toUpperCase() + widget.type.slice(1)} widget`;
}
