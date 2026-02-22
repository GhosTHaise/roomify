import puter from "@heyputer/puter.js";
import { createHostingSlug, fetchBlobFromUrl, getHostedUrl, getImageExtension, HOSTING_CONFIG_KEY, imageUrlToPngBlob, isHostedUrl } from "./utils";

export const getOrCreateHostingConfig = async () : Promise<HostingConfig | null> => {
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    if(existing?.subdomain){
         return {subdomain: existing.subdomain};
    }

    const subdomain = createHostingSlug()

    try {
        const create = await puter.hosting.create(subdomain,'.');

        return {subdomain: create.subdomain};

    } catch (error) {
        console.warn(`Could not create hosting config for ${subdomain}`, error);
        return null;
    }
}

export const uploadImageToHosting = async ({hosting,label,projectId,url} : StoreHostedImageParams): Promise<HostedAsset | null> => {
    if(!hosting || !url) return null;
    if(isHostedUrl(url)) return {url};

    try {
        const resolved = label === "rendered" ? await imageUrlToPngBlob(url).then(blob => blob ? { blob, contentType: "image/png" } : null) : await fetchBlobFromUrl(url);

        if(!resolved) return null;

        const contentType = resolved.contentType || resolved.blob.type || '';
        const ext = getImageExtension(contentType, url);
        const dir = `projects/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile = new File([resolved.blob],`${label}.${ext}`,{type: contentType});

        await puter.fs.mkdir(dir, {createMissingParents : true});
        await puter.fs.write(filePath, uploadFile);

        const hostedUrl = getHostedUrl({subdomain: hosting.subdomain},filePath);
        
        return hostedUrl ? { url : hostedUrl} : null;
    } catch (error) {
        console.warn(`Could not upload image to hosting ${hosting.subdomain}`, error);
        return null;
    }
}