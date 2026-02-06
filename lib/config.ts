// Config
export const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://"
export const rootDomain = process.env.ROOT_DOMAIN || "localhost:3000"
