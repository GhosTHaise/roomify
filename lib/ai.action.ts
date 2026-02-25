/**
 * Fetch an image from `url` and return a Data URL string.
 *
 * Steps:
 * 1. Use fetch to get the resource and throw if the response is not OK.
 * 2. Convert the response to a Blob.
 * 3. Use a FileReader to read the Blob as a Data URL and resolve with the result.
 */
export async function fetchAsDataUrl(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}

	const blob = await res.blob();

	return await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

			reader.onload = () => {
				const { result } = reader;
				if (typeof result === 'string') {
					resolve(result);
				} else {
					reject(new Error('Unexpected FileReader result type'));
				}
			};

		reader.onerror = () => {
			reject(reader.error ?? new Error('FileReader error'));
		};

		reader.readAsDataURL(blob);
	});
}
