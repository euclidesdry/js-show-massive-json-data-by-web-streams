const API_URL = 'http://localhost:3000';
import { TransformStream } from 'node:stream/web';

async function consumeAPI(signal) {
	const response = await fetch(API_URL, {
		signal
	});

	let counter = 0;
	const reader = response.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(parseNDJSON())
	// .pipeTo(new WritableStream({
	// 	write(chunk) {
	// 		console.log(++counter, 'chunk', chunk);
	// 	}
	// }));

	return reader;
}

// this function will certify that in case of arrive two chunks, both came in a single transmission
// convert correctly to JSON format
function parseNDJSON() {
	let ndjsonBuffer = '';
	return new TransformStream({
		transform(chunk, controller) {
			ndjsonBuffer += chunk;
			const items = ndjsonBuffer.split('\n');
			items.slice(0, -1)
				.forEach(item => controller.enqueue(JSON.parse(item)));

			ndjsonBuffer = items[items.length - 1];
		},
		flush(controller) {
			if (!ndjsonBuffer) return;
			controller.enqueue(JSON.parse(ndjsonBuffer));
		}
	})
}

const abortController = new AbortController();
await consumeAPI(abortController.signal);
