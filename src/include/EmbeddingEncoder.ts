import base64js from "base64-js";

export default class EmbeddingEncoder {
	static encode(embedding: number[]): string {
		const buffer = Buffer.alloc(embedding.length * 4);
		for (let i = 0; i < embedding.length; i++) {
			buffer.writeFloatLE(embedding[i], i * 4);
		}
		return base64js.fromByteArray(buffer);
	}

	static decode(base64Str: string): number[] {
		const byteArray = base64js.toByteArray(base64Str);
		const buffer = Buffer.from(byteArray);
		const floatArray = [];
		for (let i = 0; i < buffer.length; i += 4) {
			floatArray.push(buffer.readFloatLE(i));
		}
		return floatArray;
	}
}
