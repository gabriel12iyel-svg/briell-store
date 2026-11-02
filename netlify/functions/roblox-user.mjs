
export const handler = async function(event) {
  const name = (event.queryStringParameters?.username || "").trim();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60"
  };

  const reply = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (!name) {
    return reply(400, { error: "Username kosong." });
  }

  try {
    const userResponse = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [name],
          excludeBannedUsers: false
        })
      }
    );

    if (!userResponse.ok) {
      return reply(502, { error: "Gagal menghubungi Roblox." });
    }

    const userData = await userResponse.json();
    const user = userData.data?.[0];

    if (!user) {
      return reply(404, { error: "Username Roblox tidak ditemukan." });
    }

    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );

    if (!avatarResponse.ok) {
      return reply(502, { error: "Gagal mengambil avatar Roblox." });
    }

    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data?.[0]?.imageUrl;

    if (!avatarUrl) {
      return reply(404, { error: "Avatar tidak tersedia." });
    }

    return reply(200, {
      id: user.id,
      username: user.name,
      displayName: user.displayName,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    return reply(500, {
      error: "Terjadi kesalahan saat mencari akun Roblox."
    });
  }
};
