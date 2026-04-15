import { ExtensionMessage } from "./types";

// Local variables -------------------------------------------------------------
let audioElement = new Audio();
let shouldPlay = false;

// Event listeners -------------------------------------------------------------
chrome.runtime.onMessage.addListener(function (request: ExtensionMessage, _sender, sendResponse) {
	if (!request) return;

	const { id, payload, offscreen } = request;
	if (!offscreen) return;

	const handler = handlers[id as keyof typeof handlers];
	if (!handler) return;
	handler(payload).then(sendResponse);

	return true;
});

// Handlers --------------------------------------------------------------------
const handlers = {
	play: function (payload?: unknown): Promise<string> {
		const { audioUri } = (payload ?? {}) as { audioUri?: string };
		return new Promise((resolve, reject) => {
			if (!audioUri) {
				reject(new Error("No audioUri provided"));
				return;
			}

			console.log("Attempting to play audio URI:", audioUri.substring(0, 100) + "...");
			console.log("Audio URI length:", audioUri.length);

			shouldPlay = true;

			audioElement.src = audioUri;
			audioElement.onloadedmetadata = function () {
				console.log("Audio metadata loaded successfully");
				if (!shouldPlay) {
					resolve("Playback was stopped before audio could start");
					return;
				}

				audioElement
					.play()
					.then(() => console.log("Audio playback started"))
					.catch((e) => {
						console.error("Play error:", e);
						reject(new Error(`Error while trying to play audio: ${e instanceof Error ? e.message : String(e)}`));
					});
			};

			audioElement.onerror = function (e) {
				console.error("Audio element error:", e);
				console.error("Audio element error details:", audioElement.error);
				reject(new Error(`Error loading audio source: ${audioElement.error?.message || "Unknown error"}`));
			};

			audioElement.onended = function () {
				console.log("Audio playback ended");
				resolve(`Finished playing`);
			};
		});
	},
	stop: function (): Promise<string> {
		return new Promise((resolve) => {
			shouldPlay = false;

			if (!audioElement.paused) {
				audioElement.pause();
				audioElement.currentTime = 0;

				resolve("Stopped audio");
				return;
			}

			resolve("No audio is currently playing");
		});
	},
};
