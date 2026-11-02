import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { verifyAdmin } from "./_auth.mjs";

const store = getStore("briell-orders");
const PRICE = 100;
const ALLOWED_AMOUNTS = [50,100,150,200,250,300,400,500];
const STATUSES = ["pending","paid","processing","completed","cancelled"];

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

export default async (req) => {
  try {
    if (req.method === "GET") {
      if (!(await verifyAdmin(req))) {
        return Response.json({ message: "Akses ditolak" }, { status: 401, headers });
      }

      const result = await store.list();
      const orders = [];

      for (const item of result.blobs) {
        const order = await store.get(item.key, { type: "json" });
        if (order) orders.push(order);
      }

      orders.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
      return Response.json({ success: true, orders }, { headers });
    }

    if (req.method === "POST") {
      const data = await req.json();

      if (
        typeof data.username !== "string" ||
        data.username.trim().length < 3 ||
        data.username.trim().length > 50 ||
        !ALLOWED_AMOUNTS.includes(Number(data.robux)) ||
        typeof data.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
        typeof data.paymentMethod !== "string" ||
        data.paymentMethod.length > 40 ||
        typeof data.whatsapp !== "string" ||
        data.whatsapp.length > 25
      ) {
        return Response.json({ message: "Data pesanan tidak valid" }, { status: 400, headers });
      }

      const id = randomUUID();
      const robux = Number(data.robux);
      const now = new Date().toISOString();

      const order = {
        id,
        type: data.type === "Via Gamepass" ? "Via Gamepass" : "Via Username",
        username: data.username.trim(),
        displayName: String(data.displayName || "").slice(0,60),
        userId: String(data.userId || "").slice(0,30),
        email: data.email.slice(0,100),
        whatsapp: data.whatsapp,
        robux,
        amount: robux * PRICE,
        paymentMethod: data.paymentMethod,
        gamepass: String(data.gamepass || "").slice(0,500),
        status: "pending",
        createdAt: now,
        updatedAt: now
      };

      await store.setJSON(id, order);

      return Response.json({
        success: true,
        orderId: id,
        order
      }, { status: 201, headers });
    }

    if (req.method === "PATCH") {
      if (!(await verifyAdmin(req))) {
        return Response.json({ message: "Akses ditolak" }, { status: 401, headers });
      }

      const data = await req.json();

      if (typeof data.id !== "string" || !STATUSES.includes(data.status)) {
        return Response.json({ message: "Data status tidak valid" }, { status: 400, headers });
      }

      const order = await store.get(data.id, { type: "json" });
      if (!order) {
        return Response.json({ message: "Pesanan tidak ditemukan" }, { status: 404, headers });
      }

      order.status = data.status;
      order.updatedAt = new Date().toISOString();
      await store.setJSON(data.id, order);

      return Response.json({ success: true, order }, { headers });
    }

    return Response.json({ message: "Method not allowed" }, { status: 405, headers });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Terjadi kesalahan server" }, { status: 500, headers });
  }
};
