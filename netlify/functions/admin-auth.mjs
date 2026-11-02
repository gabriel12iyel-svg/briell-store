function base64url(data) {
  return btoa(data)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return base64url(
    String.fromCharCode(...new Uint8Array(signature))
  );
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { password } = await req.json();
    const adminPassword = Netlify.env.get("ADMIN_PASSWORD");
    const secret = Netlify.env.get("ADMIN_SECRET");

    if (!adminPassword || !secret) {
      throw new Error("Konfigurasi admin belum lengkap");
    }

    if (password !== adminPassword) {
      return Response.json(
        { message: "Password salah." },
        { status: 401 }
      );
    }

    const payload = base64url(JSON.stringify({
      exp: Date.now() + 8 * 60 * 60 * 1000
    }));

    const signature = await sign(payload, secret);

    return Response.json({
      token: payload + "." + signature
    });
  } catch {
    return Response.json(
      { message: "Login gagal. Periksa konfigurasi admin." },
      { status: 500 }
    );
  }
};
