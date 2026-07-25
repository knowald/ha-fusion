<script lang="ts">
	import { connection, editMode } from '$lib/Stores';
	import { onDestroy } from 'svelte';

	/**
	 * * generic camera integration
	 *   - test with url: rtsp://rtsp-test-server.viomic.com:554/stream
	 *   - feed will use hls initially
	 *
	 * * install go2rtc with docker
	 *   - deploy 'alexxit/go2rtc' in host network mode
	 *
	 * Home Assistant's native WebRTC API uses a subscription to exchange the
	 * initial answer and ICE candidates. The media stream itself remains peer
	 * to peer between the browser and camera/provider.
	 */

	let {
		sel,
		entity,
		stream_url = $bindable(),
		muted = true,
		loaderVisible = $bindable(),
		controls = false,
		responsive = undefined,
		size,
		debug,
		attachVideo,
		allowEditStream = false
	}: {
		sel: any;
		entity: any;
		stream_url?: any | undefined;
		muted?: boolean | undefined;
		loaderVisible?: boolean | undefined;
		controls?: boolean | undefined;
		responsive?: boolean | undefined;
		size?: string | undefined;
		debug: boolean;
		attachVideo: boolean;
		allowEditStream?: boolean;
	} = $props();

	let video: HTMLVideoElement = $state(undefined as any);
	let busy: boolean = false;
	let peerConnection: RTCPeerConnection | undefined;
	let remoteStream: MediaStream | undefined;
	let unsubscribe: Promise<() => Promise<void>> | undefined;
	let sessionId: string | undefined;
	let pendingCandidates: RTCIceCandidate[] = [];
	let attempt = 0;

	type WebRtcEvent =
		| { type: 'session'; session_id: string }
		| { type: 'answer'; answer: string }
		| { type: 'candidate'; candidate: RTCIceCandidateInit }
		| { type: 'error'; message: string };

	interface WebRtcClientConfiguration {
		configuration?: RTCConfiguration;
		dataChannel?: string;
	}

	$effect(() => {
		if (attachVideo) {
			attach();
		} else {
			detach();
		}
	});

	async function attach() {
		if (stream_url || busy) return;
		const currentAttempt = ++attempt;
		busy = true;

		try {
			const conn = $connection;
			if (!conn || !entity?.entity_id) return;

			const clientConfig = await conn.sendMessagePromise<WebRtcClientConfiguration>({
				type: 'camera/webrtc/get_client_config',
				entity_id: entity.entity_id
			});
			if (currentAttempt !== attempt) return;

			peerConnection = new RTCPeerConnection(clientConfig.configuration);
			remoteStream = new MediaStream();
			stream_url = remoteStream;
			video.srcObject = remoteStream;

			// add transceivers for receiving audio and video
			if (clientConfig.dataChannel) peerConnection.createDataChannel(clientConfig.dataChannel);
			peerConnection.addTransceiver('audio', { direction: 'recvonly' });
			peerConnection.addTransceiver('video', { direction: 'recvonly' });

			peerConnection.addEventListener('track', (event) => {
				if (currentAttempt !== attempt) return;
				remoteStream?.addTrack(event.track);
				if (debug) console.debug('WebRTC attached:', entity?.entity_id);
			});

			peerConnection.addEventListener('icecandidate', (event) => {
				if (currentAttempt !== attempt || !event.candidate?.candidate || !entity?.entity_id) return;
				if (sessionId) {
					sendCandidate(event.candidate.toJSON(), currentAttempt);
				} else {
					pendingCandidates.push(event.candidate);
				}
			});

			const offer = await peerConnection.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: true
			});
			await peerConnection.setLocalDescription(offer);
			if (currentAttempt !== attempt || !offer.sdp) return;
			// Include candidates gathered before signaling starts in the SDP, then
			// exchange any later candidates through the session-specific command.
			const initialCandidates = pendingCandidates
				.splice(0)
				.map((candidate) => `a=${candidate.candidate}\r\n`)
				.join('');

			unsubscribe = conn.subscribeMessage<WebRtcEvent>(
				(event) => handleSignal(event, currentAttempt),
				{
					type: 'camera/webrtc/offer',
					entity_id: entity.entity_id,
					offer: offer.sdp + initialCandidates
				}
			);
		} catch (error) {
			if (currentAttempt === attempt) {
				console.error('Failed to start WebRTC stream:', error);
				detach();
			}
		} finally {
			if (currentAttempt === attempt) busy = false;
		}
	}

	function sendCandidate(candidate: RTCIceCandidateInit, candidateAttempt = attempt) {
		if (candidateAttempt !== attempt) return;
		const conn = $connection;
		if (!conn || !entity?.entity_id || !sessionId) return;
		conn
			.sendMessagePromise({
				type: 'camera/webrtc/candidate',
				entity_id: entity.entity_id,
				session_id: sessionId,
				candidate
			})
			.catch((error) => console.error('Failed to send WebRTC candidate:', error));
	}

	async function handleSignal(event: WebRtcEvent, signalAttempt: number) {
		if (signalAttempt !== attempt || !peerConnection) return;
		if (event.type === 'session') {
			sessionId = event.session_id;
			for (const candidate of pendingCandidates) sendCandidate(candidate.toJSON(), signalAttempt);
			pendingCandidates = [];
			return;
		}
		if (event.type === 'answer') {
			try {
				await peerConnection.setRemoteDescription({ type: 'answer', sdp: event.answer });
			} catch (error) {
				console.error('Failed to connect WebRTC stream:', error);
				detach();
			}
			return;
		}
		if (event.type === 'candidate') {
			try {
				// Some providers omit the media section identifier. HA's frontend
				// falls back to the first m-line for those candidates as well.
				const candidate =
					event.candidate.sdpMid || event.candidate.sdpMLineIndex !== undefined
						? new RTCIceCandidate(event.candidate)
						: new RTCIceCandidate({ ...event.candidate, sdpMid: '0' });
				await peerConnection.addIceCandidate(candidate);
			} catch (error) {
				console.error('Failed to add WebRTC candidate:', error);
			}
			return;
		}
		console.error('Failed to start WebRTC stream:', event.message);
		detach();
	}

	function detach() {
		attempt += 1;
		busy = false;
		sessionId = undefined;
		pendingCandidates = [];

		const activeUnsubscribe = unsubscribe;
		unsubscribe = undefined;
		activeUnsubscribe
			?.then((unsubscribe) => unsubscribe())
			.catch((error) => console.error('Failed to close WebRTC signaling:', error));

		remoteStream?.getTracks().forEach((track) => track.stop());
		remoteStream = undefined;
		peerConnection?.close();
		peerConnection = undefined;

		if (video) {
			video.srcObject = null;
			video.src = '';
			video.load();
		}

		stream_url = undefined;
		if (debug) console.debug('WebRTC detached:', entity?.entity_id);
	}

	onDestroy(() => detach());
</script>

<video
	bind:this={video}
	{muted}
	{controls}
	style:display={$editMode && !allowEditStream ? 'none' : 'initial'}
	style:visibility={stream_url ? 'visible' : 'hidden'}
	style:width={responsive ? '100%' : 'calc(14.5rem * 2 + 0.4rem)'}
	style:object-fit={size}
	autoplay={true}
	playsinline={true}
	onplay={() => {
		loaderVisible = false;
	}}
>
</video>

<style>
	video {
		position: absolute;
		height: 100%;
		z-index: 1;
	}
</style>
