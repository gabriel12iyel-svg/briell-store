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
        JSON.stringify({ error: "Username wajib diisi." }),
        { status: 400, headers }
      );
    }

    const userResponse = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: {
