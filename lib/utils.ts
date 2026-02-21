import { v4 as uuidv4 } from 'uuid';


export const HOSTING_CONFIG_KEY = "roomify_hosting_config";
export const HOSTING_DOMAIN_SUFFIX = ".putter.site";


export const createHostingSlug = () => `roomify-${uuidv4()}`;