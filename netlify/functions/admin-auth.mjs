export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { password } = await req.json();
    const secret = Netlify.env.get("ADMIN_PASSWORD");

    if (!secret || password !== secret) {
      return Response.json(
        { message: "Password admin salah." },
        { status: 401 }
      );
    }

    return Response.json(
      { message: "Password benar." },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { message: "Terjadi kesalahan." },
      { status: 400 }
    );
  }
};
