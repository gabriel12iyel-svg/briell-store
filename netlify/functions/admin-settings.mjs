
import { getStore } from "@netlify/blobs";

const store = getStore("briell-admin-settings");

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  // Authentication will be connected to
  // the existing admin-auth.mjs session.

  try {
    if (req.method === "GET") {
      const settings = await store.get("settings", {
        type: "json"
      });

      return new Response(
        JSON.stringify({
          success: true,
          settings: settings || {}
        }),
        { status: 200, headers }
      );
    }

    const data = await req.json();

    if (!data || typeof data !== "object" ||
        Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: "Invalid settings" }),
        { status: 400, headers }
      );
    }

    const serialized = JSON.stringify(data);

    if (serialized.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Settings too large" }),
        { status: 413, headers }
      );
    }

    await store.setJSON("settings", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pengaturan berhasil disimpan"
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Gagal memproses pengaturan" }),
      { status: 500, headers }
    );
  }
};
