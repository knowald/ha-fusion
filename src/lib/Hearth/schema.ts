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

const OptionalText = v.optional(v.string('must be text'));

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
	active_entity: OptionalText,
	active_state: OptionalText
});

export const VacuumModeRefSchema = v.object({
	...EntityRefSchema.entries,
	// what the mode covers, so a one-tap run is safe to commit to without
	// opening the vacuum app first
	detail: OptionalText,
	// expected run time, shown next to the detail
	duration: OptionalText,
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
		return `${prefix}${path} ${message}`;
	});
}
