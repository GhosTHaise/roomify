import puter from "@heyputer/puter.js";
import { createHostingSlug, HOSTING_CONFIG_KEY } from "./utils";

type HostingConfig = {
    subdomain: string;
}

type HostedAsset = { url : string }

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