
import { getStore } from "@netlify/blobs";
import { verifyAdmin } from "./_auth.mjs";

const store = getStore("briell-admin-settings");

const DEFAULTS = {
  storeName: "Briell Store",
  logoUrl: "",
  faviconUrl: "",
  bannerUrl: "",
  heroTitle: "TOP UP ROBUX",
  description: "Top up Robux dengan mudah, praktis, dan aman.",
  usernamePrice: 180,
  gamepassPrice: 170,
  maxRobux: 500,
  storeStatus: "open",

  colors: {
    background: "#04130c",
    panel: "#0b2116",
    accent: "#b7ff35",
    button: "#22e878",
    text: "#effff2",
    muted: "#9bb5a3"
  },

  icons: {
    home: "⌂",
    topup: "💎",
    orders: "📋",
    hero: "💎"
  },

  buttonText: "LANJUTKAN PESANAN"
};

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

export default async (req) => {
  try {
    if (req.method === "GET") {
      const saved = await store.get("settings", {
        type: "json"
      });

      return Response.json({
        success: true,
        settings: {
          ...DEFAULTS,
          ...(saved || {}),
          colors: {
            ...DEFAULTS.colors,
            ...(saved?.colors || {})
          },
          icons: {
            ...DEFAULTS.icons,
            ...(saved?.icons || {})
          }
        }
      }, { headers });
    }

    if (req.method === "POST") {
      if (!(await verifyAdmin(req))) {
        return Response.json(
          { message: "Akses ditolak." },
          { status: 401, headers }
        );
      }

      const data = await req.json();

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return Response.json(
          { message: "Pengaturan tidak valid." },
          { status: 400, headers }
        );
      }

      const clean = {
        storeName: String(data.storeName || DEFAULTS.storeName).slice(0, 60),
        logoUrl: String(data.logoUrl || "").slice(0, 1000),
        faviconUrl: String(data.faviconUrl || "").slice(0, 1000),
        bannerUrl: String(data.bannerUrl || "").slice(0, 1000),
        heroTitle: String(data.heroTitle || DEFAULTS.heroTitle).slice(0, 100),
        description: String(data.description || DEFAULTS.description).slice(0, 300),

        usernamePrice: Number(data.usernamePrice),
        gamepassPrice: Number(data.gamepassPrice),
        maxRobux: 500,

        storeStatus: data.storeStatus === "closed" ? "closed" : "open",

        colors: {},
        icons: {},
        buttonText: String(data.buttonText || DEFAULTS.buttonText).slice(0, 60)
      };

      if (
        !Number.isFinite(clean.usernamePrice) ||
        clean.usernamePrice < 1 ||
        clean.usernamePrice > 10000000 ||
        !Number.isFinite(clean.gamepassPrice) ||
        clean.gamepassPrice < 1 ||
        clean.gamepassPrice > 10000000
      ) {
        return Response.json(
          { message: "Harga Robux tidak valid." },
          { status: 400, headers }
        );
      }

      for (const key of Object.keys(DEFAULTS.colors)) {
        const value = data.colors?.[key];
        clean.colors[key] = /^#[0-9a-fA-F]{6}$/.test(value || "")
          ? value
          : DEFAULTS.colors[key];
      }

      for (const key of Object.keys(DEFAULTS.icons)) {
        clean.icons[key] = String(
          data.icons?.[key] ?? DEFAULTS.icons[key]
        ).slice(0, 20);
      }

      await store.setJSON("settings", clean);

      return Response.json({
        success: true,
        message: "Pengaturan berhasil disimpan.",
        settings: clean
      }, { headers });
    }

    return Response.json(
      { message: "Method tidak diizinkan." },
      { status: 405, headers }
    );

  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Terjadi kesalahan server." },
      { status: 500, headers }
    );
  }
};
