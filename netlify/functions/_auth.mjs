
function decodeBase64Url(value) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Uint8Array.from(
    atob(base64),
    c => c.charCodeAt(0)
  );
}

export async function verifyAdmin(req) {
  try {
    const secret = Netlify.env.get("ADMIN_SECRET");
    if (!secret) return false;

    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return false;

    const token = header.slice(7);
    const parts = token.split(".");

    if (parts.length !== 2) return false;

    const [payload, signature] = parts;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload)
    );

    if (!valid) return false;

    const data = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload))
    );

    return Number.isFinite(data.exp) &&
      data.exp > Date.now();

  } catch {
    return false;
  }
}
