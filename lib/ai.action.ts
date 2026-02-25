import puter from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constants";

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


export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith("data:")
        ? sourceImage : await fetchAsDataUrl(sourceImage)

    const base64Data = dataUrl.split(",")[1];
    const mimeType = dataUrl.split(";")[0].split(":")[1];

    if (!mimeType || !base64Data) {
        throw new Error("Invalid source image payload");
    }

    const response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 }
    });

    const rawImageUrl = (response as HTMLImageElement).src;

    if (!rawImageUrl) {
        return { renderedImage: null, renderedPath: undefined };
    }

    const renderedImage = rawImageUrl.startsWith("data:") ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);
    
    return { renderedImage, renderedPath: undefined };
}