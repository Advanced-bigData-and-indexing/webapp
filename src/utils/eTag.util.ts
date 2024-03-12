import crypto from "crypto";

export const generateEtag = (payload:any) => {
    return crypto
    .createHash("md5")
    .update(JSON.stringify(payload))
    .digest("hex");
}
