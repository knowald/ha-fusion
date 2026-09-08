import { readable } from 'svelte/store';

/** Ticks once a second while subscribed. */
export const timer = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);
	set(new Date());
	return function stop() {
		clearInterval(interval);
	};
});
