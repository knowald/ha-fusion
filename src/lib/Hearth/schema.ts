import * as v from 'valibot';

/*
 * Field-level schemas for the shapes that recur across card and widget types.
 * The TypeScript types in types.ts derive from these, so a change here is a
 * change everywhere. Messages read as the tail of an issue line, after the
 * path: "rooms[0].cards[0][1].entities[0].entity must be a non-empty string".
 */

export const EntityIdSchema = v.pipe(
	v.string('must be a non-empty string'),
	v.trim(),
	v.minLength(1, 'must be a non-empty string')
);

export const OptionalText = v.optional(v.string('must be text'));
export const OptionalEntityId = v.optional(EntityIdSchema);
export const OptionalFlag = v.optional(v.boolean('must be true or false'));
const FiniteNumber = v.pipe(v.number('must be a number'), v.finite('must be a finite number'));
export const OptionalNumber = v.optional(FiniteNumber);
export const OptionalTextList = v.optional(v.array(v.string('must be text'), 'must be a list'));
export const OptionalEntityIdList = v.optional(
	v.array(EntityIdSchema, 'must be a list of entity ids')
);

export function optionalNumberAtLeast(min: number) {
	return v.optional(v.pipe(FiniteNumber, v.minValue(min, `must be at least ${min}`)));
}

/** A card or widget height in px, matching normalizeHeight. */
export const HeightSchema = optionalNumberAtLeast(40);

/** YAML reads `active_state: on` as a boolean and `duration: 48` as a number; both are text here. */
const TextFromScalar = v.optional(
	v.pipe(
		v.union([v.string(), v.number(), v.boolean()], 'must be text'),
		v.transform((value) => String(value))
	)
);

/**
 * Ascending comfort thresholds for a numeric sensor: below `good` reads GOOD,
 * below `fair` reads FAIR, else POOR. `max` scales the banded track and
 * defaults to 1.5x `fair`.
 */
export const VerdictBandsSchema = v.pipe(
	v.object({
		good: v.number('must be a number'),
		fair: v.number('must be a number'),
		max: v.optional(v.number('must be a number'))
	}),
	v.check((bands) => bands.good < bands.fair, 'good must be below fair')
);

export const EntityRefSchema = v.object({
	entity: EntityIdSchema,
	name: OptionalText,
	icon: OptionalText,
	// per-entity presentation; falls back to the card's style when unset
	display: v.optional(v.picklist(['tile', 'stat'], 'must be tile or stat')),
	// display-only tile, for entities whose integration exposes no working
	// toggle (a PlayStation media_player, a read-only sensor)
	readonly: v.optional(v.boolean('must be true or false')),
	// overrides the containing entities card's slider update behavior
	slider_updates: v.optional(
		v.picklist(['continuous', 'release'], 'must be continuous or release')
	),
	// stat readouts judge known air sensors by device_class; false suppresses
	// that, custom bands extend it to any ascending numeric sensor
	verdict: v.optional(v.union([v.literal(false), VerdictBandsSchema], 'must be false or bands'))
});

export const SceneRefSchema = v.object({
	...EntityRefSchema.entries,
	// small caption under the name in the scene bar, replaced by "active" while
	// this scene is the active one
	caption: OptionalText,
	// marks the scene active while this entity holds active_state ('on' when
	// omitted); without it activity comes from which listed scene was applied
	// most recently
	active_entity: OptionalEntityId,
	active_state: TextFromScalar
});

export const VacuumModeRefSchema = v.object({
	...EntityRefSchema.entries,
	// what the mode covers, so a one-tap run is safe to commit to without
	// opening the vacuum app first
	detail: OptionalText,
	// expected run time, shown next to the detail
	duration: TextFromScalar,
	// tags the mode as the recommended one. It stays the same size and costs
	// the same single tap as the rest; the tag is the only difference
	default: v.optional(v.boolean('must be true or false'))
});

/**
 * Per-item visibility condition, mirroring the original's section conditions:
 * an entity state match, a numeric window on an entity, a media query, or an
 * `or` group of conditions. All conditions on an item AND together.
 */
export type VisibilityConditionInput =
	| { entity: string; state?: string; state_not?: string; above?: number; below?: number }
	| { media: string }
	| { or: VisibilityConditionInput[] };

export const VisibilityConditionSchema: v.GenericSchema<VisibilityConditionInput> = v.lazy(() =>
	v.union(
		[
			v.object({
				entity: EntityIdSchema,
				state: OptionalText,
				state_not: OptionalText,
				above: v.optional(v.number('must be a number')),
				below: v.optional(v.number('must be a number'))
			}),
			v.object({ media: v.string('must be a media query') }),
			v.object({ or: v.array(VisibilityConditionSchema, 'must be a list of conditions') })
		],
		'must name an entity, a media query or an or-group'
	)
);

/** Selects the night theme from a Home Assistant entity state. */
export const DayNightSwitchSchema = v.object({
	entity: EntityIdSchema,
	night_state: OptionalText
});

/** A one-tap Spotify shortcut on the media card. */
export const MediaShortcutSchema = v.object({
	name: v.pipe(v.string('must be text'), v.trim(), v.minLength(1, 'must not be empty')),
	uri: v.pipe(
		v.string('must be a Spotify URI'),
		v.trim(),
		v.startsWith('spotify:', 'must be a Spotify URI')
	),
	image_url: OptionalText
});

/** A list of entity references, as cards keep them. */
export const EntityRefListSchema = v.array(EntityRefSchema, 'must be a list');

export const VisibilityListSchema = v.optional(
	v.array(VisibilityConditionSchema, 'must be a list of conditions')
);

/** Fields every card carries besides its type's own; the type schema covers the rest. */
export const CardSharedSchema = v.looseObject({
	visibility: VisibilityListSchema,
	fill: optionalNumberAtLeast(0),
	height: HeightSchema
});

export const WidgetSharedSchema = v.looseObject({
	hide_mobile: OptionalFlag,
	visibility: VisibilityListSchema
});

export const StackSchema = v.looseObject({
	title: OptionalText,
	direction: v.optional(v.picklist(['horizontal', 'vertical'], 'must be horizontal or vertical')),
	fill: optionalNumberAtLeast(0)
});

export const RoomSchema = v.looseObject({
	name: OptionalText,
	icon: OptionalText,
	summary: OptionalText,
	temp_entity: OptionalEntityId,
	humidity_entity: OptionalEntityId,
	hide_header: OptionalFlag,
	fill_screen: OptionalFlag,
	columns: v.optional(
		v.pipe(
			v.number('must be a number'),
			v.integer('must be a whole number'),
			v.minValue(1, 'must be 1 to 3'),
			v.maxValue(3, 'must be 1 to 3')
		)
	)
});

// v.record alone accepts arrays, which are objects to it
const ThemeSchema = v.pipe(
	v.custom<Record<string, unknown>>(
		(value) => !!value && typeof value === 'object' && !Array.isArray(value),
		'must be a mapping of tokens'
	),
	v.record(v.string(), v.string('must be text'))
);

/** Root settings; `rail` and `rooms` are walked item by item by the issue checker. */
export const RootSettingsSchema = v.looseObject({
	theme: v.optional(ThemeSchema),
	theme_night: v.optional(ThemeSchema),
	day_night: v.optional(DayNightSwitchSchema),
	screensaver_minutes: optionalNumberAtLeast(1),
	screensaver_drift: OptionalFlag,
	screensaver_brightness: v.optional(
		v.pipe(FiniteNumber, v.minValue(10, 'must be 10 to 100'), v.maxValue(100, 'must be 10 to 100'))
	),
	keep_screen_on: OptionalFlag,
	padding_x: optionalNumberAtLeast(0),
	padding_y: optionalNumberAtLeast(0)
});

/**
 * Formats a valibot issue as "path suffix message", with array indices in
 * brackets so it reads like the rest of the editor's issue lines.
 */
export function issueLines(issues: v.BaseIssue<unknown>[], prefix: string): string[] {
	return issues.map((issue) => {
		const path = (issue.path ?? [])
			.map((segment) => (typeof segment.key === 'number' ? `[${segment.key}]` : `.${segment.key}`))
			.join('');
		// a missing required key surfaces as an object issue on that key
		const message = issue.message.startsWith('Invalid key:') ? 'is required' : issue.message;
		// root-level issues have no prefix, so the path loses its leading dot
		return `${prefix}${prefix ? path : path.replace(/^\./, '')} ${message}`;
	});
}
