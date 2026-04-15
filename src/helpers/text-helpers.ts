import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import he from "he";
import sanitizeHtml from "sanitize-html";

const nlp = winkNLP(model);

/**
 * Checks if text is valid SSML (wrapped in <speak> tags)
 */
export function isSSML(text: string): boolean {
	const trimmedText = text.trim();
	return trimmedText.startsWith("<speak>") && trimmedText.endsWith("</speak>");
}

/**
 * Chunks SSML text into smaller pieces while preserving tag structure
 * Maximum chunk size is 5000 characters to comply with AWS Polly limits
 */
export function chunkSSML(text: string): string[] {
	const maxChunkSize = 5000;
	const speakStartTag = "<speak>";
	const speakEndTag = "</speak>";
	const chunks = [];
	let currentChunk = "";

	const content = text.slice(speakStartTag.length, -speakEndTag.length);

	const regex = /(<[^>]*>|[^<]+)/g;
	let match;

	while ((match = regex.exec(content)) !== null) {
		const element = match[0];

		if (currentChunk.length + element.length > maxChunkSize - (speakStartTag.length + speakEndTag.length)) {
			chunks.push(speakStartTag + currentChunk + speakEndTag);
			currentChunk = "";
		}

		currentChunk += element;
	}

	if (currentChunk) {
		chunks.push(speakStartTag + currentChunk + speakEndTag);
	}

	return chunks;
}

/**
 * Chunks text into sentences, or SSML chunks if text is SSML
 */
export function chunkText(text: string): string[] {
	if (isSSML(text)) return chunkSSML(text);

	return nlp
		.readDoc(text)
		.sentences()
		.out();
}

/**
 * Sanitizes text for safe use in SSML synthesis
 * - If text is already valid SSML, returns it as-is
 * - Otherwise, removes HTML tags and escapes XML special characters
 * - Preserves line breaks and basic formatting
 */
export function sanitizeTextForSSML(text: string): string {
	if (!text) return "";

	// If text is already valid SSML, return as-is
	if (isSSML(text)) {
		return text;
	}

	// Use sanitize-html to safely strip ALL HTML content, keeping only text
	let sanitized = sanitizeHtml(text, {
		allowedTags: [], // Allow no HTML tags at all
		allowedAttributes: {}, // Allow no attributes
		textFilter: function (text) {
			return text;
		},
	});

	// Clean up whitespace
	sanitized = sanitized
		.replace(/\s+/g, " ") // Replace multiple spaces with single space
		.replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
		.trim();

	// Decode HTML entities first (e.g., &amp; -> &, &lt; -> <)
	sanitized = he.decode(sanitized);

	// Then escape XML special characters for SSML safety
	// Only escape the characters that are problematic for XML/SSML: < > & " '
	sanitized = sanitized
		.replace(/&/g, "&#x26;") // & must be escaped first
		.replace(/</g, "&#x3C;") // <
		.replace(/>/g, "&#x3E;") // >
		.replace(/"/g, "&#x22;") // "
		.replace(/'/g, "&#x27;"); // '

	return sanitized;
}
