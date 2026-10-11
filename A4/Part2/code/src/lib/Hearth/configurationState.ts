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

type RailWidgetPredicate = (widget: any) => boolean;

const WIDGET_CONFIG_VALIDATORS: Record<string, RailWidgetPredicate> = {
	weather: (w) => !w.entity,
	energy: (w) => !w.entity,
	entity: (w) => !w.entity,
	progress: (w) => !w.status_entity,
	calendar: (w) => !w.entities?.length,
	fusion: (w) => !w.config?.type,
	alert: (w) => !w.text?.trim() && !w.entity
};

export function railWidgetNeedsConfiguration(widget: RailWidget): boolean {
	const validator = WIDGET_CONFIG_VALIDATORS[widget.type];
	return validator ? validator(widget) : false;
}

export function railConfigurationLabel(widget: RailWidget): string {
	if (widget.type === 'alert') return 'Configure alert';
	return `${widget.type === 'fusion' ? 'Fusion' : widget.type[0].toUpperCase() + widget.type.slice(1)} widget`;
}
