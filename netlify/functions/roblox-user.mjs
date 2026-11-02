// Netlify Function: lookup username Roblox dan URL avatar headshot.
// Endpoint ini tidak memerlukan API key Roblox.
export default async (request) => {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    "access-control-allow-origin": "*"
  };

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers
    });
  }

  const url = new URL(request.url);
  const username = (url.searchParams.get("username") || "").trim();

  if (!username || username.length > 20) {
    return new Response(JSON.stringify({ error: "Username tidak valid." }), {
      status: 400, headers
    });
  }

  try {
    const userResponse = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: "Roblox sedang tidak bisa dihubungi. Coba lagi." }), {
        status: 502, headers
      });
    }

    const userData = await userResponse.json();
    const user = userData?.data?.[0];

    if (!user) {
      return new Response(JSON.stringify({ error: "Username Roblox tidak ditemukan." }), {
        status: 404, headers
      });
    }

    const thumbUrl = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
    thumbUrl.searchParams.set("userIds", String(user.id));
    thumbUrl.searchParams.set("size", "150x150");
    thumbUrl.searchParams.set("format", "Png");
    thumbUrl.searchParams.set("isCircular", "false");

    const thumbResponse = await fetch(thumbUrl);
    if (!thumbResponse.ok) {
      return new Response(JSON.stringify({ error: "Akun ditemukan, tetapi avatar gagal dimuat." }), {
        status: 502, headers
      });
    }

    const thumbData = await thumbResponse.json();
    const avatarUrl = thumbData?.data?.[0]?.imageUrl;

    if (!avatarUrl) {
      return new Response(JSON.stringify({ error: "Avatar akun ini belum tersedia." }), {
        status: 404, headers
      });
    }

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName || user.name
      },
      avatarUrl
    }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "Server gagal mengambil data Roblox. Coba lagi." }), {
      status: 502, headers
    });
  }
};
