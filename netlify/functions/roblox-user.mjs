export default async function handler(request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };

  try {
    const url = new URL(request.url);
    const username = (url.searchParams.get("username") || "").trim();

    if (!username) {
      return new Response(
        JSON.stringify({
          error: "Username wajib diisi."
        }),
        {
          status: 400,
          headers
        }
      );
    }

    // Cari akun Roblox berdasarkan username
    const userResponse = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      }
    );

    if (!userResponse.ok) {
      throw new Error("Gagal menghubungi API Roblox.");
    }

    const userData = await userResponse.json();
    const user = userData.data?.[0];

    // Jika username tidak ditemukan
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Username Roblox tidak ditemukan."
        }),
        {
          status: 404,
          headers
        }
      );
    }

    // Ambil avatar Roblox
    const avatarResponse = await fetch(
      "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" +
      user.id +
      "&size=150x150&format=Png&isCircular=false"
    );

    if (!avatarResponse.ok) {
      throw new Error("Gagal mengambil avatar Roblox.");
    }

    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data?.[0]?.imageUrl || "";

    // Kirim informasi akun ke website
    return new Response(
      JSON.stringify({
        userId: user.id,
        username: user.name,
        displayName: user.displayName || user.name,
        avatarUrl: avatarUrl
      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Terjadi kesalahan server."
      }),
      {
        status: 500,
        headers
      }
    );
  }
}
